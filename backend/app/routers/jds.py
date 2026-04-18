from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models.auth import User
from app.schemas.jd import (
    JDCreate,
    JDUpdate,
    JDStatusUpdate,
    JDFloatRequest,
    JDResponse,
    JDVendorAssignmentResponse
)
from app.services import jd_service

router = APIRouter(prefix="/jds", tags=["Job Descriptions"])


# ---------------------------------------------------------------------------
# POST /jds — Create a new JD
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=JDResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Job Description"
)
def create_jd(
    jd_data: JDCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "recruiter"]))
):
    return jd_service.create_jd(db, jd_data, current_user.id)


# ---------------------------------------------------------------------------
# GET /jds — List JDs (role-filtered)
# ---------------------------------------------------------------------------
@router.get(
    "",
    response_model=List[JDResponse],
    summary="List Job Descriptions (role-filtered)"
)
def list_jds(
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return jd_service.get_jds(db, current_user, status_filter=status, skip=skip, limit=limit)


# ---------------------------------------------------------------------------
# GET /jds/{jd_id} — Get a single JD
# ---------------------------------------------------------------------------
@router.get(
    "/{jd_id}",
    response_model=JDResponse,
    summary="Get a single Job Description"
)
def get_jd(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return jd_service.get_jd(db, jd_id, current_user)


# ---------------------------------------------------------------------------
# PATCH /jds/{jd_id} — Partial update of JD fields
# ---------------------------------------------------------------------------
@router.patch(
    "/{jd_id}",
    response_model=JDResponse,
    summary="Update a Job Description"
)
def update_jd(
    jd_id: int,
    jd_data: JDUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "recruiter"]))
):
    return jd_service.update_jd(db, jd_id, jd_data, current_user)


# ---------------------------------------------------------------------------
# PATCH /jds/{jd_id}/status — Status-only update
# ---------------------------------------------------------------------------
@router.patch(
    "/{jd_id}/status",
    response_model=JDResponse,
    summary="Update the status of a Job Description"
)
def update_jd_status(
    jd_id: int,
    status_data: JDStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "recruiter"]))
):
    return jd_service.update_jd_status(db, jd_id, status_data, current_user)


# ---------------------------------------------------------------------------
# POST /jds/{jd_id}/float — Float JD to one or more vendors
# ---------------------------------------------------------------------------
@router.post(
    "/{jd_id}/float",
    response_model=List[JDVendorAssignmentResponse],
    summary="Float a JD to one or more approved vendors"
)
def float_jd_to_vendors(
    jd_id: int,
    float_data: JDFloatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "recruiter"]))
):
    return jd_service.float_jd_to_vendors(db, jd_id, float_data, current_user)


# ---------------------------------------------------------------------------
# GET /jds/{jd_id}/assignments — List all vendor assignments for a JD
# ---------------------------------------------------------------------------
@router.get(
    "/{jd_id}/assignments",
    response_model=List[JDVendorAssignmentResponse],
    summary="List all vendor assignments for a JD (admin/recruiter only)"
)
def get_jd_assignments(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "recruiter"]))
):
    return jd_service.get_jd_assignments(db, jd_id, current_user)


# ---------------------------------------------------------------------------
# PATCH /jds/{jd_id}/acknowledge — Vendor acknowledges a JD assignment
# ---------------------------------------------------------------------------
@router.patch(
    "/{jd_id}/acknowledge",
    response_model=JDVendorAssignmentResponse,
    summary="Vendor acknowledges receipt of a JD assignment"
)
def acknowledge_jd(
    jd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["vendor"]))
):
    return jd_service.acknowledge_jd(db, jd_id, current_user)