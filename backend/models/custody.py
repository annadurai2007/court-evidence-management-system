"""
Custody record model & serialization helper
"""

class CustodyModel:
    @staticmethod
    def to_dict(row):
        if not row:
            return None
        return {
            "id": row.get("custody_id"),
            "custodyId": row.get("custody_id"),
            "evidenceId": row.get("evidence_id"),
            "date": row.get("event_date"),
            "time": row.get("event_time"),
            "officer": row.get("officer"),
            "action": row.get("action"),
            "fromLocation": row.get("from_location"),
            "toLocation": row.get("to_location"),
            "reason": row.get("reason"),
            "notes": row.get("notes"),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None
        }

    @staticmethod
    def to_db(data):
        return {
            "custody_id": data.get("custodyId") or data.get("id"),
            "evidence_id": data.get("evidenceId"),
            "event_date": data.get("date") or data.get("eventDate"),
            "event_time": data.get("time") or data.get("eventTime"),
            "officer": data.get("officer"),
            "action": data.get("action"),
            "from_location": data.get("fromLocation"),
            "to_location": data.get("toLocation"),
            "reason": data.get("reason"),
            "notes": data.get("notes")
        }
