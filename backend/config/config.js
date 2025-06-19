# cortate/backend/config/config.py

import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "supersecretkey"
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER") or "uploads"
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
