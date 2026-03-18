from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # auto-reconnect if connection dropped
    pool_size=10,             # max persistent connections
    max_overflow=20,          # extra connections under load
    echo=settings.ENVIRONMENT == "development",  # log SQL in dev only
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency — yields a DB session per request,
    always closes it when the request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()