from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.job import JobStatus
from app.schemas.job import JobCreate, JobListResponse, JobResponse, JobUpdate
from app.services.job_service import job_service

router = APIRouter()


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Job record directly",
)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
) -> JobResponse:
    """
    Directly create a job record (JSON body).
    For file-upload based job creation, use POST /generate.
    """
    return job_service.create_job(db=db, obj_in=job_in)


@router.get(
    "",
    response_model=JobListResponse,
    summary="List all Jobs",
)
def list_jobs(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    job_status: Optional[JobStatus] = Query(
        None, alias="status", description="Filter by job status"
    ),
) -> JobListResponse:
    """
    Retrieve all content generation jobs with optional status filtering and pagination.
    """
    items, total = job_service.get_jobs(db=db, skip=skip, limit=limit, status=job_status)
    return JobListResponse(total=total, items=items)


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get a Job by ID",
)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
) -> JobResponse:
    """
    Retrieve the full details of a single job by its unique ID.
    """
    job = job_service.get_job(db=db, job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found.",
        )
    return job


@router.patch(
    "/{job_id}",
    response_model=JobResponse,
    summary="Update a Job",
)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    db: Session = Depends(get_db),
) -> JobResponse:
    """
    Partially update job attributes (status, generated prompt, generated image URL, etc.).
    """
    updated = job_service.update_job(db=db, job_id=job_id, obj_in=job_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found.",
        )
    return updated


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a Job",
)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
) -> None:
    """
    Delete a job by its ID. Returns 204 No Content on success.
    """
    success = job_service.delete_job(db=db, job_id=job_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found.",
        )
