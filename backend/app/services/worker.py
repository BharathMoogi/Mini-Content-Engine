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

    Assignment 2 Workflow with ComfyUI Integration:
    1. Update Job status to 'Processing' with processing_started_at timestamp.
    2. Call GeminiPromptService with Product Name, Description, and Image.
    3. Call ImageGenerationService (routes to ComfyUIService).
    4. Calculate duration_seconds and store ComfyUI workflow metadata & seed into PostgreSQL.
    """
    db = SessionLocal()
    start_time = datetime.now(timezone.utc)
    try:
        job = job_service.get_job(db=db, job_id=job_id)
        if not job:
            logger.error(f"[Worker] Job #{job_id} not found in database.")
            return

        # 1. Update Job status to 'Processing'
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

        # 3. Call ImageGenerationService (ComfyUI Img2Img workflow engine)
        logger.info(f"[Worker] Step 3: Executing ComfyUI Img2Img workflow for Job #{job_id}...")
        generated_image_url, comfy_meta = image_generation_service.generate_image(
            prompt=generated_prompt,
            reference_image=job.uploaded_image_path,
        )

        # 4. Calculate total duration and record completion timestamp + ComfyUI metadata
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
            workflow_id=comfy_meta.get("workflow_id"),
            seed=comfy_meta.get("seed"),
            sampler=comfy_meta.get("sampler", "dpmpp_2m_karras"),
            steps=comfy_meta.get("steps", 25),
            cfg=comfy_meta.get("cfg", 7.0),
            denoise=comfy_meta.get("denoise", 0.65),
            comfy_status=comfy_meta.get("comfy_status", "Completed"),
        )

        logger.info(f"[Worker] Job #{job_id} finished successfully via ComfyUI. Image: {generated_image_url}")

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
