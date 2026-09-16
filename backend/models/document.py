"""
Document model & serialization helper
"""

class DocumentModel:
    @staticmethod
    def to_dict(row):
        if not row:
            return None
        return {
            "id": row.get("document_id"),
            "documentId": row.get("document_id"),
            "caseId": row.get("case_id"),
            "documentName": row.get("document_name"),
            "documentType": row.get("document_type"),
            "uploadedBy": row.get("uploaded_by"),
            "date": row.get("upload_date"),
            "uploadDate": row.get("upload_date"),
            "version": row.get("version", "v1.0"),
            "status": row.get("status", "Verified"),
            "fileSize": row.get("file_size"),
            "filePath": row.get("file_path"),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None
        }

    @staticmethod
    def to_db(data):
        return {
            "document_id": data.get("documentId") or data.get("id"),
            "case_id": data.get("caseId"),
            "document_name": data.get("documentName"),
            "document_type": data.get("documentType"),
            "uploaded_by": data.get("uploadedBy"),
            "upload_date": data.get("date") or data.get("uploadDate"),
            "version": data.get("version", "v1.0"),
            "status": data.get("status", "Verified"),
            "file_size": data.get("fileSize"),
            "file_path": data.get("filePath")
        }
