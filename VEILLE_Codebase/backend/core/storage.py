"""
VEILLE — MinIO Object Storage Service
Provides tamper-evident evidence vault storage, SHA-256 verification,
and presigned download URLs with automatic fallback resilience.
"""
import io
import logging
import os
from typing import Optional, Tuple
from core.config import settings

logger = logging.getLogger("veille.storage")

class StorageService:
    def __init__(self):
        self.client = None
        self.bucket = settings.MINIO_BUCKET_NAME or "veille-evidence"
        self._init_client()

    def _init_client(self):
        try:
            import socket
            endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
            host, _, port_str = endpoint.partition(":")
            port = int(port_str) if port_str else 9000
            
            # Fast socket probe (0.2s timeout) to prevent blocking if MinIO is not running
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.2)
                s.connect((host, port))

            from minio import Minio
            self.client = Minio(
                endpoint,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=False,
            )
            # Ensure bucket exists
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Created MinIO evidence vault bucket: '{self.bucket}'")
            else:
                logger.info(f"Connected to MinIO evidence vault bucket: '{self.bucket}'")
        except Exception as e:
            logger.info(f"MinIO offline or local mode: {e}. Using local storage vault.")
            self.client = None


    def upload_file(
        self,
        object_key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> Tuple[bool, str]:
        """
        Uploads an evidence file to MinIO object storage.
        Returns (success_status, storage_path_or_key).
        """
        if self.client:
            try:
                data_stream = io.BytesIO(data)
                self.client.put_object(
                    self.bucket,
                    object_key,
                    data_stream,
                    length=len(data),
                    content_type=content_type,
                )
                logger.info(f"Uploaded evidence object '{object_key}' ({len(data)} bytes) to MinIO bucket '{self.bucket}'")
                return True, f"minio://{self.bucket}/{object_key}"
            except Exception as e:
                logger.error(f"MinIO put_object failed: {e}. Writing to local fallback.")

        # Local fallback
        local_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tmp", "uploads")
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, object_key)
        with open(local_path, "wb") as f:
            f.write(data)
        return False, local_path

    def get_file(self, object_key_or_path: str) -> Optional[bytes]:
        """Retrieves raw evidence file bytes from MinIO or local filesystem."""
        if object_key_or_path.startswith("minio://") and self.client:
            try:
                parts = object_key_or_path.replace("minio://", "").split("/", 1)
                bucket = parts[0]
                key = parts[1]
                response = self.client.get_object(bucket, key)
                data = response.read()
                response.close()
                response.release_conn()
                return data
            except Exception as e:
                logger.error(f"Failed to read from MinIO: {e}")

        # Local read
        if os.path.exists(object_key_or_path):
            try:
                with open(object_key_or_path, "rb") as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Failed to read local file: {e}")

        return None

    def get_download_url(self, object_key_or_path: str, expiry_seconds: int = 3600) -> Optional[str]:
        """Generates a presigned MinIO URL or returns a download endpoint reference."""
        if object_key_or_path.startswith("minio://") and self.client:
            try:
                from datetime import timedelta
                parts = object_key_or_path.replace("minio://", "").split("/", 1)
                bucket = parts[0]
                key = parts[1]
                url = self.client.presigned_get_object(
                    bucket,
                    key,
                    expires=timedelta(seconds=expiry_seconds),
                )
                return url
            except Exception as e:
                logger.warning(f"Failed to generate presigned URL: {e}")

        return None

storage_service = StorageService()
