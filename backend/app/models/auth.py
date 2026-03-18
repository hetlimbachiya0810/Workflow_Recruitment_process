from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # admin | recruiter | vendor | client

    # Relationships
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    role = relationship("Role", back_populates="users")
    client_profile = relationship("Client", back_populates="user", uselist=False)
    vendor_profile = relationship("Vendor", back_populates="user", uselist=False, foreign_keys="[Vendor.user_id]")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    notifications = relationship("Notification", back_populates="user")