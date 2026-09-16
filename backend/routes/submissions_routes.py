"""
Court Evidence Submissions Routes Blueprint (/api/submissions)
"""

from flask import Blueprint, request, g
from datetime import datetime
from database.db import query_db, execute_db
from models.submission import SubmissionModel
from services.custody_service import CustodyService
from services.audit_service import AuditService
from utils.auth_middleware import token_optional
from utils.response import success_response, error_response

submissions_bp = Blueprint("submissions", __name__, url_prefix="/api/submissions")

@submissions_bp.route("", methods=["GET"])
def get_submissions():
    """List court submissions with optional caseId or status filter."""
    case_id = request.args.get("caseId", "").strip()
    status = request.args.get("status", "").strip()

    sql = "SELECT * FROM `court_submissions` WHERE 1=1"
    params = []
    if case_id and case_id != "All":
        sql += " AND `case_id` = %s"
        params.append(case_id)
    if status and status != "All":
        sql += " AND `status` = %s"
        params.append(status)

    sql += " ORDER BY `id` DESC"

    rows = query_db(sql, tuple(params))
    items = [SubmissionModel.to_dict(r) for r in rows]
    return success_response(items)

@submissions_bp.route("/<sub_id>", methods=["GET"])
def get_submission(sub_id):
    """Get single submission."""
    row = query_db("SELECT * FROM `court_submissions` WHERE `submission_id` = %s OR `id` = %s;", (sub_id, sub_id), one=True)
    if not row:
        return error_response(f"Submission '{sub_id}' not found.", 404)
    return success_response(SubmissionModel.to_dict(row))

@submissions_bp.route("", methods=["POST"])
@token_optional
def create_submission():
    """Formally submit evidence to court and sync custody."""
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data or not data.get("evidenceId") or not data.get("caseId"):
        return error_response("Evidence ID and Case ID are required.", 400)

    count_row = query_db("SELECT COUNT(*) as cnt FROM `court_submissions`;", one=True)
    count = (count_row["cnt"] if count_row else 0) + 1
    sub_id = data.get("submissionId") or f"SUB-{datetime.now().year}-{str(count).zfill(3)}"

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else (data.get("submittedBy") or "Court Officer")
    court_name = data.get("court") or "Metropolitan Financial Crimes Court"
    sub_ref = data.get("submissionReference") or f"CR-{int(datetime.now().timestamp()) % 10000}/{datetime.now().year}"

    sql = """
        INSERT INTO `court_submissions` (
            `submission_id`, `evidence_id`, `case_id`, `court`, `submission_date`,
            `submitted_by`, `submission_reference`, `submission_type`, `status`, `notes`
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    execute_db(sql, (
        sub_id,
        data.get("evidenceId"),
        data.get("caseId"),
        court_name,
        data.get("submissionDate") or datetime.now().strftime("%Y-%m-%d"),
        user_name,
        sub_ref,
        data.get("submissionType", "Prosecution Exhibit"),
        data.get("status", "Submitted"),
        data.get("notes", "")
    ))

    # Update evidence court status to Submitted
    execute_db(
        "UPDATE `evidence` SET `court_status` = 'Submitted' WHERE `evidence_id` = %s;",
        (data.get("evidenceId"),)
    )

    # Automatically add a Chain of Custody event
    CustodyService.create_custody_record(
        evidence_id=data.get("evidenceId"),
        officer=user_name,
        action="Evidence Submitted to Court",
        from_location="Central Evidence Vault",
        to_location=f"{court_name} Record Room",
        reason=f"Formal court submission under ref {sub_ref}",
        notes=data.get("notes", "")
    )

    AuditService.log(
        action="Court Submission",
        module="Court Submission Gateway",
        reference_id=sub_id,
        status="Success",
        details=f"Evidence {data.get('evidenceId')} submitted under ref {sub_ref}.",
        user=user_name
    )

    created = query_db("SELECT * FROM `court_submissions` WHERE `submission_id` = %s;", (sub_id,), one=True)
    return success_response(SubmissionModel.to_dict(created), message="Evidence submitted to court.", status_code=201)

@submissions_bp.route("/<sub_id>", methods=["PUT"])
@token_optional
def update_submission(sub_id):
    """Update court submission admission status (e.g. Accepted, Rejected)."""
    row = query_db("SELECT * FROM `court_submissions` WHERE `submission_id` = %s OR `id` = %s;", (sub_id, sub_id), one=True)
    if not row:
        return error_response(f"Submission '{sub_id}' not found.", 404)

    sid = row["submission_id"]
    evidence_id = row["evidence_id"]
    data = request.get_json(silent=True) or request.form.to_dict()
    new_status = data.get("status", row["status"])
    notes = data.get("notes", row.get("notes", ""))

    execute_db(
        "UPDATE `court_submissions` SET `status` = %s, `notes` = %s WHERE `submission_id` = %s;",
        (new_status, notes, sid)
    )

    # Sync evidence court status
    if new_status == "Accepted":
        execute_db("UPDATE `evidence` SET `court_status` = 'Admitted' WHERE `evidence_id` = %s;", (evidence_id,))
        CustodyService.create_custody_record(
            evidence_id=evidence_id,
            officer=g.current_user.get("name") if getattr(g, "current_user", None) else "Judicial Bench",
            action="Evidence Admitted",
            from_location=f"{row.get('court')} Bench",
            to_location="Judicial Evidence Strongroom",
            reason="Admitted into trial record as exhibit",
            notes=notes
        )
    elif new_status == "Rejected":
        execute_db("UPDATE `evidence` SET `court_status` = 'Rejected' WHERE `evidence_id` = %s;", (evidence_id,))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Judicial Officer"
    AuditService.log(
        action="Submission Status Updated",
        module="Court Submission Gateway",
        reference_id=sid,
        status="Success" if new_status == "Accepted" else "Warning",
        details=f"Submission {sid} status set to '{new_status}'.",
        user=user_name
    )

    updated = query_db("SELECT * FROM `court_submissions` WHERE `submission_id` = %s;", (sid,), one=True)
    return success_response(SubmissionModel.to_dict(updated), message=f"Submission status updated to {new_status}.")

@submissions_bp.route("/<sub_id>", methods=["DELETE"])
@token_optional
def delete_submission(sub_id):
    """Delete a court submission."""
    row = query_db("SELECT * FROM `court_submissions` WHERE `submission_id` = %s OR `id` = %s;", (sub_id, sub_id), one=True)
    if not row:
        return error_response(f"Submission '{sub_id}' not found.", 404)
    sid = row["submission_id"]
    execute_db("DELETE FROM `court_submissions` WHERE `submission_id` = %s;", (sid,))
    return success_response(None, message="Submission deleted successfully.")

