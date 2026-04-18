from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
class JDCreate(BaseModel):
    """Recruiter creates a new Job Description."""
    client_id: int
    title: str
    description: str
    timezone: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    contract_duration: Optional[str] = None
class JDUpdate(BaseModel):
    """Recruiter partially updates an existing JD."""
    title: Optional[str] = None
    description: Optional[str] = None
    timezone: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    contract_duration: Optional[str] = None
    status: Optional[str] = None
class JDStatusUpdate(BaseModel):
    """Dedicated schema for status-only updates via PATCH /jds/{id}/status."""
    status: str
    # valid values: received | in_review | sourcing | shortlist_ready | closed
class JDFloatRequest(BaseModel):
    """Payload for floating a JD to one or more vendors."""
    vendor_ids: List[int]
    deadline: Optional[datetime] = None
class JDVendorAssignmentResponse(BaseModel):
    """Returned when a JD is floated or assignments are listed."""
    id: int
    jd_id: int
    vendor_id: int
    floated_by: int
    floated_at: datetime
    deadline: Optional[datetime] = None
    status: str
    vendor_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    class Config:
        from_attributes = True
class JDResponse(BaseModel):
    """JD data returned in API responses."""
    id: int
    client_id: int
    title: str
    description: str
    timezone: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    contract_duration: Optional[str] = None
    status: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True