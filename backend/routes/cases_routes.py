"""
Case Management Routes Blueprint (/api/cases)
"""

from flask import Blueprint, request, g
from datetime import datetime
from database.db import query_db, execute_db
from models.case import CaseModel
from services.audit_service import AuditService
from utils.auth_middleware import token_optional
from utils.response import success_response, error_response

cases_bp = Blueprint("cases", __name__, url_prefix="/api/cases")

@cases_bp.route("", methods=["GET"])
def get_cases():
    """List cases with support for search and multi-field filters."""
    search = request.args.get("search", "").strip().lower()
    case_type = request.args.get("caseType", "").strip()
    status = request.args.get("status", "").strip()
    priority = request.args.get("priority", "").strip()

    sql = "SELECT * FROM `cases` WHERE 1=1"
    params = []

    if search:
        sql += """ AND (
            LOWER(`case_id`) LIKE %s OR 
            LOWER(`case_number`) LIKE %s OR 
            LOWER(`case_title`) LIKE %s OR 
            LOWER(`court_name`) LIKE %s OR 
            LOWER(`judge_name`) LIKE %s OR 
            LOWER(`petitioner`) LIKE %s OR 
            LOWER(`respondent`) LIKE %s
        )"""
        like_term = f"%{search}%"
        params.extend([like_term] * 7)

    if case_type and case_type != "All":
        sql += " AND `case_type` = %s"
        params.append(case_type)

    if status and status != "All":
        sql += " AND `status` = %s"
        params.append(status)

    if priority and priority != "All":
        sql += " AND `priority` = %s"
        params.append(priority)

    sql += " ORDER BY `id` DESC"

    rows = query_db(sql, tuple(params))
    cases = [CaseModel.to_dict(r) for r in rows]
    return success_response(cases)

@cases_bp.route("/<case_id>", methods=["GET"])
def get_case(case_id):
    """Get single case details by caseId."""
    row = query_db("SELECT * FROM `cases` WHERE `case_id` = %s OR `id` = %s;", (case_id, case_id), one=True)
    if not row:
        return error_response(f"Case '{case_id}' not found.", 404)
    return success_response(CaseModel.to_dict(row))

@cases_bp.route("", methods=["POST"])
@token_optional
def create_case():
    """Create a new case record."""
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data or not data.get("caseTitle"):
        return error_response("Case title is required.", 400)

    # Generate sequential caseId if not provided
    case_id = data.get("caseId")
    if not case_id:
        count_row = query_db("SELECT COUNT(*) as cnt FROM `cases`;", one=True)
        count = (count_row["cnt"] if count_row else 0) + 1
        year = datetime.now().year
        case_id = f"CEMS-{year}-{str(count).zfill(3)}"

    case_number = data.get("caseNumber") or f"CRIM-{int(datetime.now().timestamp()) % 10000}/{datetime.now().year}"
    filing_date = data.get("filingDate") or datetime.now().strftime("%Y-%m-%d")

    sql = """
        INSERT INTO `cases` (
            `case_id`, `case_number`, `case_title`, `case_type`, `court_name`, `court_location`,
            `judge_name`, `presiding_officer`, `investigating_officer`, `petitioner`, `respondent`,
            `advocate`, `priority`, `status`, `filing_date`, `next_hearing_date`, `description`
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    execute_db(sql, (
        case_id,
        case_number,
        data.get("caseTitle"),
        data.get("caseType", "Criminal"),
        data.get("courtName", "District & Sessions Court"),
        data.get("courtLocation", ""),
        data.get("judgeName", ""),
        data.get("presidingOfficer", ""),
        data.get("investigatingOfficer", ""),
        data.get("petitioner", ""),
        data.get("respondent", ""),
        data.get("advocate", ""),
        data.get("priority", "Medium"),
        data.get("status", "Active"),
        filing_date,
        data.get("nextHearingDate"),
        data.get("description", "")
    ))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Officer"
    AuditService.log(
        action="Case Created",
        module="Case Management",
        reference_id=case_id,
        status="Success",
        details=f"New legal case \"{data.get('caseTitle')}\" registered.",
        user=user_name
    )

    created = query_db("SELECT * FROM `cases` WHERE `case_id` = %s;", (case_id,), one=True)
    return success_response(CaseModel.to_dict(created), message="Case created successfully.", status_code=201)

@cases_bp.route("/<case_id>", methods=["PUT"])
@token_optional
def update_case(case_id):
    """Update existing case."""
    row = query_db("SELECT * FROM `cases` WHERE `case_id` = %s OR `id` = %s;", (case_id, case_id), one=True)
    if not row:
        return error_response(f"Case '{case_id}' not found.", 404)

    data = request.get_json(silent=True) or request.form.to_dict()
    cid = row["case_id"]

    sql = """
        UPDATE `cases` SET
            `case_number` = COALESCE(%s, `case_number`),
            `case_title` = COALESCE(%s, `case_title`),
            `case_type` = COALESCE(%s, `case_type`),
            `court_name` = COALESCE(%s, `court_name`),
            `court_location` = COALESCE(%s, `court_location`),
            `judge_name` = COALESCE(%s, `judge_name`),
            `presiding_officer` = COALESCE(%s, `presiding_officer`),
            `investigating_officer` = COALESCE(%s, `investigating_officer`),
            `petitioner` = COALESCE(%s, `petitioner`),
            `respondent` = COALESCE(%s, `respondent`),
            `advocate` = COALESCE(%s, `advocate`),
            `priority` = COALESCE(%s, `priority`),
            `status` = COALESCE(%s, `status`),
            `filing_date` = COALESCE(%s, `filing_date`),
            `next_hearing_date` = COALESCE(%s, `next_hearing_date`),
            `description` = COALESCE(%s, `description`)
        WHERE `case_id` = %s
    """
    execute_db(sql, (
        data.get("caseNumber"),
        data.get("caseTitle"),
        data.get("caseType"),
        data.get("courtName"),
        data.get("courtLocation"),
        data.get("judgeName"),
        data.get("presidingOfficer"),
        data.get("investigatingOfficer"),
        data.get("petitioner"),
        data.get("respondent"),
        data.get("advocate"),
        data.get("priority"),
        data.get("status"),
        data.get("filingDate"),
        data.get("nextHearingDate"),
        data.get("description"),
        cid
    ))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Officer"
    AuditService.log(
        action="Case Updated",
        module="Case Management",
        reference_id=cid,
        status="Success",
        details=f"Case record {cid} modified.",
        user=user_name
    )

    updated = query_db("SELECT * FROM `cases` WHERE `case_id` = %s;", (cid,), one=True)
    return success_response(CaseModel.to_dict(updated), message="Case updated successfully.")

@cases_bp.route("/<case_id>", methods=["DELETE"])
@token_optional
def delete_case(case_id):
    """Delete a case."""
    row = query_db("SELECT * FROM `cases` WHERE `case_id` = %s OR `id` = %s;", (case_id, case_id), one=True)
    if not row:
        return error_response(f"Case '{case_id}' not found.", 404)

    cid = row["case_id"]
    execute_db("DELETE FROM `cases` WHERE `case_id` = %s;", (cid,))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Officer"
    AuditService.log(
        action="Case Deleted",
        module="Case Management",
        reference_id=cid,
        status="Warning",
        details=f"Case {cid} removed.",
        user=user_name
    )

    return success_response({"id": cid, "caseId": cid}, message=f"Case {cid} deleted successfully.")
