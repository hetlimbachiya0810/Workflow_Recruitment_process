from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    company_name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=False)
    timezone = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="client_profile")
    job_descriptions = relationship("JobDescription", back_populates="client")
    feedback = relationship("Feedback", back_populates="client")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    company_name = Column(String(255), nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    performance_score = Column(Float, default=0.0)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="vendor_profile", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
    cv_submissions = relationship("CVSubmission", back_populates="vendor")
    jd_assignments = relationship("JDVendorAssignment", back_populates="vendor")