import base64
import mimetypes
import os
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, status
from supabase import Client, create_client
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("supabase_service")

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_PRODUCE_PHOTO_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB (Phase 5 requirement)


def validate_image_magic_bytes(file_bytes: bytes, clean_content_type: str) -> bool:
    """Verifies that the file starts with expected image binary magic signatures."""
    if not file_bytes:
        return False
    if clean_content_type in ("image/jpeg", "image/jpg"):
        return len(file_bytes) >= 3 and file_bytes[:3] == b"\xff\xd8\xff"
    if clean_content_type == "image/png":
        return len(file_bytes) >= 8 and file_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    if clean_content_type == "image/webp":
        return len(file_bytes) >= 12 and file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP"
    return False


def parse_image_dimensions(file_bytes: bytes, mime_type: str) -> tuple:
    """Extract width and height from binary headers without external C dependencies."""
    import struct

    try:
        if mime_type == "image/png" and len(file_bytes) >= 24:
            if file_bytes[:8] == b"\x89PNG\r\n\x1a\n":
                w, h = struct.unpack(">II", file_bytes[16:24])
                return int(w), int(h)
        elif mime_type in ("image/jpeg", "image/jpg") and len(file_bytes) >= 2:
            if file_bytes[:2] == b"\xff\xd8":
                idx = 2
                b_len = len(file_bytes)
                while idx < b_len:
                    if file_bytes[idx] != 0xFF:
                        break
                    while idx < b_len and file_bytes[idx] == 0xFF:
                        idx += 1
                    if idx >= b_len:
                        break
                    marker = file_bytes[idx]
                    idx += 1
                    if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                        if idx + 7 <= b_len:
                            h, w = struct.unpack(">HH", file_bytes[idx + 3 : idx + 7])
                            return int(w), int(h)
                        break
                    elif marker in (0xD9, 0xDA):
                        break
                    elif idx + 2 <= b_len:
                        length = struct.unpack(">H", file_bytes[idx : idx + 2])[0]
                        idx += length
                    else:
                        break
        elif mime_type == "image/webp" and len(file_bytes) >= 30:
            if file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP":
                if file_bytes[12:16] == b"VP8 " and len(file_bytes) >= 30:
                    if file_bytes[23:26] == b"\x9d\x01\x2a":
                        w, h = struct.unpack("<HH", file_bytes[26:30])
                        return int(w & 0x3FFF), int(h & 0x3FFF)
                elif file_bytes[12:16] == b"VP8L" and len(file_bytes) >= 25:
                    if file_bytes[20] == 0x2F:
                        b0, b1, b2, b3 = file_bytes[21:25]
                        w = 1 + (((b1 & 0x3F) << 8) | b0)
                        h = 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
                        return int(w), int(h)
    except Exception:
        pass
    return None, None


class SupabaseService:
    """Encapsulates Supabase Auth, Database, and Storage client interactions."""

    def __init__(self):
        self._client: Optional[Client] = None

    @property
    def client(self) -> Optional[Client]:
        if self._client is None:
            if (
                settings.SUPABASE_URL
                and settings.SUPABASE_SERVICE_ROLE_KEY
                and "placeholder" not in settings.SUPABASE_URL
                and "mock" not in settings.SUPABASE_URL
            ):
                try:
                    self._client = create_client(
                        settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
                    )
                    logger.info("Supabase client successfully initialized.")
                except Exception as e:
                    logger.warning(f"Failed to initialize Supabase client: {e}")
                    self._client = None
        return self._client

    def verify_token_remotely(self, token: str) -> Optional[dict]:
        """Optionally verify token against Supabase Auth endpoint."""
        if not self.client:
            return None
        try:
            user_response = self.client.auth.get_user(token)
            if user_response and user_response.user:
                return {
                    "sub": user_response.user.id,
                    "email": user_response.user.email,
                    "user_metadata": user_response.user.user_metadata,
                }
        except Exception as e:
            logger.debug(f"Remote Supabase token verification failed: {e}")
        return None

    def upload_farmer_profile_photo(
        self,
        user_id: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> str:
        """Uploads a farmer profile photo to Supabase Storage ('farmer-profiles' bucket)."""
        if len(file_bytes) > MAX_PROFILE_PHOTO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image file size exceeds maximum allowed limit of {MAX_PROFILE_PHOTO_SIZE_BYTES // (1024 * 1024)}MB.",
            )

        clean_content_type = content_type.lower().split(";")[0].strip()
        if clean_content_type not in ALLOWED_IMAGE_TYPES:
            ext = os.path.splitext(filename)[1].lower()
            matching = [ct for ct, e in ALLOWED_IMAGE_TYPES.items() if e == ext]
            if matching:
                clean_content_type = matching[0]
            else:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Invalid file format '{clean_content_type}'. Only JPEG, PNG, and WEBP images are allowed.",
                )

        if not validate_image_magic_bytes(file_bytes, clean_content_type):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Corrupted or invalid image content. File signature does not match image format.",
            )

        file_ext = ALLOWED_IMAGE_TYPES.get(clean_content_type, ".jpg")
        storage_path = f"{user_id}/profile{file_ext}"
        bucket_name = "farmer-profiles"

        # 1. Attempt live Supabase Storage upload
        if self.client:
            try:
                self.client.storage.from_(bucket_name).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": clean_content_type, "upsert": "true"},
                )
                public_url = self.client.storage.from_(bucket_name).get_public_url(storage_path)
                logger.info(f"Uploaded photo to Supabase Storage: {public_url}")
                return public_url
            except Exception as e:
                logger.warning(f"Supabase Storage upload encountered error: {e}. Falling back to local handler.")

        # 2. Local fallback
        try:
            uploads_dir = Path("uploads") / "farmer-profiles" / user_id
            uploads_dir.mkdir(parents=True, exist_ok=True)
            local_file_path = uploads_dir / f"profile{file_ext}"
            with open(local_file_path, "wb") as f:
                f.write(file_bytes)
            return f"/uploads/farmer-profiles/{user_id}/profile{file_ext}"
        except Exception as e:
            logger.warning(f"Local storage fallback write failed: {e}. Generating data URI.")
            b64_data = base64.b64encode(file_bytes).decode("utf-8")
            return f"data:{clean_content_type};base64,{b64_data}"

    def upload_produce_image(
        self,
        user_id: str,
        produce_id: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> dict:
        """
        Uploads a produce lot photo to Supabase Storage ('produce-images' bucket).
        Enforces:
        - Image format: JPEG, PNG, WEBP (validated by extension & magic bytes)
        - Max file size: 10MB (Phase 5 requirement)
        - Predictable path: {user_id}/{produce_id}/{file_uuid}.{ext}
        - Extracts image width & height metadata
        Returns dict with storage path, public URL, dimensions, and file metadata.
        """
        import uuid

        if len(file_bytes) > MAX_PRODUCE_PHOTO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Produce image size exceeds maximum allowed limit of {MAX_PRODUCE_PHOTO_SIZE_BYTES // (1024 * 1024)}MB.",
            )

        clean_content_type = content_type.lower().split(";")[0].strip()
        if clean_content_type not in ALLOWED_IMAGE_TYPES:
            ext = os.path.splitext(filename)[1].lower()
            matching = [ct for ct, e in ALLOWED_IMAGE_TYPES.items() if e == ext]
            if matching:
                clean_content_type = matching[0]
            else:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail=f"Invalid file format '{clean_content_type}'. Only JPEG, PNG, and WEBP images are allowed.",
                )

        # Deep magic-bytes validation (rejects SVGs, PDFs, EXEs)
        if not validate_image_magic_bytes(file_bytes, clean_content_type):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Corrupted or invalid image content. File signature does not match image format.",
            )

        file_ext = ALLOWED_IMAGE_TYPES.get(clean_content_type, ".jpg")
        img_id = str(uuid.uuid4())
        storage_path = f"{user_id}/{produce_id}/{img_id}{file_ext}"
        bucket_name = "produce-images"

        width, height = parse_image_dimensions(file_bytes, clean_content_type)
        safe_filename = os.path.basename(filename).strip() or f"photo{file_ext}"

        # 1. Live Supabase Storage attempt
        if self.client:
            try:
                self.client.storage.from_(bucket_name).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": clean_content_type, "upsert": "true"},
                )
                public_url = self.client.storage.from_(bucket_name).get_public_url(storage_path)
                logger.info(f"Uploaded produce image to Supabase Storage: {public_url}")
                return {
                    "storage_path": storage_path,
                    "image_url": public_url,
                    "public_url": public_url,
                    "file_name": safe_filename,
                    "mime_type": clean_content_type,
                    "file_size": len(file_bytes),
                    "width": width,
                    "height": height,
                }
            except Exception as e:
                logger.warning(f"Supabase Storage produce image upload failed: {e}. Using local fallback.")

        # 2. Local filesystem fallback for dev & testing
        try:
            uploads_dir = Path("uploads") / "produce-images" / user_id / produce_id
            uploads_dir.mkdir(parents=True, exist_ok=True)
            local_file_path = uploads_dir / f"{img_id}{file_ext}"
            with open(local_file_path, "wb") as f:
                f.write(file_bytes)
            local_url = f"/uploads/produce-images/{user_id}/{produce_id}/{img_id}{file_ext}"
            return {
                "storage_path": storage_path,
                "image_url": local_url,
                "public_url": local_url,
                "file_name": safe_filename,
                "mime_type": clean_content_type,
                "file_size": len(file_bytes),
                "width": width,
                "height": height,
            }
        except Exception as e:
            logger.error(f"Local storage fallback write failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store uploaded image.",
            )

    def delete_produce_image(self, storage_path: str) -> bool:
        """Removes a produce image from Supabase Storage or local directory."""
        bucket_name = "produce-images"
        deleted = False
        if self.client:
            try:
                self.client.storage.from_(bucket_name).remove([storage_path])
                deleted = True
            except Exception as e:
                logger.warning(f"Failed to delete {storage_path} from Supabase: {e}")
        # Local cleanup attempt
        try:
            local_path = Path("uploads") / "produce-images" / storage_path
            if local_path.exists():
                local_path.unlink()
                deleted = True
        except Exception as e:
            logger.debug(f"Local delete failed: {e}")
        return deleted

    def sync_produce_to_supabase_db(self, produce) -> bool:
        """Upsert produce listing record into Supabase PostgreSQL database."""
        if not self.client:
            return False
        try:
            payload = {
                "id": str(produce.id),
                "farmer_profile_id": str(produce.farmer_profile_id),
                "farm_id": str(produce.farm_id),
                "product_name": produce.product_name,
                "category": str(produce.category),
                "variety": produce.variety,
                "description": produce.description,
                "total_quantity": float(produce.total_quantity),
                "available_quantity": float(produce.available_quantity),
                "quantity_unit": str(produce.quantity_unit),
                "quality_grade": str(produce.quality_grade),
                "expected_price": float(produce.expected_price),
                "price_unit": str(produce.price_unit),
                "minimum_order_quantity": float(produce.minimum_order_quantity),
                "status": str(produce.status),
            }
            self.client.table("produce_listings").upsert(payload).execute()
            logger.info(f"Synchronized produce {produce.id} to Supabase database.")
            return True
        except Exception as e:
            logger.warning(f"Failed to sync produce {produce.id} to Supabase database: {e}")
            return False

    def sync_produce_image_to_supabase_db(self, image) -> bool:
        """Upsert produce image record into Supabase produce_images table."""
        if not self.client:
            return False
        try:
            payload = {
                "id": str(image.id),
                "produce_listing_id": str(image.produce_listing_id),
                "storage_path": image.storage_path,
                "image_url": image.image_url,
                "public_url": image.public_url or image.image_url,
                "file_name": image.file_name,
                "is_primary": bool(image.is_primary),
                "display_order": int(image.display_order or 0),
            }
            self.client.table("produce_images").upsert(payload).execute()
            logger.info(f"Synchronized produce image {image.id} to Supabase database.")
            return True
        except Exception as e:
            logger.warning(f"Failed to sync produce image {image.id} to Supabase database: {e}")
            return False


supabase_service = SupabaseService()
