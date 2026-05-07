from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    user = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.user, nullable=False)
    is_active = Column(Boolean, default=True)
    language = Column(String, default="en", nullable=False)

    projects = relationship("ProjectUser", back_populates="user")
    comments = relationship("Comment", back_populates="user")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    source_language = Column(String, nullable=False)
    target_language = Column(String, nullable=False)

    users = relationship("ProjectUser", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")

class AccessLevelEnum(str, enum.Enum):
    read = "read"
    write = "write"

class ProjectUser(Base):
    __tablename__ = "project_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    access_level = Column(Enum(AccessLevelEnum), default=AccessLevelEnum.read, nullable=False)
    can_edit_source = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="projects")
    project = relationship("Project", back_populates="users")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="documents")
    paragraphs = relationship("Paragraph", back_populates="document", cascade="all, delete-orphan", order_by="Paragraph.order")

class Paragraph(Base):
    __tablename__ = "paragraphs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)

    document = relationship("Document", back_populates="paragraphs")
    segments = relationship("Segment", back_populates="paragraph", cascade="all, delete-orphan", order_by="Segment.order")

class SegmentStatusEnum(str, enum.Enum):
    untouched = "untouched"
    in_progress = "in_progress"
    review_needed = "review_needed"
    completed = "completed"

class Segment(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, index=True)
    paragraph_id = Column(Integer, ForeignKey("paragraphs.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)
    uid = Column(String, unique=True, index=True)
    kind = Column(String, nullable=True) # e.g., 'prose', 'heading'
    trados_id = Column(String, nullable=True)

    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=True)

    status = Column(Enum(SegmentStatusEnum), default=SegmentStatusEnum.untouched, nullable=False)
    last_modified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    paragraph = relationship("Paragraph", back_populates="segments")
    history = relationship("SegmentHistory", back_populates="segment", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="segment", cascade="all, delete-orphan")

class SegmentHistory(Base):
    __tablename__ = "segment_histories"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("segments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_text = Column(Text, nullable=True)
    status = Column(Enum(SegmentStatusEnum), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    segment = relationship("Segment", back_populates="history")
    user = relationship("User")

class Glossary(Base):
    __tablename__ = "glossaries"

    id = Column(Integer, primary_key=True, index=True)
    source_term = Column(String, unique=True, index=True, nullable=False)
    target_term = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TranslationMemory(Base):
    __tablename__ = "translation_memories"

    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(Text, index=True, nullable=False) # Will add pg_trgm index via alembic
    target_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("segments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    segment = relationship("Segment", back_populates="comments")
    user = relationship("User", back_populates="comments")
