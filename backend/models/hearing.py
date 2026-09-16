"""
Hearing model & serialization helper
"""

class HearingModel:
    @staticmethod
    def to_dict(row):
        if not row:
            return None
        return {
            "id": row.get("hearing_id"),
            "hearingId": row.get("hearing_id"),
            "caseId": row.get("case_id"),
            "court": row.get("court"),
            "judge": row.get("judge"),
            "hearingDate": row.get("hearing_date"),
            "hearingTime": row.get("hearing_time"),
            "hearingType": row.get("hearing_type"),
            "purpose": row.get("purpose"),
            "status": row.get("status", "Scheduled"),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None,
            "updatedAt": str(row.get("updated_at")) if row.get("updated_at") else None
        }

    @staticmethod
    def to_db(data):
        return {
            "hearing_id": data.get("hearingId") or data.get("id"),
            "case_id": data.get("caseId"),
            "court": data.get("court"),
            "judge": data.get("judge"),
            "hearing_date": data.get("hearingDate"),
            "hearing_time": data.get("hearingTime"),
            "hearing_type": data.get("hearingType"),
            "purpose": data.get("purpose"),
            "status": data.get("status", "Scheduled")
        }
