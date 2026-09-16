"""
Activity log model & serialization helper
"""

class ActivityModel:
    @staticmethod
    def to_dict(row):
        if not row:
            return None
        return {
            "id": row.get("activity_id"),
            "activityId": row.get("activity_id"),
            "timestamp": row.get("timestamp"),
            "user": row.get("user"),
            "action": row.get("action"),
            "module": row.get("module"),
            "referenceId": row.get("reference_id"),
            "status": row.get("status", "Success"),
            "details": row.get("details"),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None
        }

    @staticmethod
    def to_db(data):
        return {
            "activity_id": data.get("activityId") or data.get("id"),
            "timestamp": data.get("timestamp"),
            "user": data.get("user", "System"),
            "action": data.get("action"),
            "module": data.get("module"),
            "reference_id": data.get("referenceId"),
            "status": data.get("status", "Success"),
            "details": data.get("details")
        }
