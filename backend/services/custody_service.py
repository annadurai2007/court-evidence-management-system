"""
Chain of Custody Service & Sequence Anomaly Detector
"""

import time
from datetime import datetime
from database.db import query_db, execute_db

EXPECTED_PROGRESSION = [
    "Evidence Collected",
    "Evidence Registered",
    "Evidence Stored",
    "Evidence Transferred",
    "Evidence Reviewed",
    "Evidence Submitted to Court",
    "Evidence Admitted",
    "Evidence Archived"
]

class CustodyService:
    @staticmethod
    def create_custody_record(evidence_id, officer, action, from_location, to_location, reason, notes="", event_date=None, event_time=None):
        """Creates a single custody transfer event."""
        now = datetime.now()
        date_str = event_date or now.strftime("%Y-%m-%d")
        time_str = event_time or now.strftime("%H:%M")
        
        # Get count to generate sequential ID
        count_res = query_db("SELECT COUNT(*) as c FROM `custody_records`;", one=True)
        seq = (count_res["c"] if count_res else 0) + 1
        custody_id = f"CUST-{str(seq).padStart(3, '0') if hasattr(str(seq), 'padStart') else str(seq).zfill(3)}"

        sql = """
            INSERT INTO `custody_records`
            (`custody_id`, `evidence_id`, `event_date`, `event_time`, `officer`, `action`, `from_location`, `to_location`, `reason`, `notes`)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        execute_db(sql, (
            custody_id,
            evidence_id,
            date_str,
            time_str,
            officer or "Intake Officer",
            action,
            from_location or "Field Location",
            to_location or "CEMS Vault",
            reason or "Routine custody processing",
            notes or ""
        ))
        return custody_id

    @staticmethod
    def validate_custody_chain(evidence_id):
        """
        Examines custody progression for an evidence item.
        Detects missing steps or anomalies (e.g. going from Collected directly to Submitted).
        """
        records = query_db(
            "SELECT * FROM `custody_records` WHERE `evidence_id` = %s ORDER BY `event_date` ASC, `event_time` ASC, `id` ASC;",
            (evidence_id,)
        )
        if not records:
            return {
                "isValid": True,
                "warnings": ["No custody events logged yet."],
                "eventCount": 0
            }

        actions = [r["action"] for r in records]
        warnings = []
        
        # Check if it skipped storage or review before court submission
        has_collected = any("Collected" in a for a in actions)
        has_registered = any("Registered" in a for a in actions)
        has_stored = any("Stored" in a for a in actions)
        has_reviewed = any("Reviewed" in a or "Transferred" in a for a in actions)
        has_submitted = any("Submitted" in a for a in actions)

        if has_submitted and not has_stored:
            warnings.append("Sequence Gap: Evidence submitted to court without documented vault storage.")
        if has_submitted and not has_reviewed:
            warnings.append("Admissibility Warning: Evidence submitted to court without documented forensic lab review.")

        return {
            "isValid": len(warnings) == 0,
            "eventCount": len(records),
            "warnings": warnings,
            "actions": actions
        }
