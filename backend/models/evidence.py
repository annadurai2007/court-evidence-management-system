"""
Evidence model & serialization helper
"""

class EvidenceModel:
    @staticmethod
    def to_dict(row):
        if not row:
            return None
        return {
            "id": row.get("evidence_id"),
            "evidenceId": row.get("evidence_id"),
            "caseId": row.get("case_id"),
            "evidenceName": row.get("evidence_name"),
            "evidenceType": row.get("evidence_type"),
            "description": row.get("description"),
            "collectedBy": row.get("collected_by"),
            "collectionDate": row.get("collection_date"),
            "collectionTime": row.get("collection_time"),
            "collectionLocation": row.get("collection_location"),
            "source": row.get("source"),
            "fileName": row.get("file_name"),
            "filePath": row.get("file_path"),
            "fileSize": row.get("file_size"),
            "hashAlgorithm": row.get("hash_algorithm", "SHA-256"),
            "hashValue": row.get("hash_value"),
            "originalHash": row.get("original_hash") or row.get("hash_value"),
            "currentHash": row.get("current_hash") or row.get("hash_value"),
            "verificationStatus": row.get("verification_status", "VERIFIED"),
            "courtStatus": row.get("court_status", "Registered"),
            "lastVerified": row.get("last_verified"),
            "notes": row.get("notes"),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None,
            "updatedAt": str(row.get("updated_at")) if row.get("updated_at") else None
        }

    @staticmethod
    def to_db(data):
        return {
            "evidence_id": data.get("evidenceId") or data.get("id"),
            "case_id": data.get("caseId"),
            "evidence_name": data.get("evidenceName"),
            "evidence_type": data.get("evidenceType"),
            "description": data.get("description"),
            "collected_by": data.get("collectedBy"),
            "collection_date": data.get("collectionDate"),
            "collection_time": data.get("collectionTime"),
            "collection_location": data.get("collectionLocation"),
            "source": data.get("source"),
            "file_name": data.get("fileName"),
            "file_path": data.get("filePath"),
            "file_size": data.get("fileSize"),
            "file_size_bytes": data.get("fileSizeBytes", 0),
            "hash_algorithm": data.get("hashAlgorithm", "SHA-256"),
            "hash_value": data.get("hashValue"),
            "original_hash": data.get("originalHash") or data.get("hashValue"),
            "current_hash": data.get("currentHash") or data.get("hashValue"),
            "verification_status": data.get("verificationStatus", "VERIFIED"),
            "court_status": data.get("courtStatus", "Registered"),
            "last_verified": data.get("lastVerified"),
            "notes": data.get("notes")
        }
