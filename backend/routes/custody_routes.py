"""
Chain of Custody Routes Blueprint (/api/custody)
"""

from flask import Blueprint, request, g
from database.db import query_db, execute_db
from models.custody import CustodyModel
from services.custody_service import CustodyService
from services.audit_service import AuditService
from utils.auth_middleware import token_optional
from utils.response import success_response, error_response

custody_bp = Blueprint("custody", __name__, url_prefix="/api/custody")

@custody_bp.route("", methods=["GET"])
def get_custody_events():
    """List custody timeline events, sorted chronologically."""
    evidence_id = request.args.get("evidenceId", "").strip()

    sql = "SELECT * FROM `custody_records` WHERE 1=1"
    params = []
    if evidence_id and evidence_id != "All":
        sql += " AND `evidence_id` = %s"
        params.append(evidence_id)

    sql += " ORDER BY `event_date` ASC, `event_time` ASC, `id` ASC"

    rows = query_db(sql, tuple(params))
    events = [CustodyModel.to_dict(r) for r in rows]
    return success_response(events)

@custody_bp.route("/<evidence_id>", methods=["GET"])
def get_custody_for_evidence(evidence_id):
    """Get all custody events for a specific evidence item."""
    rows = query_db(
        "SELECT * FROM `custody_records` WHERE `evidence_id` = %s ORDER BY `event_date` ASC, `event_time` ASC, `id` ASC;",
        (evidence_id,)
    )
    events = [CustodyModel.to_dict(r) for r in rows]
    return success_response(events)

@custody_bp.route("", methods=["POST"])
@token_optional
def add_custody_event():
    """Log a new chain of custody transfer event."""
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data or not data.get("evidenceId"):
        return error_response("Evidence ID is required.", 400)
    if not data.get("action"):
        return error_response("Action description is required.", 400)

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else (data.get("officer") or "Vault Custodian")

    try:
        custody_id = CustodyService.create_custody_record(
            evidence_id=data.get("evidenceId"),
            officer=data.get("officer") or user_name,
            action=data.get("action"),
            from_location=data.get("fromLocation") or "Central Vault",
            to_location=data.get("toLocation") or "Court Room",
            reason=data.get("reason") or "Transfer for evidentiary review",
            notes=data.get("notes") or "",
            event_date=data.get("date"),
            event_time=data.get("time")
        )

        AuditService.log(
            action="Custody Event Added",
            module="Chain of Custody",
            reference_id=data.get("evidenceId"),
            status="Success",
            details=f"Transfer action \"{data.get('action')}\" recorded for {data.get('evidenceId')}.",
            user=user_name
        )

        created = query_db("SELECT * FROM `custody_records` WHERE `custody_id` = %s;", (custody_id,), one=True)
        return success_response(CustodyModel.to_dict(created), message="Custody event logged successfully.", status_code=201)
    except Exception as e:
        return error_response(f"Failed to log custody event: {str(e)}", 500)

@custody_bp.route("/<evidence_id>/validate", methods=["GET"])
def validate_custody_sequence(evidence_id):
    """Validate chronological custody sequence and detect anomalies/gaps."""
    validation = CustodyService.validate_custody_chain(evidence_id)
    return success_response(validation)
