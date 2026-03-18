from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClientResponse(BaseModel):
    """Client data returned in API responses."""
    id: int
    user_id: int
    company_name: str
    contact_name: str
    timezone: Optional[str] = None
    created_at: datetime

    # From the related user
    email: Optional[str] = None

    class Config:
        from_attributes = True