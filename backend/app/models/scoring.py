from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MatchScore(Base):
    __tablename__ = "match_scores"

    id = Column(Integer, primary_key=True, index=True)
    cv_submission_id = Column(Integer, ForeignKey("cv_submissions.id"), nullable=False, unique=True)
    total_score = Column(Float, nullable=False)
    hard_skills_score = Column(Float)
    soft_skills_score = Column(Float)
    cert_score = Column(Float)
    timezone_score = Column(Float)
    contract_score = Column(Float)
    is_shortlisted = Column(Boolean, default=False)

    # Option C training data fields — do not remove
    override_score = Column(Float, nullable=True)
    override_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    override_reason = Column(Text, nullable=True)
    overridden_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    cv_submission = relationship("CVSubmission", back_populates="match_score")
    overrider = relationship("User", foreign_keys=[override_by])


class Shortlist(Base):
    __tablename__ = "shortlists"

    id = Column(Integer, primary_key=True, index=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="draft", nullable=False)
    # status values: draft | submitted_to_client | closed
    submitted_to_client_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    job_description = relationship("JobDescription", back_populates="shortlists")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("ShortlistItem", back_populates="shortlist")


class ShortlistItem(Base):
    __tablename__ = "shortlist_items"

    id = Column(Integer, primary_key=True, index=True)
    shortlist_id = Column(Integer, ForeignKey("shortlists.id"), nullable=False)
    cv_submission_id = Column(Integer, ForeignKey("cv_submissions.id"), nullable=False)

    # Financials — stored on write, never recomputed
    vendor_rate = Column(Numeric(10, 2))
    infra_cost = Column(Numeric(10, 2))
    processing_cost = Column(Numeric(10, 2))
    profit_margin = Column(Numeric(10, 2))
    final_client_rate = Column(Numeric(10, 2))

    skills_summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    shortlist = relationship("Shortlist", back_populates="items")
    cv_submission = relationship("CVSubmission", back_populates="shortlist_items")
    feedback = relationship("Feedback", back_populates="shortlist_item")
    interviews = relationship("Interview", back_populates="shortlist_item")