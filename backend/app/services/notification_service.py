from sqlalchemy.orm import Session
from typing import Optional

from app.models.post_submission import Notification


def create_notification(
    db: Session,
    user_id: int,
    message: str,
    notif_type: str,
    entity_id: Optional[int] = None,
    entity_type: Optional[str] = None
) -> Notification:
    """
    Create a Notification record and stage it for the current transaction.

    IMPORTANT: This function does NOT call db.commit().
    The caller is responsible for committing after all operations in the
    request are complete. This keeps the notification creation atomic
    with the operation that triggered it (e.g. float, cv submission).

    Args:
        db:           Active SQLAlchemy session.
        user_id:      The user who should receive this notification.
        message:      Human-readable notification text.
        notif_type:   Machine-readable type string, e.g. 'jd_floated', 'cv_submitted'.
        entity_id:    ID of the related entity (optional).
        entity_type:  Type name of the related entity, e.g. 'job_description' (optional).

    Returns:
        The unsaved Notification ORM object (staged via db.add).
    """
    notification = Notification(
        user_id=user_id,
        message=message,
        type=notif_type,
        entity_id=entity_id,
        entity_type=entity_type,
        is_read=False
    )
    db.add(notification)
    return notification