from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Request body for POST /auth/login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response body for successful login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Request body for POST /auth/refresh"""
    refresh_token: str


class MeResponse(BaseModel):
    """Response body for GET /auth/me"""
    id: int
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True
        