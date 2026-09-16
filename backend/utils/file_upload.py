"""
Secure File Upload Management Utility
"""

import os
import uuid
from pathlib import Path
from werkzeug.utils import secure_filename
from config import Config
from services.hash_service import HashService

def is_allowed_file(filename):
    """Checks if a file extension is in the allowed whitelist."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in Config.ALLOWED_EXTENSIONS

def save_uploaded_file(file_obj, subfolder="evidence"):
    """
    Saves a Werkzeug FileStorage object to the uploads folder with a unique UUID prefix.
    Calculates the real SHA-256 hash and byte size.
    Returns dictionary with file metadata.
    """
    original_filename = secure_filename(file_obj.filename)
    if not original_filename:
        original_filename = "unnamed_evidence_file.bin"

    if not is_allowed_file(original_filename):
        raise ValueError(f"File type not permitted. Allowed extensions include documents, media, and archive formats.")

    # Target directory
    target_dir = Config.UPLOAD_FOLDER / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique stored filename to prevent collisions and overwrites
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'bin'
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    saved_path = target_dir / unique_filename

    # Save to disk
    file_obj.save(str(saved_path))

    # Read byte size and compute SHA-256
    file_size_bytes = os.path.getsize(saved_path)
    file_size_formatted = HashService.format_size(file_size_bytes)
    sha256_hash = HashService.compute_sha256_from_file(saved_path)

    # Relative path for storage
    relative_path = f"uploads/{subfolder}/{unique_filename}"

    return {
        "fileName": original_filename,
        "savedFilename": unique_filename,
        "filePath": relative_path,
        "absolutePath": str(saved_path),
        "fileSizeBytes": file_size_bytes,
        "fileSize": file_size_formatted,
        "hashValue": sha256_hash
    }
