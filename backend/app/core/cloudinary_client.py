import os
import cloudinary
import cloudinary.uploader


def init_cloudinary() -> None:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True
    )


def upload_cv(file_bytes: bytes, filename: str, folder: str = "cvs") -> str:
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        public_id=filename,
        resource_type="raw",
        overwrite=True,
        use_filename=False
    )
    return result["secure_url"]