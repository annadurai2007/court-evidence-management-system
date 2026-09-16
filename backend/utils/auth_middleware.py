"""
Authentication & Authorization Middleware Decorators
"""

from functools import wraps
from flask import request, g
import jwt
from services.auth_service import AuthService
from database.db import query_db
from models.user import UserModel
from utils.response import error_response

def get_token_from_request():
    """Extracts Bearer token from headers."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return request.headers.get("x-access-token", "").strip() or None

def token_required(f):
    """
    Decorator requiring a valid JWT token.
    Populates Flask's g.current_user.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return error_response("Authentication token is missing. Please log in.", 401)

        try:
            payload = AuthService.decode_token(token)
            user_id = payload.get("sub") or payload.get("userId")
            # Fetch fresh user data from DB
            user_row = query_db("SELECT * FROM `users` WHERE `user_id` = %s;", (user_id,), one=True)
            if not user_row:
                return error_response("User session is invalid or user no longer exists.", 401)

            g.current_user = UserModel.to_dict(user_row)
        except jwt.ExpiredSignatureError:
            return error_response("Authentication token has expired. Please log in again.", 401)
        except jwt.InvalidTokenError as e:
            return error_response(f"Invalid authentication token: {str(e)}", 401)

        return f(*args, **kwargs)
    return decorated

def token_optional(f):
    """
    Optional token decorator: populates g.current_user if token is valid,
    but proceeds without error if not present (useful for hybrid/demo mode).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        g.current_user = None
        if token:
            try:
                payload = AuthService.decode_token(token)
                user_id = payload.get("sub") or payload.get("userId")
                user_row = query_db("SELECT * FROM `users` WHERE `user_id` = %s;", (user_id,), one=True)
                if user_row:
                    g.current_user = UserModel.to_dict(user_row)
            except Exception:
                pass
        return f(*args, **kwargs)
    return decorated

def role_required(allowed_roles):
    """
    Decorator requiring user to have one of the specified roles.
    Must be placed after @token_required.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'current_user') or not g.current_user:
                return error_response("Authentication required.", 401)

            user_role = g.current_user.get("role")
            if user_role not in allowed_roles:
                return error_response(
                    f"Access forbidden: requires one of {allowed_roles}, your role is '{user_role}'.",
                    403
                )
            return f(*args, **kwargs)
        return decorated_function
    return decorator
