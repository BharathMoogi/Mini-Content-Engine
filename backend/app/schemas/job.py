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
    workflow_id: Optional[str] = Field(None)
    seed: Optional[int] = Field(None)
    sampler: Optional[str] = Field(None)
    steps: Optional[int] = Field(None)
    cfg: Optional[float] = Field(None)
    denoise: Optional[float] = Field(None)
    comfy_status: Optional[str] = Field(None)


# ------------------------------------------------------------------
# Response Schemas
# ------------------------------------------------------------------

class JobResponse(JobBase):
    id: int
    status: JobStatus
    processing_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    workflow_id: Optional[str] = None
    seed: Optional[int] = None
    sampler: Optional[str] = "dpmpp_2m_karras"
    steps: Optional[int] = 25
    cfg: Optional[float] = 7.0
    denoise: Optional[float] = 0.65
    comfy_status: Optional[str] = "Completed"
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
