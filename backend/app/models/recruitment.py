from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.database import Base


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    timezone = Column(String(100))
    budget_min = Column(Numeric(10, 2))
    budget_max = Column(Numeric(10, 2))
    contract_duration = Column(String(100))  # e.g. "6 months", "12 months"
    status = Column(
        String(50),
        default="received",
        nullable=False
    )
    # status values: received | in_review | sourcing | shortlist_ready | closed
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    client = relationship("Client", back_populates="job_descriptions")
    creator = relationship("User", foreign_keys=[created_by])
    cv_submissions = relationship("CVSubmission", back_populates="job_description")
    shortlists = relationship("Shortlist", back_populates="job_description")
    vendor_assignments = relationship("JDVendorAssignment", back_populates="job_description")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True)
    cv_url = Column(String(500))           # Cloudinary URL
    cv_text = Column(Text)                 # Parsed text from PDF
    embedding = Column(Vector(384))        # pgvector — 384 dims for all-MiniLM-L6-v2
    availability = Column(String(100))     # e.g. "Immediate", "2 weeks"
    notice_period = Column(String(100))
    rate_expectation = Column(Numeric(10, 2))

    # Relationships
    cv_submissions = relationship("CVSubmission", back_populates="candidate")


class CVSubmission(Base):
    __tablename__ = "cv_submissions"

    id = Column(Integer, primary_key=True, index=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    submission_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="submitted", nullable=False)
    # status values: submitted | under_review | shortlisted | rejected
    submitted_rate = Column(Numeric(10, 2))

    # Relationships
    job_description = relationship("JobDescription", back_populates="cv_submissions")
    candidate = relationship("Candidate", back_populates="cv_submissions")
    vendor = relationship("Vendor", back_populates="cv_submissions")
    match_score = relationship("MatchScore", back_populates="cv_submission", uselist=False)
    shortlist_items = relationship("ShortlistItem", back_populates="cv_submission")