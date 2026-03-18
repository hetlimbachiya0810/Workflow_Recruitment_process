from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import verify_access_token
from app.models.auth import User

# This tells FastAPI to expect: Authorization: Bearer <token>
bearer_scheme = HTTPBearer()


# ─────────────────────────────────────────
# BASE DEPENDENCY — GET CURRENT USER
# ─────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Core dependency used by every protected route.

    1. Extracts Bearer token from Authorization header
    2. Verifies token signature and expiry
    3. Looks up the user in the database
    4. Returns the User ORM object

    Usage in a router:
        @router.get("/something")
        def my_route(current_user: User = Depends(get_current_user)):
            ...
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify the token
    payload = verify_access_token(credentials.credentials)
    if payload is None:
        raise credentials_exception

    # Extract user_id from token payload
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Fetch user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    # Check account is still active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact your administrator.",
        )

    return user


# ─────────────────────────────────────────
# ROLE GUARD FACTORY
# ─────────────────────────────────────────

def require_roles(*allowed_roles: str):
    """
    Role guard factory. Returns a dependency that only allows
    users whose role.name is in the allowed_roles list.

    Usage in a router:
        @router.get("/admin-only")
        def admin_route(
            current_user: User = Depends(require_roles("admin"))
        ):
            ...

        @router.get("/admin-or-recruiter")
        def shared_route(
            current_user: User = Depends(require_roles("admin", "recruiter"))
        ):
            ...
    """
    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker


# ─────────────────────────────────────────
# PRE-BUILT ROLE GUARDS
# These are ready-to-use dependencies for each role combination.
# Import and use directly in routers instead of calling require_roles() each time.
# ─────────────────────────────────────────

def require_admin(
    current_user: User = Depends(require_roles("admin"))
) -> User:
    """Only admin can access this route."""
    return current_user


def require_recruiter(
    current_user: User = Depends(require_roles("recruiter"))
) -> User:
    """Only recruiter can access this route."""
    return current_user


def require_vendor(
    current_user: User = Depends(require_roles("vendor"))
) -> User:
    """Only vendor can access this route."""
    return current_user


def require_client(
    current_user: User = Depends(require_roles("client"))
) -> User:
    """Only client can access this route."""
    return current_user


def require_admin_or_recruiter(
    current_user: User = Depends(require_roles("admin", "recruiter"))
) -> User:
    """Admin or recruiter can access this route."""
    return current_user


def require_admin_or_recruiter_or_client(
    current_user: User = Depends(require_roles("admin", "recruiter", "client"))
) -> User:
    """Admin, recruiter, or client can access this route."""
    return current_user