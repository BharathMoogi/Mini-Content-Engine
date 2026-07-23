import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


async def save_uploaded_image(file: UploadFile) -> str:
    """
    Validates and saves an uploaded image to disk.
    Returns the relative file path stored in the database.

    Raises:
        HTTPException 415: If the file content-type is not a supported image type.
        HTTPException 413: If the file exceeds the maximum allowed size.
    """
    # Validate content type
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported image type '{file.content_type}'. "
                f"Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
            ),
        )

    # Read content and validate file size
    contents = await file.read()
    if len(contents) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image file exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB.",
        )

    # Determine file extension from content-type
    ext_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    ext = ext_map.get(file.content_type, ".jpg")

    # Generate a unique filename
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_path: Path = settings.upload_path / filename

    # Write file asynchronously
    async with aiofiles.open(upload_path, "wb") as out_file:
        await out_file.write(contents)

    # Return the relative path to store in DB
    return str(Path(settings.UPLOAD_DIR) / filename)


def delete_uploaded_image(file_path: str) -> None:
    """
    Removes an uploaded image from disk given its relative path.
    Silently ignores missing files.
    """
    path = Path(file_path)
    if path.exists():
        path.unlink()
