from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.parties import Vendor
from app.models.auth import User
from app.core.audit import log_action, AuditAction, AuditEntity
from app.schemas.vendor import VendorApprovalRequest, VendorResponse, VendorListResponse
from typing import Optional


def get_all_vendors(
    db: Session,
    is_approved: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """
    List all vendors with optional approval status filter.
    Returns paginated results with email from related user.
    """
    query = db.query(Vendor)

    if is_approved is not None:
        query = query.filter(Vendor.is_approved == is_approved)

    total = query.count()
    vendors = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "vendors": vendors,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def get_vendor_by_id(db: Session, vendor_id: int) -> Vendor:
    """Fetch a single vendor by vendor ID, raise 404 if not found."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vendor with ID {vendor_id} not found",
        )
    return vendor


def update_vendor_approval(
    db: Session,
    vendor_id: int,
    payload: VendorApprovalRequest,
    approved_by_id: int,
) -> Vendor:
    """
    Approve or revoke a vendor's approval status.

    Security gate: unapproved vendors cannot submit CVs.
    This is the function that controls that gate.

    - is_approved = True  → vendor can now submit CVs
    - is_approved = False → vendor loses CV submission access immediately
    """
    vendor = get_vendor_by_id(db, vendor_id)

    # No-op check — avoid unnecessary DB writes
    if vendor.is_approved == payload.is_approved:
        state = "approved" if payload.is_approved else "unapproved"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vendor is already {state}",
        )

    old_value = {
        "is_approved": vendor.is_approved,
        "approved_by": vendor.approved_by,
    }

    # Update approval
    vendor.is_approved = payload.is_approved
    vendor.approved_by = approved_by_id if payload.is_approved else None

    new_value = {
        "is_approved": vendor.is_approved,
        "approved_by": vendor.approved_by,
    }

    # Audit log
    action = AuditAction.VENDOR_APPROVED if payload.is_approved else AuditAction.VENDOR_REVOKED
    log_action(
        db=db,
        action=action,
        entity_type=AuditEntity.VENDOR,
        entity_id=vendor.id,
        old_value=old_value,
        new_value=new_value,
        user_id=approved_by_id,
    )

    db.commit()
    db.refresh(vendor)
    return vendor