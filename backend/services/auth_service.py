"""
Authentication & JWT Token Service
"""

import datetime
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

class AuthService:
    @staticmethod
    def hash_password(plain_password):
        """Hashes a password with secure default algorithm."""
        return generate_password_hash(plain_password)

    @staticmethod
    def verify_password(plain_password, password_hash):
        """Verifies a plain-text password against stored hash."""
        if not plain_password or not password_hash:
            return False
        return check_password_hash(password_hash, plain_password)

    @staticmethod
    def generate_token(user):
        """
        Generates a signed JWT access token for a user.
        Payload includes user_id, email, role, and expiration.
        """
        payload = {
            "sub": user.get("user_id"),
            "userId": user.get("user_id"),
            "email": user.get("email"),
            "name": user.get("name"),
            "role": user.get("role"),
            "department": user.get("department"),
            "iat": datetime.datetime.utcnow(),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS)
        }
        return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")

    @staticmethod
    def decode_token(token):
        """
        Decodes and validates a JWT token.
        Returns payload dict on success, raises error on invalid/expired token.
        """
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
