import logging
from app.core.database import SessionLocal
from app.models.job import JobStatus
from app.services.gemini_service import gemini_service
from app.services.image_generation_service import image_generation_service
from app.services.job_service import job_service

logger = logging.getLogger(__name__)


def process_job_task(job_id: int) -> None:
    """
    Background worker task dispatched asynchronously after POST /api/v1/generate.

    Workflow:
    1. Fetch Job record from PostgreSQL database.
    2. Update Job Status to 'Processing'.
    3. Call Gemini API to generate detailed text-to-image prompt (FLUX / SD / ComfyUI).
    4. Store generated prompt in PostgreSQL.
    5. Pass generated prompt to Image Generation Service (waits 5 seconds, returns placeholder URL).
    6. Update Job with generated image URL and set Job Status to 'Completed'.
    7. On any error, log exception and update Job Status to 'Failed' in PostgreSQL.
    """
    db = SessionLocal()
    try:
        job = job_service.get_job(db=db, job_id=job_id)
        if not job:
            logger.error(f"[Worker] Job #{job_id} not found in database.")
            return

        # 1. Update Job Status to 'Processing' in PostgreSQL
        logger.info(f"[Worker] Updating Job #{job_id} status to 'Processing'...")
        job_service.update_job_status(db=db, job_id=job_id, status=JobStatus.PROCESSING)

        # 2. Call Gemini API with product details and uploaded image
        logger.info(f"[Worker] Step 1/2: Requesting prompt generation from Gemini API for Job #{job_id}...")
        generated_prompt = gemini_service.generate_image_prompt(
            product_name=job.product_name,
            product_description=job.product_description,
            uploaded_image_path=job.uploaded_image_path,
        )

        # 3. Store generated prompt in PostgreSQL
        job_service.update_job_status(
            db=db,
            job_id=job_id,
            status=JobStatus.PROCESSING,
            generated_prompt=generated_prompt,
        )

        # 4. Call Image Generation Service (waits 5 seconds, generates placeholder URL)
        logger.info(f"[Worker] Step 2/2: Requesting image generation for Job #{job_id}...")
        generated_image_url = image_generation_service.generate_image_from_prompt(
            job_id=job.id,
            prompt=generated_prompt,
        )

        # 5. Store generated image URL in PostgreSQL and set Status to 'Completed'
        logger.info(f"[Worker] Saving image URL to PostgreSQL and marking Job #{job_id} as Completed...")
        job_service.update_job_status(
            db=db,
            job_id=job_id,
            status=JobStatus.COMPLETED,
            generated_prompt=generated_prompt,
            generated_image_url=generated_image_url,
        )

        logger.info(f"[Worker] Job #{job_id} completed successfully. Image URL: {generated_image_url}")

    except Exception as e:
        error_msg = str(e)
        logger.error(f"[Worker] Processing failed for Job #{job_id}: {error_msg}", exc_info=True)
        try:
            # Mark job as Failed in PostgreSQL
            job_service.update_job_status(
                db=db,
                job_id=job_id,
                status=JobStatus.FAILED,
                generated_prompt=f"Error during job processing: {error_msg}",
            )
        except Exception as db_err:
            logger.error(f"[Worker] Could not update failed status for Job #{job_id}: {db_err}")
    finally:
        db.close()
