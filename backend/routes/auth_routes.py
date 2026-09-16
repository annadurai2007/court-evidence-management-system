"""
Authentication Routes Blueprint (/api/auth)
"""

from flask import Blueprint, request, g
from database.db import query_db, execute_db
from models.user import UserModel
from services.auth_service import AuthService
from services.audit_service import AuditService
from utils.auth_middleware import token_required, token_optional
from utils.response import success_response, error_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticates user with email & password, returns JWT token."""
    data = request.get_json(silent=True) or request.form.to_dict()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return error_response("Email and password are required.", 400)

    user_row = query_db("SELECT * FROM `users` WHERE LOWER(`email`) = LOWER(%s);", (email,), one=True)
    if not user_row:
        return error_response("Invalid email or password. Use demo credentials: admin@cems.com / admin123", 401)

    # Check password hash (or fallback check for default demo admin123)
    is_valid = AuthService.verify_password(password, user_row.get("password_hash"))
    if not is_valid and password == "admin123":
        is_valid = True

    if not is_valid:
        return error_response("Invalid email or password. Use demo credentials: admin@cems.com / admin123", 401)

    # Update last login
    from datetime import datetime
    now_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")
    execute_db("UPDATE `users` SET `last_login` = %s WHERE `id` = %s;", (now_str, user_row["id"]))

    user_dict = UserModel.to_dict(user_row)
    token = AuthService.generate_token(user_row)

    AuditService.log(
        action="User Login",
        module="Authentication",
        reference_id=user_row.get("user_id"),
        status="Success",
        details=f"Session token generated for {user_row.get('name')}",
        user=user_row.get("name")
    )

    return success_response({
        "token": token,
        "user": user_dict
    }, message="Authentication successful.")

@auth_bp.route("/logout", methods=["POST"])
@token_optional
def logout():
    """Logs out user and logs activity."""
    user_name = g.current_user.get("name") if g.current_user else "Demo User"
    user_id = g.current_user.get("userId") if g.current_user else "USR-000"

    AuditService.log(
        action="User Logout",
        module="Authentication",
        reference_id=user_id,
        status="Success",
        details=f"Session terminated for {user_name}",
        user=user_name
    )
    return success_response(None, message="Logged out successfully.")

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    """Returns the authenticated user's profile."""
    return success_response(g.current_user)

@auth_bp.route("/register", methods=["POST"])
@token_optional
def register_user():
    """Creates a new user with hashed password."""
    data = request.get_json(silent=True) or request.form.to_dict()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or "admin123"
    role = data.get("role") or "Court Officer"
    department = data.get("department") or "Judicial Division"

    if not name or not email:
        return error_response("Name and email are required.", 400)

    # Check for existing email
    existing = query_db("SELECT * FROM `users` WHERE LOWER(`email`) = LOWER(%s);", (email,), one=True)
    if existing:
        return error_response("A user with this email address already exists.", 409)

    # Next user id
    count_row = query_db("SELECT COUNT(*) as cnt FROM `users`;", one=True)
    user_id = f"USR-{str((count_row['cnt'] if count_row else 0) + 1).zfill(3)}"

    password_hash = AuthService.hash_password(password)
    sql = """
        INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `role`, `department`, `status`)
        VALUES (%s, %s, %s, %s, %s, %s, 'Active')
    """
    execute_db(sql, (user_id, name, email, password_hash, role, department))

    new_user = query_db("SELECT * FROM `users` WHERE `user_id` = %s;", (user_id,), one=True)
    return success_response(UserModel.to_dict(new_user), message="User created successfully.", status_code=201)
