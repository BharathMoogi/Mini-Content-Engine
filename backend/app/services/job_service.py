from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.job import Job, JobStatus
from app.repositories.job_repository import job_repository, JobRepository
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    def __init__(self, repository: JobRepository = job_repository):
        self.repository = repository

    def create_job(self, db: Session, obj_in: JobCreate) -> Job:
        return self.repository.create(db=db, obj_in=obj_in)

    def get_job(self, db: Session, job_id: int) -> Optional[Job]:
        return self.repository.get_by_id(db=db, job_id=job_id)

    def get_jobs(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[JobStatus] = None,
    ) -> Tuple[List[Job], int]:
        jobs = self.repository.get_multi(db=db, skip=skip, limit=limit, status=status)
        total = self.repository.count(db=db, status=status)
        return jobs, total

    def update_job(
        self,
        db: Session,
        job_id: int,
        obj_in: JobUpdate,
    ) -> Optional[Job]:
        db_obj = self.repository.get_by_id(db=db, job_id=job_id)
        if not db_obj:
            return None
        return self.repository.update(db=db, db_obj=db_obj, obj_in=obj_in)

    def update_job_status(
        self,
        db: Session,
        job_id: int,
        status: JobStatus,
        generated_prompt: Optional[str] = None,
        generated_image_url: Optional[str] = None,
    ) -> Optional[Job]:
        db_obj = self.repository.get_by_id(db=db, job_id=job_id)
        if not db_obj:
            return None
        update_data = {"status": status}
        if generated_prompt is not None:
            update_data["generated_prompt"] = generated_prompt
        if generated_image_url is not None:
            update_data["generated_image_url"] = generated_image_url

        return self.repository.update(db=db, db_obj=db_obj, obj_in=update_data)

    def delete_job(self, db: Session, job_id: int) -> bool:
        return self.repository.delete(db=db, job_id=job_id)


job_service = JobService()
