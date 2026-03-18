from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """
    Admin creates a new user.
    Password is plain text here — hashed in the service layer before storing.
    """
    email: EmailStr
    password: str
    role: str  # admin | recruiter | vendor | client

    # Optional profile fields depending on role
    company_name: Optional[str] = None   # Required for vendor and client roles
    contact_name: Optional[str] = None   # Required for client role
    timezone: Optional[str] = None       # Optional for client


class UserUpdate(BaseModel):
    """Admin updates an existing user."""
    email: Optional[EmailStr] = None
    password: Optional[str] = None       # If provided, will be re-hashed
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """User data returned in API responses."""
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """User data in list views — slightly trimmed."""
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True