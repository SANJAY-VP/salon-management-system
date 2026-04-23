"""
Store uploaded images on Cloudinary or local disk (single code path for /images/upload).
"""
from __future__ import annotations

import os
import shutil
import time
import uuid
from typing import Optional, Tuple

from fastapi import UploadFile

from app.config import settings

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

UPLOAD_DIR = "uploads"

FOLDER_MAP = {
    "avatar": "avatars",
    "shop": "shops",
    "profile": "profiles",
}


def get_extension(filename: str) -> str:
    return filename.split(".")[-1].lower() if "." in filename else ""


def _local_public_base() -> str:
    return settings.API_PUBLIC_URL.rstrip("/")


async def save_image(
    file: UploadFile,
    context: str,
    entity_id: Optional[str],
) -> Tuple[str, str]:
    """
    Persist upload and return (url_for_browser, value_to_store_in_db).
    For Cloudinary both are the secure HTTPS URL; for disk, DB stores basename only.
    """
    ext = get_extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Invalid file extension")

    folder_name = FOLDER_MAP.get(context, context)
    unique_id = str(uuid.uuid4())[:8]
    time_str = str(int(time.time()))
    entity_str = entity_id if entity_id else "new"
    basename = f"{context}-{entity_str}-{time_str}-{unique_id}.{ext}"

    if settings.CLOUDINARY_URL:
        import cloudinary.uploader

        cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL, secure=True)
        raw = await file.read()
        result = cloudinary.uploader.upload(
            raw,
            folder=f"salon/{folder_name}",
            public_id=basename.rsplit(".", 1)[0],
            resource_type="image",
            overwrite=False,
        )
        secure = result.get("secure_url") or result.get("url")
        if not secure:
            raise RuntimeError("Cloudinary upload did not return a URL")
        return secure, secure

    target_dir = os.path.join(UPLOAD_DIR, folder_name)
    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, basename)
    with open(file_path, "wb") as buffer:
        await file.seek(0)
        shutil.copyfileobj(file.file, buffer)

    url = f"{_local_public_base()}/uploads/{folder_name}/{basename}"
    return url, basename
