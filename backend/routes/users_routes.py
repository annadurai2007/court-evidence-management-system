"""
Staff Directory & User Management Routes Blueprint (/api/users)
"""

from flask import Blueprint, request
from database.db import query_db, execute_db
from models.user import UserModel
from services.auth_service import AuthService
from utils.response import success_response, error_response

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

@users_bp.route("", methods=["GET"])
def get_users():
    """List all registered legal officers and staff members."""
    rows = query_db("SELECT * FROM `users` ORDER BY `id` ASC;")
    items = [UserModel.to_dict(r) for r in rows]
    return success_response(items)

@users_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    """Get single user profile."""
    row = query_db("SELECT * FROM `users` WHERE `user_id` = %s OR `id` = %s;", (user_id, user_id), one=True)
    if not row:
        return error_response(f"User '{user_id}' not found.", 404)
    return success_response(UserModel.to_dict(row))

@users_bp.route("", methods=["POST"])
def create_user():
    """Create a new staff member."""
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data or not data.get("name") or not data.get("email"):
        return error_response("Name and email are required.", 400)

    email = data.get("email").strip()
    existing = query_db("SELECT * FROM `users` WHERE LOWER(`email`) = LOWER(%s);", (email,), one=True)
    if existing:
        return error_response("A user with this email address already exists.", 409)

    count_row = query_db("SELECT COUNT(*) as cnt FROM `users`;", one=True)
    user_id = data.get("userId") or f"USR-{str((count_row['cnt'] if count_row else 0) + 1).zfill(3)}"
    password = data.get("password") or "admin123"
    password_hash = AuthService.hash_password(password)

    sql = """
        INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `role`, `department`, `status`)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    execute_db(sql, (
        user_id,
        data.get("name"),
        email,
        password_hash,
        data.get("role", "Court Officer"),
        data.get("department", "Judicial Division"),
        data.get("status", "Active")
    ))

    created = query_db("SELECT * FROM `users` WHERE `user_id` = %s;", (user_id,), one=True)
    return success_response(UserModel.to_dict(created), message="Staff member added successfully.", status_code=201)

@users_bp.route("/<user_id>", methods=["PUT"])
def update_user(user_id):
    """Update user information."""
    row = query_db("SELECT * FROM `users` WHERE `user_id` = %s OR `id` = %s;", (user_id, user_id), one=True)
    if not row:
        return error_response(f"User '{user_id}' not found.", 404)

    uid = row["user_id"]
    data = request.get_json(silent=True) or request.form.to_dict()

    sql = """
        UPDATE `users` SET
            `name` = COALESCE(%s, `name`),
            `role` = COALESCE(%s, `role`),
            `department` = COALESCE(%s, `department`),
            `status` = COALESCE(%s, `status`)
        WHERE `user_id` = %s
    """
    execute_db(sql, (
        data.get("name"),
        data.get("role"),
        data.get("department"),
        data.get("status"),
        uid
    ))

    updated = query_db("SELECT * FROM `users` WHERE `user_id` = %s;", (uid,), one=True)
    return success_response(UserModel.to_dict(updated), message="User updated successfully.")

@users_bp.route("/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Delete a staff user."""
    row = query_db("SELECT * FROM `users` WHERE `user_id` = %s OR `id` = %s;", (user_id, user_id), one=True)
    if not row:
        return error_response(f"User '{user_id}' not found.", 404)

    uid = row["user_id"]
    execute_db("DELETE FROM `users` WHERE `user_id` = %s;", (uid,))
    return success_response({"id": uid, "userId": uid}, message=f"User {uid} deleted.")
