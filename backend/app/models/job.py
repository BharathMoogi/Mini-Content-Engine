import enum
from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, Enum, Float
from sqlalchemy.sql import func
from app.core.database import Base


class JobStatus(str, enum.Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_name = Column(String(255), nullable=False, index=True)
    product_description = Column(Text, nullable=True)
    uploaded_image_path = Column(String(512), nullable=True)
    generated_prompt = Column(Text, nullable=True)
    generated_image_url = Column(String(512), nullable=True)
    status = Column(
        Enum(JobStatus, name="job_status_enum", native_enum=False),
        default=JobStatus.PENDING,
        nullable=False,
        index=True
    )
    processing_started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)

    # ComfyUI Assignment 2 Fields
    workflow_id = Column(String(255), nullable=True)
    seed = Column(BigInteger, nullable=True)
    sampler = Column(String(100), default="dpmpp_2m_karras", nullable=True)
    steps = Column(Integer, default=25, nullable=True)
    cfg = Column(Float, default=7.0, nullable=True)
    denoise = Column(Float, default=0.65, nullable=True)
    comfy_status = Column(String(100), default="Completed", nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<Job(id={self.id}, product_name='{self.product_name}', status='{self.status}')>"
