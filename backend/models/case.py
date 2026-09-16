"""
Case model & serialization helper
"""

class CaseModel:
    @staticmethod
    def to_dict(row):
        if not row:
            return None
        return {
            "id": row.get("case_id"),
            "caseId": row.get("case_id"),
            "caseNumber": row.get("case_number"),
            "caseTitle": row.get("case_title"),
            "caseType": row.get("case_type"),
            "courtName": row.get("court_name"),
            "courtLocation": row.get("court_location"),
            "judgeName": row.get("judge_name"),
            "presidingOfficer": row.get("presiding_officer"),
            "investigatingOfficer": row.get("investigating_officer"),
            "petitioner": row.get("petitioner"),
            "respondent": row.get("respondent"),
            "advocate": row.get("advocate"),
            "priority": row.get("priority", "Medium"),
            "status": row.get("status", "Active"),
            "filingDate": row.get("filing_date"),
            "nextHearingDate": row.get("next_hearing_date"),
            "description": row.get("description"),
            "createdAt": str(row.get("created_at")) if row.get("created_at") else None,
            "updatedAt": str(row.get("updated_at")) if row.get("updated_at") else None
        }

    @staticmethod
    def to_db(data):
        return {
            "case_id": data.get("caseId") or data.get("id"),
            "case_number": data.get("caseNumber"),
            "case_title": data.get("caseTitle"),
            "case_type": data.get("caseType", "Criminal"),
            "court_name": data.get("courtName"),
            "court_location": data.get("courtLocation"),
            "judge_name": data.get("judgeName"),
            "presiding_officer": data.get("presidingOfficer"),
            "investigating_officer": data.get("investigatingOfficer"),
            "petitioner": data.get("petitioner"),
            "respondent": data.get("respondent"),
            "advocate": data.get("advocate"),
            "priority": data.get("priority", "Medium"),
            "status": data.get("status", "Active"),
            "filing_date": data.get("filingDate"),
            "next_hearing_date": data.get("nextHearingDate"),
            "description": data.get("description")
        }
