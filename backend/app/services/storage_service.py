import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


class StorageService:
    """
    Service responsible for storing and managing uploaded product images.
    """

    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    async def save_uploaded_image(self, file: UploadFile) -> str:
        """
        Validates and saves an uploaded product image file to disk.

        Args:
            file: UploadFile object from FastAPI endpoint.

        Returns:
            str: Relative path string to the stored image file (e.g. 'uploads/img_123.jpg').
        """
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file has no filename.",
            )

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WebP.",
            )

        unique_filename = f"product_{uuid.uuid4().hex[:12]}{ext}"
        destination_path = os.path.join(self.upload_dir, unique_filename)

        file_size = 0
        async with aiofiles.open(destination_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    # Remove partial file if size limit exceeded
                    if os.path.exists(destination_path):
                        os.remove(destination_path)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File size exceeds maximum allowed limit of 10MB.",
                    )
                await out_file.write(chunk)

        relative_path = f"/uploads/{unique_filename}"
        return relative_path


storage_service = StorageService()
