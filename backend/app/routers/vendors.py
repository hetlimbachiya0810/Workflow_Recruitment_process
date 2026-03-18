from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.core.dependencies import require_admin
from app.models.auth import User
from app.models.parties import Vendor
from app.schemas.vendor import VendorApprovalRequest, VendorResponse, VendorListResponse
from app.schemas.common import DataResponse, PaginatedResponse
from app.services import vendor_service

router = APIRouter(prefix="/vendors", tags=["Vendor Management"])


@router.get("", response_model=PaginatedResponse[VendorListResponse])
def list_vendors(
    is_approved: Optional[bool] = Query(None, description="Filter by approval status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    List all vendors. Admin only.
    Use is_approved=false to see pending vendors awaiting approval.
    Use is_approved=true to see approved vendors.
    Omit to see all vendors.
    """
    result = vendor_service.get_all_vendors(
        db=db,
        is_approved=is_approved,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        data=[_format_vendor(v) for v in result["vendors"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.get("/{vendor_id}", response_model=DataResponse[VendorResponse])
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get a single vendor by ID. Admin only."""
    vendor = vendor_service.get_vendor_by_id(db=db, vendor_id=vendor_id)
    return DataResponse(data=_format_vendor(vendor))


@router.patch("/{vendor_id}/approval", response_model=DataResponse[VendorResponse])
def update_vendor_approval(
    vendor_id: int,
    payload: VendorApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Approve or revoke a vendor. Admin only.

    This is the security gate that controls whether a vendor
    can submit CVs through the portal.

    Send: { "is_approved": true }  → approve vendor
    Send: { "is_approved": false } → revoke approval
    """
    vendor = vendor_service.update_vendor_approval(
        db=db,
        vendor_id=vendor_id,
        payload=payload,
        approved_by_id=current_user.id,
    )
    return DataResponse(data=_format_vendor(vendor))


def _format_vendor(vendor: Vendor) -> VendorResponse:
    """Convert Vendor ORM object to VendorResponse schema."""
    return VendorResponse(
        id=vendor.id,
        user_id=vendor.user_id,
        company_name=vendor.company_name,
        is_approved=vendor.is_approved,
        performance_score=vendor.performance_score or 0.0,
        approved_by=vendor.approved_by,
        created_at=vendor.created_at,
        email=vendor.user.email if vendor.user else None,
    )