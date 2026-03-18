from sqlalchemy.orm import Session
from app.models.system import AuditLog
import json


# ─────────────────────────────────────────
# AUDIT LOG WRITER
# ─────────────────────────────────────────

def log_action(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: int = None,
    old_value: dict = None,
    new_value: dict = None,
    user_id: int = None,
) -> AuditLog:
    """
    Write a record to the audit_logs table.
    Called after every significant system action.

    Args:
        db:          Active database session
        action:      What happened e.g. USER_CREATED, VENDOR_APPROVED
        entity_type: What was affected e.g. user, vendor, job_description
        entity_id:   ID of the affected record
        old_value:   State before the change (dict → stored as JSON string)
        new_value:   State after the change  (dict → stored as JSON string)
        user_id:     Who performed the action (None for system actions)

    Returns:
        The created AuditLog ORM object

    Usage:
        log_action(
            db=db,
            action="VENDOR_APPROVED",
            entity_type="vendor",
            entity_id=vendor.id,
            old_value={"is_approved": False},
            new_value={"is_approved": True},
            user_id=current_user.id,
        )
    """
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=json.dumps(old_value) if old_value is not None else None,
        new_value=json.dumps(new_value) if new_value is not None else None,
    )

    db.add(audit_entry)
    db.flush()  # Write to DB within current transaction but don't commit yet
                # The calling service is responsible for db.commit()
    return audit_entry


# ─────────────────────────────────────────
# STANDARD ACTION CONSTANTS
# Use these instead of raw strings to avoid typos across the codebase
# ─────────────────────────────────────────

class AuditAction:
    # User actions
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    USER_DEACTIVATED = "USER_DEACTIVATED"
    USER_REACTIVATED = "USER_REACTIVATED"
    USER_LOGIN = "USER_LOGIN"
    USER_LOGIN_FAILED = "USER_LOGIN_FAILED"

    # Vendor actions
    VENDOR_APPROVED = "VENDOR_APPROVED"
    VENDOR_REVOKED = "VENDOR_REVOKED"

    # JD actions
    JD_CREATED = "JD_CREATED"
    JD_UPDATED = "JD_UPDATED"
    JD_STATUS_CHANGED = "JD_STATUS_CHANGED"
    JD_FLOATED_TO_VENDOR = "JD_FLOATED_TO_VENDOR"

    # CV actions
    CV_SUBMITTED = "CV_SUBMITTED"
    CV_SCORE_OVERRIDDEN = "CV_SCORE_OVERRIDDEN"

    # Shortlist actions
    SHORTLIST_CREATED = "SHORTLIST_CREATED"
    SHORTLIST_SUBMITTED_TO_CLIENT = "SHORTLIST_SUBMITTED_TO_CLIENT"

    # Feedback actions
    CLIENT_FEEDBACK_SUBMITTED = "CLIENT_FEEDBACK_SUBMITTED"

    # Interview actions
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    INTERVIEW_CONFIRMED = "INTERVIEW_CONFIRMED"

    # System actions
    SYSTEM_CONFIG_UPDATED = "SYSTEM_CONFIG_UPDATED"


# ─────────────────────────────────────────
# ENTITY TYPE CONSTANTS
# ─────────────────────────────────────────

class AuditEntity:
    USER = "user"
    VENDOR = "vendor"
    CLIENT = "client"
    JOB_DESCRIPTION = "job_description"
    CV_SUBMISSION = "cv_submission"
    CANDIDATE = "candidate"
    MATCH_SCORE = "match_score"
    SHORTLIST = "shortlist"
    SHORTLIST_ITEM = "shortlist_item"
    FEEDBACK = "feedback"
    INTERVIEW = "interview"
    SYSTEM_CONFIG = "system_config"