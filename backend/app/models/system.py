from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    # Keys: weight_hard_skills | weight_certs | weight_timezone |
    #       weight_soft_skills | weight_contract | shortlist_threshold | global_margin
    value = Column(String(255), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    updater = relationship("User", foreign_keys=[updated_by])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)   # e.g. USER_CREATED | VENDOR_APPROVED
    entity_type = Column(String(100))              # e.g. user | vendor | job_description
    entity_id = Column(Integer, nullable=True)
    old_value = Column(Text, nullable=True)        # JSON string of old state
    new_value = Column(Text, nullable=True)        # JSON string of new state
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])


class JDVendorAssignment(Base):
    __tablename__ = "jd_vendor_assignments"

    id = Column(Integer, primary_key=True, index=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    floated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    floated_at = Column(DateTime(timezone=True), server_default=func.now())
    deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    # status values: active | closed | cancelled
    vendor_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    # UNIQUE constraint — same vendor cannot be assigned same JD twice
    __table_args__ = (
        UniqueConstraint("jd_id", "vendor_id", name="uq_jd_vendor"),
    )

    # Relationships
    job_description = relationship("JobDescription", back_populates="vendor_assignments")
    vendor = relationship("Vendor", back_populates="jd_assignments")
    floater = relationship("User", foreign_keys=[floated_by])