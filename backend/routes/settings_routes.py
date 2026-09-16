"""
System Settings & Reset Routes Blueprint (/api/settings)
"""

from flask import Blueprint, request
from pathlib import Path
from database.db import query_db, execute_db
from models.setting import SettingModel
from services.audit_service import AuditService
from utils.response import success_response, error_response

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

@settings_bp.route("", methods=["GET"])
def get_settings():
    """Get system preferences and configuration."""
    rows = query_db("SELECT * FROM `settings`;")
    settings_obj = SettingModel.rows_to_dict(rows)
    return success_response(settings_obj)

@settings_bp.route("", methods=["PUT"])
def update_settings():
    """Update system preferences."""
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data:
        return error_response("No settings data provided.", 400)

    rows = SettingModel.dict_to_rows(data)
    for key, val in rows:
        execute_db(
            """
            INSERT INTO `settings` (`setting_key`, `setting_value`)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
            """,
            (key, val)
        )

    AuditService.log(
        action="Settings Updated",
        module="System Settings",
        status="Success",
        details="System preferences modified by user.",
        user="Administrator"
    )

    updated_rows = query_db("SELECT * FROM `settings`;")
    return success_response(SettingModel.rows_to_dict(updated_rows), message="Settings saved successfully.")

@settings_bp.route("/reset", methods=["POST"])
def reset_database():
    """Re-seed the entire database back to factory demo state."""
    try:
        from seed_db import init_database
        init_database()
        AuditService.log(
            action="Database Reset",
            module="System Settings",
            status="Warning",
            details="Database reset to factory demonstration seed data.",
            user="Administrator"
        )
        return success_response(None, message="Database successfully reset to default demo dataset.")
    except Exception as e:
        return error_response(f"Reset failed: {str(e)}", 500)
