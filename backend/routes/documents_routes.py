"""
Case Documents Repository Routes Blueprint (/api/documents)
"""

import os
from flask import Blueprint, request, g, send_file
from datetime import datetime
from database.db import query_db, execute_db
from models.document import DocumentModel
from services.audit_service import AuditService
from utils.auth_middleware import token_optional
from utils.file_upload import save_uploaded_file
from utils.response import success_response, error_response
from config import Config

documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")

@documents_bp.route("", methods=["GET"])
def get_documents():
    """List case documents with optional caseId filter."""
    case_id = request.args.get("caseId", "").strip()

    sql = "SELECT * FROM `documents` WHERE 1=1"
    params = []
    if case_id and case_id != "All":
        sql += " AND `case_id` = %s"
        params.append(case_id)

    sql += " ORDER BY `id` DESC"

    rows = query_db(sql, tuple(params))
    items = [DocumentModel.to_dict(r) for r in rows]
    return success_response(items)

@documents_bp.route("/<doc_id>", methods=["GET"])
def get_document(doc_id):
    """Get single document metadata."""
    row = query_db("SELECT * FROM `documents` WHERE `document_id` = %s OR `id` = %s;", (doc_id, doc_id), one=True)
    if not row:
        return error_response(f"Document '{doc_id}' not found.", 404)
    return success_response(DocumentModel.to_dict(row))

@documents_bp.route("", methods=["POST"])
@token_optional
def create_document():
    """
    Upload and register a legal case document.
    Supports file attachment or metadata registration.
    """
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    file_obj = request.files.get("file")

    file_path = None
    file_size = data.get("fileSize", "1.5 MB")

    if file_obj and file_obj.filename:
        try:
            info = save_uploaded_file(file_obj, subfolder="documents")
            file_path = info["filePath"]
            file_size = info["fileSize"]
        except Exception as e:
            return error_response(f"File upload error: {str(e)}", 400)

    if not data.get("caseId"):
        return error_response("Case ID is required.", 400)
    if not data.get("documentName"):
        return error_response("Document name is required.", 400)

    count_row = query_db("SELECT COUNT(*) as cnt FROM `documents`;", one=True)
    count = (count_row["cnt"] if count_row else 0) + 101
    doc_id = data.get("documentId") or f"DOC-{count}"

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else (data.get("uploadedBy") or "Court Officer")

    sql = """
        INSERT INTO `documents` (
            `document_id`, `case_id`, `document_name`, `document_type`,
            `uploaded_by`, `upload_date`, `version`, `status`, `file_size`, `file_path`
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    execute_db(sql, (
        doc_id,
        data.get("caseId"),
        data.get("documentName"),
        data.get("documentType", "Court Orders"),
        user_name,
        data.get("date") or datetime.now().strftime("%Y-%m-%d"),
        data.get("version", "v1.0"),
        data.get("status", "Verified"),
        file_size,
        file_path
    ))

    AuditService.log(
        action="Document Added",
        module="Document Repository",
        reference_id=doc_id,
        status="Success",
        details=f"Uploaded {data.get('documentType')}: \"{data.get('documentName')}\" for Case {data.get('caseId')}.",
        user=user_name
    )

    created = query_db("SELECT * FROM `documents` WHERE `document_id` = %s;", (doc_id,), one=True)
    return success_response(DocumentModel.to_dict(created), message="Document registered successfully.", status_code=201)

@documents_bp.route("/<doc_id>/download", methods=["GET"])
def download_document(doc_id):
    """Download the actual uploaded document file if available."""
    row = query_db("SELECT * FROM `documents` WHERE `document_id` = %s OR `id` = %s;", (doc_id, doc_id), one=True)
    if not row or not row.get("file_path"):
        return error_response("Document file is not stored on server (demo archive record).", 404)

    full_path = Config.UPLOAD_FOLDER.parent / row["file_path"]
    if not os.path.exists(full_path):
        return error_response("File not found on storage disk.", 404)

    return send_file(full_path, as_attachment=True, download_name=row.get("document_name"))

@documents_bp.route("/<doc_id>", methods=["DELETE"])
@token_optional
def delete_document(doc_id):
    """Delete a document."""
    row = query_db("SELECT * FROM `documents` WHERE `document_id` = %s OR `id` = %s;", (doc_id, doc_id), one=True)
    if not row:
        return error_response(f"Document '{doc_id}' not found.", 404)

    did = row["document_id"]
    execute_db("DELETE FROM `documents` WHERE `document_id` = %s;", (did,))

    user_name = g.current_user.get("name") if getattr(g, "current_user", None) else "Court Officer"
    AuditService.log(
        action="Document Removed",
        module="Document Repository",
        reference_id=did,
        status="Warning",
        details=f"Document {did} deleted.",
        user=user_name
    )

    return success_response({"id": did, "documentId": did}, message=f"Document {did} deleted.")
