import uuid
from sqlalchemy import Column, String, ForeignKey, Integer, JSON, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    
    type = Column(String, nullable=False) # 'internal' or 'client'
    title = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    versions = relationship("ProcedureVersion", back_populates="procedure", cascade="all, delete-orphan")

class ProcedureVersion(Base):
    __tablename__ = "procedure_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id"), nullable=False)
    
    version = Column(String, nullable=False) # e.g., "v1.0"
    status = Column(String, nullable=False, default="draft") # draft, reviewing, published, deprecated
    file_hash = Column(String, nullable=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    change_reason = Column(String, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    procedure = relationship("Procedure", back_populates="versions")
    sections = relationship("DocumentSection", back_populates="procedure_version", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="procedure_version")

class DocumentSection(Base):
    __tablename__ = "document_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    procedure_version_id = Column(UUID(as_uuid=True), ForeignKey("procedure_versions.id"), nullable=False)
    
    title = Column(String, nullable=True)
    text = Column(String, nullable=False)
    page = Column(Integer, nullable=True)
    coordinates = Column(JSONB, nullable=True)
    order_index = Column(Integer, nullable=False)
    criticality = Column(String, nullable=True)
    risk_tags = Column(JSONB, nullable=True) # e.g., ["altura", "caliente"]
    
    procedure_version = relationship("ProcedureVersion", back_populates="sections")

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    procedure_version_id = Column(UUID(as_uuid=True), ForeignKey("procedure_versions.id"), nullable=False)
    
    title = Column(String, nullable=False)
    passing_score = Column(Float, default=100.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    procedure_version = relationship("ProcedureVersion", back_populates="courses")
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    
    course = relationship("Course", back_populates="lessons")

class Infographic(Base):
    __tablename__ = "infographics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    section_id = Column(UUID(as_uuid=True), ForeignKey("document_sections.id"), nullable=False)
    version = Column(String, nullable=False, default="1.0")
    status = Column(String, nullable=False, default="draft")
    spec_json = Column(JSONB, nullable=False)
    file_path = Column(String, nullable=True) # SVG/PNG path
    
    section = relationship("DocumentSection")

class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    section_id = Column(UUID(as_uuid=True), ForeignKey("document_sections.id"), nullable=False)
    infographic_id = Column(UUID(as_uuid=True), ForeignKey("infographics.id"), nullable=True)
    
    text = Column(String, nullable=False)
    question_type = Column(String, nullable=False)
    difficulty = Column(String, nullable=True)
    correct_answer = Column(JSONB, nullable=False)
    distractors = Column(JSONB, nullable=False)
    justification = Column(String, nullable=True)

class TrainingMatrix(Base):
    __tablename__ = "training_matrices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    
    role = Column(String, nullable=False)
    required_courses = Column(JSONB, nullable=False) # list of course IDs

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    
    origin = Column(String, nullable=False) # internal_matrix, client_matrix, manual
    status = Column(String, nullable=False, default="pending")
    due_date = Column(DateTime(timezone=True), nullable=True)

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=False)
    
    score = Column(Float, nullable=True)
    time_spent_seconds = Column(Integer, nullable=True)
    responses = Column(JSONB, nullable=True)
    device_info = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LearningGap(Base):
    __tablename__ = "learning_gaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    section_id = Column(UUID(as_uuid=True), ForeignKey("document_sections.id"), nullable=False)
    
    critical_concept = Column(String, nullable=False)
    status = Column(String, nullable=False, default="open") # open, closed

class RemediationPath(Base):
    __tablename__ = "remediation_paths"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    gap_id = Column(UUID(as_uuid=True), ForeignKey("learning_gaps.id"), nullable=False)
    
    micro_lesson_content = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")

class Certification(Base):
    __tablename__ = "certifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    procedure_version_id = Column(UUID(as_uuid=True), ForeignKey("procedure_versions.id"), nullable=False)
    
    status = Column(String, nullable=False) # active, expired, revoked, superseded
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    channel = Column(String, nullable=False) # whatsapp, email, push
    event = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
