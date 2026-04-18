from fastapi import APIRouter, Depends, Query, Form, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.models.auth import User
from app.schemas.submission import CVSubmissionResponse, CVSubmissionWithCandidateResponse
from app.services import submission_service

router = APIRouter(prefix="/submissions", tags=["CV Submissions"])


# ---------------------------------------------------------------------------
# POST /submissions — Vendor submits a CV for a JD
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=CVSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a CV for a Job Description (vendor only)"
)
async def submit_cv(
    # Multipart form fields — sent alongside the CV file
    jd_id: int = Form(..., description="ID of the Job Description this CV is for"),
    candidate_name: str = Form(..., description="Full name of the candidate"),
    candidate_email: Optional[str] = Form(None),
    availability: Optional[str] = Form(None, description="e.g. Immediate, 2 weeks"),
    notice_period: Optional[str] = Form(None, description="e.g. 30 days"),
    rate_expectation: Optional[Decimal] = Form(None, description="Candidate's expected rate"),
    submitted_rate: Optional[Decimal] = Form(None, description="Rate the vendor is submitting at"),
    cv_file: UploadFile = File(..., description="CV file — PDF, DOC, or DOCX only"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["vendor"]))
):
    return submission_service.submit_cv(
        db=db,
        jd_id=jd_id,
        vendor_user=current_user,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        availability=availability,
        notice_period=notice_period,
        rate_expectation=float(rate_expectation) if rate_expectation is not None else None,
        submitted_rate=float(submitted_rate) if submitted_rate is not None else None,
        cv_file=cv_file
    )


# ---------------------------------------------------------------------------
# GET /submissions/my — Vendor views their own submission history
# ---------------------------------------------------------------------------
@router.get(
    "/my",
    response_model=List[CVSubmissionWithCandidateResponse],
    summary="Get all CV submissions made by the logged-in vendor"
)
def get_my_submissions(
    jd_id: Optional[int] = Query(None, description="Filter by JD ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["vendor"]))
):
    return submission_service.get_vendor_submissions(
        db, current_user, jd_id=jd_id, skip=skip, limit=limit
    )