import logging
from datetime import datetime, timezone
from app.core.database import SessionLocal
from app.models.job import JobStatus
from app.services.gemini_prompt_service import gemini_prompt_service
from app.services.image_generation_service import image_generation_service
from app.services.job_service import job_service

logger = logging.getLogger(__name__)


def process_job_task(job_id: int) -> None:
    """
    Background worker task dispatched asynchronously after POST /api/v1/generate.

    Assignment 1 Workflow with Timeline Tracking:
    1. Update Job status to 'Processing' with processing_started_at timestamp.
    2. Call GeminiPromptService with Product Name, Description, and Image.
    3. Call ImageGenerationService (FLUX API / Composite Engine).
    4. Calculate duration_seconds and set status to 'Completed' with completed_at timestamp.
    """
    db = SessionLocal()
    start_time = datetime.now(timezone.utc)
    try:
        job = job_service.get_job(db=db, job_id=job_id)
        if not job:
            logger.error(f"[Worker] Job #{job_id} not found in database.")
            return

        # 1. Update Job status to 'Processing' & record processing start timestamp
        logger.info(f"[Worker] Step 1: Updating Job #{job_id} status to 'Processing'...")
        job_service.update_job_status(
            db=db,
            job_id=job_id,
            status=JobStatus.PROCESSING,
            processing_started_at=start_time,
        )

        # 2. Call Gemini API for visual prompt engineering
        logger.info(f"[Worker] Step 2: Requesting prompt from GeminiPromptService for Job #{job_id}...")
        generated_prompt = gemini_prompt_service.generate_prompt(
            product_name=job.product_name,
            product_description=job.product_description,
            reference_image=job.uploaded_image_path,
        )

        job_service.update_job_status(
            db=db,
            job_id=job_id,
            status=JobStatus.PROCESSING,
            generated_prompt=generated_prompt,
        )

        # 3. Call ImageGenerationService for FLUX AI image synthesis
        logger.info(f"[Worker] Step 3: Calling ImageGenerationService.generate_image for Job #{job_id}...")
        generated_image_url = image_generation_service.generate_image(
            prompt=generated_prompt,
            reference_image=job.uploaded_image_path,
        )

        # 4. Calculate total duration and record completion timestamp
        finish_time = datetime.now(timezone.utc)
        created_time = job.created_at
        if created_time and created_time.tzinfo is None:
            created_time = created_time.replace(tzinfo=timezone.utc)

        duration = round((finish_time - created_time).total_seconds(), 2)

        logger.info(f"[Worker] Step 4: Marking Job #{job_id} as Completed (Duration: {duration}s)...")
        job_service.update_job_status(
            db=db,
            job_id=job_id,
            status=JobStatus.COMPLETED,
            generated_prompt=generated_prompt,
            generated_image_url=generated_image_url,
            completed_at=finish_time,
            duration_seconds=duration,
        )

        logger.info(f"[Worker] Job #{job_id} completed successfully in {duration}s. Image: {generated_image_url}")

    except Exception as e:
        error_msg = str(e)
        logger.error(f"[Worker] Exception processing Job #{job_id}: {error_msg}", exc_info=True)
        try:
            job_service.update_job_status(
                db=db,
                job_id=job_id,
                status=JobStatus.FAILED,
                generated_prompt=f"Error during job processing: {error_msg}",
            )
        except Exception as db_err:
            logger.error(f"[Worker] Failed to record error status for Job #{job_id}: {db_err}")
    finally:
        db.close()
