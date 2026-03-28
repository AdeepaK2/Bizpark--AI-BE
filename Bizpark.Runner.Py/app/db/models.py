import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    __table_args__ = {"schema": settings.runner_db_schema}


class TaskStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TaskType(str, enum.Enum):
    WEBSITE_GENERATION = "WEBSITE_GENERATION"
    SOCIAL_MEDIA_CONTENT = "SOCIAL_MEDIA_CONTENT"
    BLOG_POST_WRITING = "BLOG_POST_WRITING"


class AgentTask(Base):
    __tablename__ = "agent_task"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(String, nullable=False)
    task_type = Column(Enum(TaskType, name="task_type_enum", schema=settings.runner_db_schema), nullable=False)
    status = Column(
        Enum(TaskStatus, name="task_status_enum", schema=settings.runner_db_schema),
        nullable=False,
        default=TaskStatus.QUEUED,
    )
    input_data = Column(JSONB, default={})
    output_data = Column(JSONB, nullable=True)
    logs = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
