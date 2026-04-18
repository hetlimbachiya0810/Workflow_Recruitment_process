from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status

from app.models.recruitment import CVSubmission, Candidate, JDVendorAssignment
from app.models.auth import User
from app.core.cloudinary_client import upload_cv
from app.services.notification_service import create_notification
from app.core.audit import log_action

# Recruiter role_id from seed data — used to notify all active recruiters on new CV
RECRUITER_ROLE_ID = 2

ALLOWED_CV_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}


def submit_cv(
    db: Session,
    jd_id: int,
    vendor_user: User,
    candidate_name: str,
    candidate_email: Optional[str],
    availability: Optional[str],
    notice_period: Optional[str],
    rate_expectation: Optional[float],
    submitted_rate: Optional[float],
    cv_file: UploadFile
) -> CVSubmission:
    """
    Process a vendor's CV submission for a specific JD.

    Security gates (both enforced before any file upload):
      Gate 1 — The vendor account must be approved (is_approved=True).
      Gate 2 — An active jd_vendor_assignment must exist for this vendor + JD pair.

    After both gates pass:
      1. Validate file content type.
      2. Upload CV to Cloudinary.
      3. Create a Candidate row.
      4. Create a CVSubmission row.
      5. Notify all active recruiters.
      6. Commit atomically.

    Returns the created CVSubmission ORM object.
    """
    vendor = vendor_user.vendor_profile

    # -----------------------------------------------------------------------
    # Gate 1: vendor account approval
    # -----------------------------------------------------------------------
    if not vendor or not vendor.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your vendor account is not approved. Contact an admin."
        )

    # -----------------------------------------------------------------------
    # Gate 2: active JD assignment
    # -----------------------------------------------------------------------
    assignment = db.query(JDVendorAssignment).filter(
        JDVendorAssignment.jd_id == jd_id,
        JDVendorAssignment.vendor_id == vendor.id,
        JDVendorAssignment.status == "active"
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have an active assignment for this job description."
        )

    # -----------------------------------------------------------------------
    # File type validation
    # -----------------------------------------------------------------------
    if cv_file.content_type not in ALLOWED_CV_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{cv_file.content_type}'. Allowed: PDF, DOC, DOCX."
        )

    # -----------------------------------------------------------------------
    # Upload to Cloudinary
    # -----------------------------------------------------------------------
    file_bytes = cv_file.file.read()
    # Build a deterministic, safe filename: jd_{id}_vendor_{id}_{candidate}
    safe_candidate_name = candidate_name.replace(" ", "_").replace("/", "_")
    cloudinary_public_id = f"jd_{jd_id}_vendor_{vendor.id}_{safe_candidate_name}"

    try:
        cv_url = upload_cv(file_bytes=file_bytes, filename=cloudinary_public_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"CV upload failed: {str(exc)}"
        )

    # -----------------------------------------------------------------------
    # Create Candidate record
    # -----------------------------------------------------------------------
    candidate = Candidate(
        name=candidate_name,
        email=candidate_email,
        cv_url=cv_url,
        availability=availability,
        notice_period=notice_period,
        rate_expectation=rate_expectation
    )
    db.add(candidate)
    db.flush()  # Populate candidate.id before linking it to CVSubmission

    # -----------------------------------------------------------------------
    # Create CVSubmission record
    # -----------------------------------------------------------------------
    submission = CVSubmission(
        jd_id=jd_id,
        candidate_id=candidate.id,
        vendor_id=vendor.id,
        submitted_rate=submitted_rate,
        status="submitted"
    )
    db.add(submission)
    db.flush()  # Populate submission.id before using it in notifications / audit

    # -----------------------------------------------------------------------
    # Notify all active recruiters
    # -----------------------------------------------------------------------
    recruiters = db.query(User).filter(
        User.role_id == RECRUITER_ROLE_ID,
        User.is_active == True
    ).all()

    for recruiter in recruiters:
        create_notification(
            db=db,
            user_id=recruiter.id,
            message=(
                f"New CV submitted by {vendor.company_name} for JD #{jd_id}: "
                f"{candidate_name}."
            ),
            notif_type="cv_submitted",
            entity_id=submission.id,
            entity_type="cv_submission"
        )

    db.commit()
    db.refresh(submission)

    log_action(
        db,
        user_id=vendor_user.id,
        action="submit_cv",
        entity_type="cv_submission",
        entity_id=submission.id,
        new_value=f"jd={jd_id}, candidate={candidate_name}, vendor={vendor.id}"
    )

    return submission


def get_vendor_submissions(
    db: Session,
    vendor_user: User,
    jd_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50
) -> List[CVSubmission]:
    """
    Return all CV submissions made by the logged-in vendor.
    Optionally filter by JD. Returns submissions ordered by most recent first.
    The CVSubmission ORM objects carry a .candidate relationship which Pydantic
    will load for the CVSubmissionWithCandidateResponse schema.
    """
    vendor = vendor_user.vendor_profile
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    query = db.query(CVSubmission).filter(CVSubmission.vendor_id == vendor.id)

    if jd_id is not None:
        query = query.filter(CVSubmission.jd_id == jd_id)

    return (
        query
        .order_by(CVSubmission.submission_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )