from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NotificationResponse(BaseModel):
    """Single notification returned in API responses."""
    id: int
    user_id: int
    message: str
    type: Optional[str] = None
    entity_id: Optional[int] = None
    entity_type: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    """Payload to mark one or more notifications as read."""
    notification_ids: List[int]