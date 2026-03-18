from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import require_admin
from app.models.auth import User
from app.models.system import SystemConfig
from app.schemas.common import DataResponse

router = APIRouter(prefix="/config", tags=["System Configuration"])


@router.get("", response_model=DataResponse[dict])
def get_system_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get all system configuration values. Admin only.
    Returns key-value pairs for matching engine weights,
    shortlist threshold, and global margin.
    """
    configs = db.query(SystemConfig).all()
    config_dict = {c.key: c.value for c in configs}
    return DataResponse(data=config_dict)