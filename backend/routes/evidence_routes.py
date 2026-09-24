"""
Evidence Management & Verification Routes Blueprint (/api/evidence)
"""

from flask import Blueprint, request, g, send_from_directory
from database.db import query_db, execute_db
from models.evidence import EvidenceModel
from services.evidence_service import EvidenceService
from services.hash_service import HashService
from services.audit_service import AuditService
from utils.auth_middleware import token_optional
from utils.file_upload import save_uploaded_file
from utils.response import success_response, error_response
from config import Config

evidence_bp = Blueprint("evidence", __name__, url_prefix="/api/evidence")

@evidence_bp.route("", methods=["GET"])
def get_evidence():
    """List evidence with multi-field search and filters."""
    search = request.args.get("search", "").strip().lower()
    case_id = request.args.get("caseId", "").strip()
    evidence_type = request.args.get("evidenceType", "").strip()
    court_status = request.args.get("courtStatus", "").strip()
    verification_status = request.args.get("verificationStatus", "").strip()

    sql = "SELECT * FROM `evidence` WHERE 1=1"
    params = []

    if search:
        sql += """ AND (
            LOWER(`evidence_id`) LIKE %s OR 
            LOWER(`case_id`) LIKE %s OR 
            LOWER(`evidence_name`) LIKE %s OR 
            LOWER(`file_name`) LIKE %s OR 
            LOWER(`collected_by`) LIKE %s OR 
            LOWER(`hash_value`) LIKE %s
        )"""
        like_term = f"%{search}%"
        params.extend([like_term] * 6)

    if case_id and case_id != "All":
        sql += " AND `case_id` = %s"
        params.append(case_id)

    if evidence_type and evidence_type != "All":
        sql += " AND `evidence_type` = %s"
        params.append(evidence_type)

    if court_status and court_status != "All":
        sql += " AND `court_status` = %s"
        params.append(court_status)

    if verification_status and verification_status != "All":
        sql += " AND `verification_status` = %s"
        params.append(verification_status)

    sql += " ORDER BY `id` DESC"

    rows = query_db(sql, tuple(params))
    items = [EvidenceModel.to_dict(r) for r in rows]
    return success_response(items)

@evidence_bp.route("/<evidence_id>", methods=["GET"])
def get_single_evidence(evidence_id):
    """Get single evidence details by evidenceId."""
    row = query_db("SELECT * FROM `evidence` WHERE `evidence_id` = %s OR `id` = %s;", (evidence_id, evidence_id), one=True)
    if not row:
        return error_response(f"Evidence '{evidence_id}' not found.", 404)
    return success_response(EvidenceModel.to_dict(row))

@evidence_bp.route("/<evidence_id>/file", methods=["GET"])
def get_evidence_file(evidence_id):
    """Serve or stream uploaded evidence binary or media file."""
    row = query_db("SELECT * FROM `evidence` WHERE `evidence_id` = %s OR `id` = %s;", (evidence_id, evidence_id), one=True)
    if not row or not row.get("file_path"):
        return error_response(f"File for evidence '{evidence_id}' not found.", 404)

    file_path = row["file_path"].replace("\\", "/")
    parts = file_path.split("/")
    filename = parts[-1]
    subfolder = parts[-2] if len(parts) > 1 else "evidence"

    target_dir = Config.UPLOAD_FOLDER / subfolder
    file_on_disk = target_dir / filename
    if not file_on_disk.exists():
        if (Config.UPLOAD_FOLDER / filename).exists():
            return send_from_directory(str(Config.UPLOAD_FOLDER), filename, as_attachment=False)
        return error_response("Evidentiary asset missing from storage vault.", 404)

    return send_from_directory(str(target_dir), filename, as_attachment=False)

@evidence_bp.route("", methods=["POST"])
@token_optional
def create_evidence():
    """
    Create evidence record.
    Supports JSON body or multipart/form-data with actual file upload.
    If file is uploaded, server calculates SHA-256 and saves file securely.
    """
    # Extract data from multipart form or JSON
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    file_obj = request.files.get("file")

    file_info = None
    if file_obj and file_obj.filename:
        try:
            file_info = save_uploaded_file(file_obj, subfolder="evidence")
        except Exception as e:
            return error_response(f"File upload error: {str(e)}", 400)

    if not data.get("caseId"):
        return error_response("Case ID is required.", 400)
    if not data.get("evidenceName"):
        return error_response("Evidence name is required.", 400)

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else (data.get("collectedBy") or "Evidence Intake Officer")

    try:
        created = EvidenceService.create_evidence(data, file_info=file_info, current_user=user_name)
        return success_response(created, message="Evidence registered successfully.", status_code=201)
    except Exception as e:
        return error_response(f"Failed to create evidence: {str(e)}", 500)

@evidence_bp.route("/<evidence_id>", methods=["PUT"])
@token_optional
def update_evidence(evidence_id):
    """Update evidence metadata."""
    row = query_db("SELECT * FROM `evidence` WHERE `evidence_id` = %s OR `id` = %s;", (evidence_id, evidence_id), one=True)
    if not row:
        return error_response(f"Evidence '{evidence_id}' not found.", 404)

    eid = row["evidence_id"]
    data = request.get_json(silent=True) or request.form.to_dict()

    sql = """
        UPDATE `evidence` SET
            `case_id` = COALESCE(%s, `case_id`),
            `evidence_name` = COALESCE(%s, `evidence_name`),
            `evidence_type` = COALESCE(%s, `evidence_type`),
            `description` = COALESCE(%s, `description`),
            `collected_by` = COALESCE(%s, `collected_by`),
            `court_status` = COALESCE(%s, `court_status`),
            `verification_status` = COALESCE(%s, `verification_status`),
            `notes` = COALESCE(%s, `notes`)
        WHERE `evidence_id` = %s
    """
    execute_db(sql, (
        data.get("caseId"),
        data.get("evidenceName"),
        data.get("evidenceType"),
        data.get("description"),
        data.get("collectedBy"),
        data.get("courtStatus"),
        data.get("verificationStatus"),
        data.get("notes"),
        eid
    ))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Officer"
    AuditService.log(
        action="Evidence Updated",
        module="Evidence Registry",
        reference_id=eid,
        status="Success",
        details=f"Evidence record {eid} modified.",
        user=user_name
    )

    updated = query_db("SELECT * FROM `evidence` WHERE `evidence_id` = %s;", (eid,), one=True)
    return success_response(EvidenceModel.to_dict(updated), message="Evidence updated successfully.")

@evidence_bp.route("/<evidence_id>", methods=["DELETE"])
@token_optional
def delete_evidence(evidence_id):
    """Delete evidence and cascaded records."""
    row = query_db("SELECT * FROM `evidence` WHERE `evidence_id` = %s OR `id` = %s;", (evidence_id, evidence_id), one=True)
    if not row:
        return error_response(f"Evidence '{evidence_id}' not found.", 404)

    eid = row["evidence_id"]
    execute_db("DELETE FROM `evidence` WHERE `evidence_id` = %s;", (eid,))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Officer"
    AuditService.log(
        action="Evidence Deleted",
        module="Evidence Registry",
        reference_id=eid,
        status="Warning",
        details=f"Evidence {eid} removed.",
        user=user_name
    )

    return success_response({"id": eid, "evidenceId": eid}, message=f"Evidence {eid} deleted.")

@evidence_bp.route("/<evidence_id>/verify", methods=["POST"])
@token_optional
def verify_evidence(evidence_id):
    """
    Cryptographically verify evidence hash.
    Accepts:
    1. A file uploaded in request.files['file'] -> server computes SHA-256
    2. JSON payload with 'testHash' or 'hashValue'
    """
    test_hash = None
    file_obj = request.files.get("file")

    if file_obj and file_obj.filename:
        # Calculate real SHA-256 from uploaded file bytes
        file_bytes = file_obj.read()
        test_hash = HashService.compute_sha256_from_bytes(file_bytes)
    else:
        data = request.get_json(silent=True) or request.form.to_dict() or {}
        test_hash = data.get("testHash") or data.get("hashValue") or data.get("hash")

    if not test_hash:
        return error_response("A test file or SHA-256 hash string is required for verification.", 400)

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Auditor"
    result, err = EvidenceService.verify_evidence_hash(evidence_id, test_hash, current_user=user_name)

    if err:
        return error_response(err, 404)

    return success_response(result, message="Verification audit completed.")
