"""
COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
Application Configuration Loader
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env if present
load_dotenv(BASE_DIR / '.env')

class Config:
    """Base application configuration."""
    ENV = os.getenv('FLASK_ENV', 'development').lower()
    IS_PRODUCTION = (ENV == 'production')
    DEBUG = not IS_PRODUCTION

    # Port handling (supports Heroku, Render, Railway, AWS, Cloud Run)
    PORT = int(os.getenv('PORT', os.getenv('FLASK_PORT', 5000)))
    
    # Secret Keys
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))

    # Production security validation
    if IS_PRODUCTION:
        if not SECRET_KEY or 'default' in SECRET_KEY or 'replace' in SECRET_KEY:
            raise ValueError(
                "[CRITICAL SECURITY ERROR] In production, SECRET_KEY must be set in the environment to a secure random value."
            )
        if not JWT_SECRET_KEY or len(JWT_SECRET_KEY) < 32 or 'replace' in JWT_SECRET_KEY:
            raise ValueError(
                "[CRITICAL SECURITY ERROR] In production, JWT_SECRET_KEY must be set in the environment and be at least 32 characters long."
            )
    else:
        # Development fallback keys
        if not SECRET_KEY:
            SECRET_KEY = 'cems-dev-secret-judicial-portal-key-2026'
        if not JWT_SECRET_KEY:
            JWT_SECRET_KEY = 'cems-dev-jwt-signing-secret-key-64bytes-for-local-authentication'

    # Database settings
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'cems_db')
    
    # Uploads
    UPLOAD_FOLDER = BASE_DIR / os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 100 * 1024 * 1024)) # 100 MB
    
    # Strict whitelist of allowed evidentiary file extensions
    ALLOWED_EXTENSIONS = {
        'pdf', 'doc', 'docx', 'txt', 'rtf',
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp',
        'mp4', 'avi', 'mov', 'mkv', 'wmv',
        'mp3', 'wav', 'aac', 'ogg',
        'zip', 'rar', '7z', 'tar', 'gz',
        'bin', 'dd', 'raw', 'pcap', 'pcapng', 'mbox', 'csv', 'json'
    }
    
    # CORS Configuration
    raw_cors = os.getenv('CORS_ORIGINS', '').strip()
    if raw_cors:
        if raw_cors == '*' and not IS_PRODUCTION:
            CORS_ORIGINS = '*'
        else:
            CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(',') if origin.strip()]
    else:
        # Default development origins
        CORS_ORIGINS = [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3000',
            'http://127.0.0.1:8080',
            'http://localhost:8080'
        ]

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
