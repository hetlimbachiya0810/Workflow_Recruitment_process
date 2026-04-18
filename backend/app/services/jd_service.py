from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.models.recruitment import JobDescription, JDVendorAssignment
from app.models.parties import Vendor
from app.models.auth import User
from app.schemas.jd import JDCreate, JDUpdate, JDStatusUpdate, JDFloatRequest
from app.services.notification_service import create_notification
from app.core.audit import log_action

VALID_JD_STATUSES = {"received", "in_review", "sourcing", "shortlist_ready", "closed"}


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

def create_jd(db: Session, jd_data: JDCreate, created_by: int) -> JobDescription:
    """
    Create a new Job Description. Status defaults to 'received'.
    Only admin and recruiter roles may call this (enforced at router level).
    """
    jd = JobDescription(
        **jd_data.model_dump(),
        created_by=created_by,
        status="received"
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)

    log_action(
        db,
        user_id=created_by,
        action="create",
        entity_type="job_description",
        entity_id=jd.id,
        new_value=jd.title
    )
    return jd


# ---------------------------------------------------------------------------
# READ
# ---------------------------------------------------------------------------

def get_jds(
    db: Session,
    current_user: User,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[JobDescription]:
    """
    List JDs with role-based access filtering enforced at query level.

    - admin / recruiter : all JDs in the system
    - client            : only JDs belonging to their client profile
    - vendor            : only JDs actively assigned to them via jd_vendor_assignments
    """
    role = current_user.role.name

    if role in ("admin", "recruiter"):
        query = db.query(JobDescription)

    elif role == "client":
        if not current_user.client_profile:
            return []
        query = db.query(JobDescription).filter(
            JobDescription.client_id == current_user.client_profile.id
        )

    elif role == "vendor":
        if not current_user.vendor_profile:
            return []
        query = (
            db.query(JobDescription)
            .join(JDVendorAssignment, JDVendorAssignment.jd_id == JobDescription.id)
            .filter(
                JDVendorAssignment.vendor_id == current_user.vendor_profile.id,
                JDVendorAssignment.status == "active"
            )
        )

    else:
        return []

    if status_filter:
        query = query.filter(JobDescription.status == status_filter)

    return query.order_by(JobDescription.created_at.desc()).offset(skip).limit(limit).all()


def get_jd(db: Session, jd_id: int, current_user: User) -> JobDescription:
    """
    Fetch a single JD with role-based access enforcement.
    Raises 404 if not found, 403 if the caller has no access.
    """
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found")

    role = current_user.role.name

    if role in ("admin", "recruiter"):
        return jd

    if role == "client":
        if not current_user.client_profile or jd.client_id != current_user.client_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    elif role == "vendor":
        if not current_user.vendor_profile:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        assignment = db.query(JDVendorAssignment).filter(
            JDVendorAssignment.jd_id == jd_id,
            JDVendorAssignment.vendor_id == current_user.vendor_profile.id,
            JDVendorAssignment.status == "active"
        ).first()
        if not assignment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return jd


def get_jd_assignments(
    db: Session,
    jd_id: int,
    current_user: User
) -> List[JDVendorAssignment]:
    """
    Return all vendor assignments for a given JD.
    Only admin / recruiter may call this.
    """
    # Confirm the JD exists (also enforces access for the caller's role)
    get_jd(db, jd_id, current_user)

    return (
        db.query(JDVendorAssignment)
        .filter(JDVendorAssignment.jd_id == jd_id)
        .order_by(JDVendorAssignment.floated_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

def update_jd(
    db: Session,
    jd_id: int,
    jd_data: JDUpdate,
    current_user: User
) -> JobDescription:
    """Partial update of JD fields. Only admin / recruiter may call this."""
    jd = get_jd(db, jd_id, current_user)

    old_snapshot = {
        "title": jd.title,
        "status": jd.status,
        "description": jd.description[:80] if jd.description else None
    }

    update_data = jd_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(jd, field, value)

    db.commit()
    db.refresh(jd)

    log_action(
        db,
        user_id=current_user.id,
        action="update",
        entity_type="job_description",
        entity_id=jd.id,
        old_value=str(old_snapshot),
        new_value=str(update_data)
    )
    return jd


def update_jd_status(
    db: Session,
    jd_id: int,
    status_data: JDStatusUpdate,
    current_user: User
) -> JobDescription:
    """
    Update ONLY the status field of a JD.
    Validates the new status against the allowed set before writing.
    """
    if status_data.status not in VALID_JD_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_data.status}'. Must be one of: {', '.join(sorted(VALID_JD_STATUSES))}"
        )

    jd = get_jd(db, jd_id, current_user)
    old_status = jd.status
    jd.status = status_data.status
    db.commit()
    db.refresh(jd)

    log_action(
        db,
        user_id=current_user.id,
        action="status_update",
        entity_type="job_description",
        entity_id=jd.id,
        old_value=old_status,
        new_value=status_data.status
    )
    return jd


# ---------------------------------------------------------------------------
# FLOAT
# ---------------------------------------------------------------------------

def float_jd_to_vendors(
    db: Session,
    jd_id: int,
    float_data: JDFloatRequest,
    current_user: User
) -> List[JDVendorAssignment]:
    """
    Float a JD to one or more vendors.

    For each vendor_id in the request:
      1. Verify vendor exists and is approved.
      2. Skip if an active assignment already exists (idempotent).
      3. Create a JDVendorAssignment row.
      4. Create a notification for the vendor's user account.

    After all assignments are processed:
      - Auto-advances JD status to 'sourcing' if it was 'received' or 'in_review'.
      - Commits the entire operation atomically.

    Returns the full list of assignments (both new and pre-existing).
    """
    jd = get_jd(db, jd_id, current_user)
    assignments: List[JDVendorAssignment] = []

    for vendor_id in float_data.vendor_ids:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vendor with id={vendor_id} not found"
            )
        if not vendor.is_approved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vendor with id={vendor_id} is not approved. Approve the vendor first."
            )

        # Idempotency: skip if already actively assigned
        existing = db.query(JDVendorAssignment).filter(
            JDVendorAssignment.jd_id == jd_id,
            JDVendorAssignment.vendor_id == vendor_id,
            JDVendorAssignment.status == "active"
        ).first()
        if existing:
            assignments.append(existing)
            continue

        assignment = JDVendorAssignment(
            jd_id=jd_id,
            vendor_id=vendor_id,
            floated_by=current_user.id,
            deadline=float_data.deadline,
            status="active",
            vendor_acknowledged=False
        )
        db.add(assignment)
        db.flush()  # Populate assignment.id before using it in log_action

        # Notify the vendor's user account
        create_notification(
            db=db,
            user_id=vendor.user_id,
            message=f"New job description has been assigned to you: '{jd.title}' (JD #{jd_id}).",
            notif_type="jd_floated",
            entity_id=jd_id,
            entity_type="job_description"
        )

        log_action(
            db,
            user_id=current_user.id,
            action="float_jd",
            entity_type="jd_vendor_assignment",
            entity_id=assignment.id,
            new_value=f"jd={jd_id}, vendor={vendor_id}"
        )

        assignments.append(assignment)

    # Auto-advance JD status to 'sourcing' if it hasn't moved past that yet
    if jd.status in ("received", "in_review"):
        jd.status = "sourcing"

    db.commit()

    # Refresh all new assignment objects so they carry their DB-generated fields
    for a in assignments:
        db.refresh(a)

    return assignments


# ---------------------------------------------------------------------------
# ACKNOWLEDGE
# ---------------------------------------------------------------------------

def acknowledge_jd(db: Session, jd_id: int, current_user: User) -> JDVendorAssignment:
    """
    Vendor acknowledges receipt of a JD assignment.
    Sets vendor_acknowledged=True and records the timestamp.
    """
    if not current_user.vendor_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can acknowledge JD assignments"
        )

    assignment = db.query(JDVendorAssignment).filter(
        JDVendorAssignment.jd_id == jd_id,
        JDVendorAssignment.vendor_id == current_user.vendor_profile.id,
        JDVendorAssignment.status == "active"
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active assignment found for this JD"
        )

    if assignment.vendor_acknowledged:
        # Already acknowledged — return as-is, no error
        return assignment

    assignment.vendor_acknowledged = True
    assignment.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assignment)

    log_action(
        db,
        user_id=current_user.id,
        action="acknowledge_jd",
        entity_type="jd_vendor_assignment",
        entity_id=assignment.id,
        new_value=f"acknowledged at {assignment.acknowledged_at}"
    )
    return assignment