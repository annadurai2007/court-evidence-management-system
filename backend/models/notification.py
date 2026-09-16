"""
Notification model & serialization helper
"""

class NotificationModel:
    @staticmethod
    def to_dict(row):
        if not row:
            return None
        return {
            "id": row.get("notification_id"),
            "notificationId": row.get("notification_id"),
            "title": row.get("title"),
            "message": row.get("message"),
            "type": row.get("type", "info"),
            "time": row.get("time_ago", "Recently"),
            "timeAgo": row.get("time_ago", "Recently"),
            "unread": bool(row.get("is_unread", 1)),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None
        }

    @staticmethod
    def to_db(data):
        return {
            "notification_id": data.get("notificationId") or data.get("id"),
            "title": data.get("title"),
            "message": data.get("message"),
            "type": data.get("type", "info"),
            "time_ago": data.get("time") or data.get("timeAgo", "Just now"),
            "is_unread": 1 if data.get("unread", True) else 0
        }
