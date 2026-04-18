from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class CandidateResponse(BaseModel):
    """Candidate details nested inside submission responses."""
    id: int
    name: str
    email: Optional[str] = None
    cv_url: Optional[str] = None
    availability: Optional[str] = None
    notice_period: Optional[str] = None
    rate_expectation: Optional[Decimal] = None

    class Config:
        from_attributes = True

class CVSubmissionResponse(BaseModel):
    """
    Basic submission response — returned immediately after a vendor submits a CV.
    Does not include nested candidate to keep the create response lean.
    """
    id: int
    jd_id: int
    candidate_id: int
    vendor_id: int
    submission_date: datetime
    status: str
    submitted_rate: Optional[Decimal] = None

    class Config:
        from_attributes = True

class CVSubmissionWithCandidateResponse(CVSubmissionResponse):
    """
    Extended submission response with nested candidate details.
    Used for vendor submission tracking (GET /submissions/my).
    Pydantic reads candidate via the SQLAlchemy ORM relationship.
    """
    candidate: CandidateResponse

    class Config:
        from_attributes = True