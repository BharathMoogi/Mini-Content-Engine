from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.job import JobStatus


# ------------------------------------------------------------------
# Request Schemas
# ------------------------------------------------------------------

class JobBase(BaseModel):
    product_name: str = Field(..., max_length=255, description="Name of the product")
    product_description: Optional[str] = Field(None, description="Detailed product description")
    uploaded_image_path: Optional[str] = Field(None, max_length=512, description="Path to uploaded image")
    generated_prompt: Optional[str] = Field(None, description="Generated prompt for content engine")
    generated_image_url: Optional[str] = Field(None, max_length=512, description="URL of generated image")


class JobCreate(BaseModel):
    product_name: str = Field(..., max_length=255, description="Name of the product")
    product_description: Optional[str] = Field(None, description="Detailed product description")
    uploaded_image_path: Optional[str] = Field(None, max_length=512, description="Path to uploaded image")


class JobUpdate(BaseModel):
    product_name: Optional[str] = Field(None, max_length=255)
    product_description: Optional[str] = Field(None)
    uploaded_image_path: Optional[str] = Field(None, max_length=512)
    generated_prompt: Optional[str] = Field(None)
    generated_image_url: Optional[str] = Field(None, max_length=512)
    status: Optional[JobStatus] = Field(None, description="Job execution status")
    processing_started_at: Optional[datetime] = Field(None)
    completed_at: Optional[datetime] = Field(None)
    duration_seconds: Optional[float] = Field(None)


# ------------------------------------------------------------------
# Response Schemas
# ------------------------------------------------------------------

class JobResponse(JobBase):
    id: int
    status: JobStatus
    processing_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    total: int
    items: List[JobResponse]


# ------------------------------------------------------------------
# Generate Endpoint Response Schema
# ------------------------------------------------------------------

class GenerateJobResponse(BaseModel):
    """Lightweight response returned immediately after POST /generate."""
    job_id: int
    status: JobStatus
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
