from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.upload import save_uploaded_image
from app.schemas.job import GenerateJobResponse, JobCreate
from app.services.job_service import job_service
from app.services.worker import process_job_task

router = APIRouter()


@router.post(
    "",
    response_model=GenerateJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit a new content generation job",
    description=(
        "Accepts a product name, optional product description, and an optional product image. "
        "Validates all inputs, saves the uploaded image to disk, creates a Job record in "
        "PostgreSQL with status 'Pending', dispatches an async background worker task, "
        "and returns the Job ID immediately."
    ),
)
async def generate(
    background_tasks: BackgroundTasks,
    product_name: str = Form(
        ...,
        min_length=1,
        max_length=255,
        description="Name of the product",
    ),
    product_description: str = Form(
        None,
        description="Optional detailed product description",
    ),
    product_image: UploadFile = File(
        None,
        description="Optional product image (JPEG, PNG, or WebP, max 10MB)",
    ),
    db: Session = Depends(get_db),
) -> GenerateJobResponse:
    """
    POST /api/v1/generate

    Validates input, saves uploaded image, creates and persists a Job in PostgreSQL.
    Dispatches asynchronous AI copy generation & banner synthesis background task.
    Returns the new Job ID and status immediately.
    """
    uploaded_image_path: str | None = None

    # Save image if provided
    if product_image and product_image.filename:
        uploaded_image_path = await save_uploaded_image(product_image)

    # Build create schema
    job_in = JobCreate(
        product_name=product_name.strip(),
        product_description=product_description.strip() if product_description else None,
        uploaded_image_path=uploaded_image_path,
    )

    # Persist job in database
    new_job = job_service.create_job(db=db, obj_in=job_in)

    # Dispatch async background worker task
    background_tasks.add_task(process_job_task, job_id=new_job.id)

    return GenerateJobResponse(
        job_id=new_job.id,
        status=new_job.status,
        message=f"Job #{new_job.id} created successfully. Async generation started.",
        created_at=new_job.created_at,
    )

