"""
Audit Activity Logs Routes Blueprint (/api/activity)
"""

from flask import Blueprint, request, g
from database.db import query_db
from models.activity import ActivityModel
from services.audit_service import AuditService
from utils.auth_middleware import token_optional
from utils.response import success_response, error_response

activity_bp = Blueprint("activity", __name__, url_prefix="/api/activity")

@activity_bp.route("", methods=["GET"])
def get_activity_logs():
    """List immutable activity audit logs with optional filters."""
    module = request.args.get("module", "").strip()
    user = request.args.get("user", "").strip()
    limit = int(request.args.get("limit", 100))

    sql = "SELECT * FROM `activity_logs` WHERE 1=1"
    params = []
    if module and module != "All":
        sql += " AND `module` = %s"
        params.append(module)
    if user and user != "All":
        sql += " AND `user` = %s"
        params.append(user)

    sql += " ORDER BY `id` DESC LIMIT %s"
    params.append(limit)

    rows = query_db(sql, tuple(params))
    items = [ActivityModel.to_dict(r) for r in rows]
    return success_response(items)

@activity_bp.route("", methods=["POST"])
@token_optional
def create_activity_log():
    """Log an activity event manually."""
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data or not data.get("action"):
        return error_response("Action description is required.", 400)

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else (data.get("user") or "System")
    act_id = AuditService.log(
        action=data.get("action"),
        module=data.get("module", "System"),
        reference_id=data.get("referenceId"),
        status=data.get("status", "Success"),
        details=data.get("details", ""),
        user=user_name
    )

    created = query_db("SELECT * FROM `activity_logs` WHERE `activity_id` = %s;", (act_id,), one=True)
    return success_response(ActivityModel.to_dict(created), message="Activity logged successfully.", status_code=201)
