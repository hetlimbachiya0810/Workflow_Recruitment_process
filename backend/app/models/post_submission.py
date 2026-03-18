from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    shortlist_item_id = Column(Integer, ForeignKey("shortlist_items.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    status = Column(String(50), nullable=False)
    # status values: interested | not_interested | hold
    comment = Column(Text, nullable=True)
    replacement_requested = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    shortlist_item = relationship("ShortlistItem", back_populates="feedback")
    client = relationship("Client", back_populates="feedback")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    shortlist_item_id = Column(Integer, ForeignKey("shortlist_items.id"), nullable=False)
    proposed_time = Column(DateTime(timezone=True))
    confirmed_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="scheduled", nullable=False)
    # status values: scheduled | completed | offer_made
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    shortlist_item = relationship("ShortlistItem", back_populates="interviews")
    creator = relationship("User", foreign_keys=[created_by])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(100))             # e.g. jd_floated | cv_submitted | shortlist_ready
    entity_id = Column(Integer, nullable=True)
    entity_type = Column(String(100), nullable=True)  # e.g. job_description | shortlist
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")