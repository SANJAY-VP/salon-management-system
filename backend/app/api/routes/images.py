"""
Images Route
"""
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.utils.image_storage import save_image

router = APIRouter(prefix="/images", tags=["Images"])


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    context: str = Form(...),
    entity_id: Optional[str] = Form(None),
):
    if context not in ("avatar", "shop", "profile"):
        raise HTTPException(status_code=400, detail="Invalid context")

    try:
        url, stored = await save_image(file, context, entity_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {e!s}",
        ) from e

    return {"filename": stored, "url": url}
