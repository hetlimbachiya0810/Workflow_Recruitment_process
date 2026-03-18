from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# Add the backend directory to Python path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import Base
from app.config import settings

# Import all models so Alembic can detect them
from app.models.auth import User, Role
from app.models.parties import Client, Vendor
from app.models.recruitment import JobDescription, Candidate, CVSubmission
from app.models.scoring import MatchScore, Shortlist, ShortlistItem
from app.models.post_submission import Feedback, Interview, Notification
from app.models.system import SystemConfig, AuditLog, JDVendorAssignment

# Alembic Config object
config = context.config

# Override sqlalchemy.url with value from .env
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Setup logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is what Alembic compares against to detect changes
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()