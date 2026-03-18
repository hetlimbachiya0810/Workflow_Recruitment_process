from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from app.config import settings


# ─────────────────────────────────────────
# PASSWORD UTILITIES
# ─────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    Called when creating or updating a user's password.
    """
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a stored bcrypt hash.
    Called during login.
    """
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# ─────────────────────────────────────────
# JWT UTILITIES
# ─────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a short-lived JWT access token.
    Default expiry: ACCESS_TOKEN_EXPIRE_MINUTES from .env (60 mins).
    """
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """
    Create a long-lived JWT refresh token.
    Default expiry: REFRESH_TOKEN_EXPIRE_DAYS from .env (7 days).
    Used to issue a new access token without re-login.
    """
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token.
    Returns the payload dict if valid, None if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify that the token is specifically an access token.
    Returns payload if valid access token, None otherwise.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    if payload.get("type") != "access":
        return None
    return payload


def verify_refresh_token(token: str) -> Optional[dict]:
    """
    Decode and verify that the token is specifically a refresh token.
    Returns payload if valid refresh token, None otherwise.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    if payload.get("type") != "refresh":
        return None
    return payload