"""
Court Submission model & serialization helper
"""

class SubmissionModel:
    @staticmethod
    def to_dict(row):
        if not row:
            return None
        return {
            "id": row.get("submission_id"),
            "submissionId": row.get("submission_id"),
            "evidenceId": row.get("evidence_id"),
            "caseId": row.get("case_id"),
            "court": row.get("court"),
            "submissionDate": row.get("submission_date"),
            "submittedBy": row.get("submitted_by"),
            "submissionReference": row.get("submission_reference"),
            "submissionType": row.get("submission_type"),
            "status": row.get("status", "Submitted"),
            "notes": row.get("notes"),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None,
            "updatedAt": str(row.get("updated_at")) if row.get("updated_at") else None
        }

    @staticmethod
    def to_db(data):
        return {
            "submission_id": data.get("submissionId") or data.get("id"),
            "evidence_id": data.get("evidenceId"),
            "case_id": data.get("caseId"),
            "court": data.get("court"),
            "submission_date": data.get("submissionDate"),
            "submitted_by": data.get("submittedBy"),
            "submission_reference": data.get("submissionReference"),
            "submission_type": data.get("submissionType"),
            "status": data.get("status", "Submitted"),
            "notes": data.get("notes")
        }
