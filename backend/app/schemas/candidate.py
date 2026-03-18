from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class CandidateResponse(BaseModel):
    """Candidate data returned in API responses."""
    id: int
    name: str
    email: Optional[str] = None
    cv_url: Optional[str] = None
    availability: Optional[str] = None
    notice_period: Optional[str] = None
    rate_expectation: Optional[Decimal] = None
    # Note: cv_text and embedding are never returned in API responses
    # cv_text is internal, embedding is a large vector — not for API consumption

    class Config:
        from_attributes = True
