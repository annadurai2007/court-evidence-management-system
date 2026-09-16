"""
Centralized Immutable Audit Activity Logger
"""

import time
from datetime import datetime
from database.db import execute_db

class AuditService:
    @staticmethod
    def log(action, module, reference_id=None, status="Success", details="", user="System"):
        """
        Record an immutable activity log entry in the database.
        """
        try:
            now = datetime.now()
            timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
            # Generate unique activity ID
            unique_suffix = str(int(time.time() * 1000))[-5:]
            activity_id = f"ACT-{unique_suffix}"

            sql = """
                INSERT INTO `activity_logs` 
                (`activity_id`, `timestamp`, `user`, `action`, `module`, `reference_id`, `status`, `details`)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_db(sql, (
                activity_id,
                timestamp_str,
                user or "System",
                action,
                module,
                reference_id,
                status,
                details
            ))
            return activity_id
        except Exception as e:
            # Fallback print if DB logging fails so we never crash the main operation
            print(f"[AuditService Error] Failed to log activity: {e}")
            return None
