import logging
from app.core.database import SessionLocal
from app.models.job import JobStatus
from app.services.gemini_prompt_service import gemini_prompt_service
from app.services.image_generation_service import image_generation_service
from app.services.job_service import job_service

logger = logging.getLogger(__name__)


def process_job_task(job_id: int) -> None:
    """
    Background worker task dispatched asynchronously after POST /api/v1/generate.

    Assignment 1 Workflow:
    Step 5: Job initial status is 'Pending'.
    Step 6: Update Job status to 'Processing'.
    Step 7: Call Gemini API (GeminiPromptService) with Product Name, Description, and Image.
            Store generated prompt in PostgreSQL.
    Step 8: Pass generated prompt to ImageGenerationService (simulates 5s, returns placeholder image URL).
    Step 9: Update Job with generated_prompt, generated_image_url, and set status to 'Completed'.
    Step 10: Error handling updates Job status to 'Failed' on any exception.
    """
    db = SessionLocal()
    try:
        job = job_service.get_job(db=db, job_id=job_id)
        if not job:
            logger.error(f"[Worker] Job #{job_id} not found in database.")
            return

        # Step 6: Update Job status to 'Processing'
        logger.info(f"[Worker] Step 6: Updating Job #{job_id} status to 'Processing'...")
        job_service.update_job_status(db=db, job_id=job_id, status=JobStatus.PROCESSING)

        # Step 7: Call Gemini API to analyze product and generate detailed prompt
        logger.info(f"[Worker] Step 7: Requesting prompt from GeminiPromptService for Job #{job_id}...")
        generated_prompt = gemini_prompt_service.generate_prompt(
            product_name=job.product_name,
            product_description=job.product_description,
            reference_image=job.uploaded_image_path,
        )

        # Store generated prompt in PostgreSQL
        job_service.update_job_status(
            db=db,
            job_id=job_id,
            status=JobStatus.PROCESSING,
            generated_prompt=generated_prompt,
        )

        # Step 8: Pass prompt to ImageGenerationService (returns placeholder URL after 5s)
        logger.info(f"[Worker] Step 8: Calling ImageGenerationService.generate_image for Job #{job_id}...")
        generated_image_url = image_generation_service.generate_image(
            prompt=generated_prompt,
            reference_image=job.uploaded_image_path,
        )

        # Step 9: Store generated_image_url and set Job status to 'Completed'
        logger.info(f"[Worker] Step 9: Updating Job #{job_id} status to 'Completed' in database...")
        job_service.update_job_status(
            db=db,
            job_id=job_id,
            status=JobStatus.COMPLETED,
            generated_prompt=generated_prompt,
            generated_image_url=generated_image_url,
        )

        logger.info(f"[Worker] Job #{job_id} finished successfully. Image URL: {generated_image_url}")

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
