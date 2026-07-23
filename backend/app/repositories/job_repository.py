from typing import Any, Dict, List, Optional, Union
from sqlalchemy.orm import Session
from app.models.job import Job, JobStatus
from app.schemas.job import JobCreate, JobUpdate


class JobRepository:
    def create(self, db: Session, obj_in: JobCreate) -> Job:
        db_obj = Job(
            product_name=obj_in.product_name,
            product_description=obj_in.product_description,
            uploaded_image_path=obj_in.uploaded_image_path,
            status=JobStatus.PENDING,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_id(self, db: Session, job_id: int) -> Optional[Job]:
        return db.query(Job).filter(Job.id == job_id).first()

    def get_multi(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[JobStatus] = None,
    ) -> List[Job]:
        query = db.query(Job)
        if status:
            query = query.filter(Job.status == status)
        return query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    def count(self, db: Session, status: Optional[JobStatus] = None) -> int:
        query = db.query(Job)
        if status:
            query = query.filter(Job.status == status)
        return query.count()

    def update(
        self,
        db: Session,
        db_obj: Job,
        obj_in: Union[JobUpdate, Dict[str, Any]],
    ) -> Job:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, job_id: int) -> bool:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            db.delete(job)
            db.commit()
            return True
        return False


job_repository = JobRepository()
