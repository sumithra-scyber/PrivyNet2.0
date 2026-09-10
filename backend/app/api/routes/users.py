from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserBrief, UserOut

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/directory", response_model=list[UserBrief])
def list_directory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Minimal list of other active users, for messaging/file-sharing pickers."""
    return (
        db.query(User)
        .filter(User.id != current_user.id, User.is_active.is_(True))
        .order_by(User.full_name)
        .all()
    )
