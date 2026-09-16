"""
User model & serialization helper
"""

class UserModel:
    @staticmethod
    def to_dict(row, include_sensitive=False):
        if not row:
            return None
        data = {
            "id": row.get("user_id"),
            "userId": row.get("user_id"),
            "name": row.get("name"),
            "email": row.get("email"),
            "role": row.get("role"),
            "department": row.get("department"),
            "status": row.get("status", "Active"),
            "lastLogin": row.get("last_login"),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None
        }
        if include_sensitive:
            data["passwordHash"] = row.get("password_hash")
        return data

    @staticmethod
    def to_db(data):
        return {
            "user_id": data.get("userId") or data.get("id"),
            "name": data.get("name"),
            "email": data.get("email"),
            "role": data.get("role", "Court Officer"),
            "department": data.get("department"),
            "status": data.get("status", "Active"),
            "last_login": data.get("lastLogin")
        }
