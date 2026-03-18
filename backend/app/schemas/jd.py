from pydantic import BaseModel
from typing import Optional
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
    """Recruiter updates an existing JD."""
    title: Optional[str] = None
    description: Optional[str] = None
    timezone: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    contract_duration: Optional[str] = None
    status: Optional[str] = None


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