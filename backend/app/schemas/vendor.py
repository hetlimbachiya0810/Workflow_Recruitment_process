from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VendorApprovalRequest(BaseModel):
    """Request body for approving or revoking a vendor."""
    is_approved: bool
    # True = approve, False = revoke approval


class VendorResponse(BaseModel):
    """Vendor data returned in API responses."""
    id: int
    user_id: int
    company_name: str
    is_approved: bool
    performance_score: float
    approved_by: Optional[int] = None
    created_at: datetime

    # From the related user
    email: Optional[str] = None

    class Config:
        from_attributes = True


class VendorListResponse(BaseModel):
    """Vendor data in list views."""
    id: int
    user_id: int
    company_name: str
    is_approved: bool
    performance_score: float
    created_at: datetime
    email: Optional[str] = None

    class Config:
        from_attributes = True