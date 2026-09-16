"""
Court Hearings Routes Blueprint (/api/hearings)
"""

from flask import Blueprint, request, g
from datetime import datetime
from database.db import query_db, execute_db
from models.hearing import HearingModel
from services.audit_service import AuditService
from utils.auth_middleware import token_optional
from utils.response import success_response, error_response

hearings_bp = Blueprint("hearings", __name__, url_prefix="/api/hearings")

@hearings_bp.route("", methods=["GET"])
def get_hearings():
    """List hearings with case filter."""
    case_id = request.args.get("caseId", "").strip()
    status = request.args.get("status", "").strip()

    sql = "SELECT * FROM `hearings` WHERE 1=1"
    params = []
    if case_id and case_id != "All":
        sql += " AND `case_id` = %s"
        params.append(case_id)
    if status and status != "All":
        sql += " AND `status` = %s"
        params.append(status)

    sql += " ORDER BY `hearing_date` ASC, `hearing_time` ASC"

    rows = query_db(sql, tuple(params))
    items = [HearingModel.to_dict(r) for r in rows]
    return success_response(items)

@hearings_bp.route("/<hearing_id>", methods=["GET"])
def get_hearing(hearing_id):
    """Get single hearing by ID."""
    row = query_db("SELECT * FROM `hearings` WHERE `hearing_id` = %s OR `id` = %s;", (hearing_id, hearing_id), one=True)
    if not row:
        return error_response(f"Hearing '{hearing_id}' not found.", 404)
    return success_response(HearingModel.to_dict(row))

@hearings_bp.route("", methods=["POST"])
@token_optional
def create_hearing():
    """Schedule a new court hearing."""
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data or not data.get("caseId"):
        return error_response("Case ID is required.", 400)

    # Next ID
    count_row = query_db("SELECT COUNT(*) as cnt FROM `hearings`;", one=True)
    count = (count_row["cnt"] if count_row else 0) + 1
    hearing_id = data.get("hearingId") or f"HRG-{datetime.now().year}-{str(count).zfill(2)}"

    sql = """
        INSERT INTO `hearings` (
            `hearing_id`, `case_id`, `court`, `judge`, `hearing_date`,
            `hearing_time`, `hearing_type`, `purpose`, `status`
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    execute_db(sql, (
        hearing_id,
        data.get("caseId"),
        data.get("court", "Metropolitan Court"),
        data.get("judge", "Hon. Magistrate"),
        data.get("hearingDate", datetime.now().strftime("%Y-%m-%d")),
        data.get("hearingTime", "10:00 AM"),
        data.get("hearingType", "Evidence Hearing"),
        data.get("purpose", "Evidentiary hearing and proceedings"),
        data.get("status", "Scheduled")
    ))

    # Also update case nextHearingDate if applicable
    if data.get("hearingDate"):
        execute_db("UPDATE `cases` SET `next_hearing_date` = %s WHERE `case_id` = %s;", (data.get("hearingDate"), data.get("caseId")))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Court Clerk"
    AuditService.log(
        action="Hearing Scheduled",
        module="Hearing Management",
        reference_id=hearing_id,
        status="Success",
        details=f"Hearing scheduled on {data.get('hearingDate')} for Case {data.get('caseId')}.",
        user=user_name
    )

    created = query_db("SELECT * FROM `hearings` WHERE `hearing_id` = %s;", (hearing_id,), one=True)
    return success_response(HearingModel.to_dict(created), message="Hearing scheduled successfully.", status_code=201)

@hearings_bp.route("/<hearing_id>", methods=["PUT"])
@token_optional
def update_hearing(hearing_id):
    """Update hearing status or details."""
    row = query_db("SELECT * FROM `hearings` WHERE `hearing_id` = %s OR `id` = %s;", (hearing_id, hearing_id), one=True)
    if not row:
        return error_response(f"Hearing '{hearing_id}' not found.", 404)

    hid = row["hearing_id"]
    data = request.get_json(silent=True) or request.form.to_dict()

    sql = """
        UPDATE `hearings` SET
            `court` = COALESCE(%s, `court`),
            `judge` = COALESCE(%s, `judge`),
            `hearing_date` = COALESCE(%s, `hearing_date`),
            `hearing_time` = COALESCE(%s, `hearing_time`),
            `hearing_type` = COALESCE(%s, `hearing_type`),
            `purpose` = COALESCE(%s, `purpose`),
            `status` = COALESCE(%s, `status`)
        WHERE `hearing_id` = %s
    """
    execute_db(sql, (
        data.get("court"),
        data.get("judge"),
        data.get("hearingDate"),
        data.get("hearingTime"),
        data.get("hearingType"),
        data.get("purpose"),
        data.get("status"),
        hid
    ))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Court Clerk"
    AuditService.log(
        action="Hearing Updated",
        module="Hearing Management",
        reference_id=hid,
        status="Success",
        details=f"Hearing {hid} updated to status '{data.get('status', row.get('status'))}'.",
        user=user_name
    )

    updated = query_db("SELECT * FROM `hearings` WHERE `hearing_id` = %s;", (hid,), one=True)
    return success_response(HearingModel.to_dict(updated), message="Hearing updated successfully.")

@hearings_bp.route("/<hearing_id>", methods=["DELETE"])
@token_optional
def delete_hearing(hearing_id):
    """Delete a hearing."""
    row = query_db("SELECT * FROM `hearings` WHERE `hearing_id` = %s OR `id` = %s;", (hearing_id, hearing_id), one=True)
    if not row:
        return error_response(f"Hearing '{hearing_id}' not found.", 404)

    hid = row["hearing_id"]
    execute_db("DELETE FROM `hearings` WHERE `hearing_id` = %s;", (hid,))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Court Clerk"
    AuditService.log(
        action="Hearing Cancelled",
        module="Hearing Management",
        reference_id=hid,
        status="Warning",
        details=f"Hearing {hid} removed.",
        user=user_name
    )

    return success_response({"id": hid, "hearingId": hid}, message=f"Hearing {hid} deleted.")
