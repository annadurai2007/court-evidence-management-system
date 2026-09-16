"""
Dashboard Statistics & Analytics Routes Blueprint (/api/dashboard)
"""

from flask import Blueprint
from database.db import query_db
from models.case import CaseModel
from models.evidence import EvidenceModel
from models.activity import ActivityModel
from utils.response import success_response

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/stats", methods=["GET"])
def get_dashboard_stats():
    """Aggregates all key metric counters, distributions, and recent legal records."""
    # 1. Metric Counts
    cases_cnt = query_db("SELECT COUNT(*) as c FROM `cases`;", one=True)["c"]
    evidence_cnt = query_db("SELECT COUNT(*) as c FROM `evidence`;", one=True)["c"]
    pending_verif = query_db("SELECT COUNT(*) as c FROM `evidence` WHERE `verification_status` = 'PENDING';", one=True)["c"]
    court_sub = query_db("SELECT COUNT(*) as c FROM `evidence` WHERE `court_status` = 'Submitted';", one=True)["c"]
    admitted = query_db("SELECT COUNT(*) as c FROM `evidence` WHERE `court_status` = 'Admitted';", one=True)["c"]
    rejected = query_db("SELECT COUNT(*) as c FROM `evidence` WHERE `court_status` = 'Rejected' OR `verification_status` = 'MISMATCH';", one=True)["c"]

    # 2. Recent records
    recent_cases_rows = query_db("SELECT * FROM `cases` ORDER BY `id` DESC LIMIT 5;")
    recent_evidence_rows = query_db("SELECT * FROM `evidence` ORDER BY `id` DESC LIMIT 5;")
    recent_activity_rows = query_db("SELECT * FROM `activity_logs` ORDER BY `id` DESC LIMIT 6;")

    # 3. Status Distributions
    cases_by_type = query_db("SELECT `case_type`, COUNT(*) as cnt FROM `cases` GROUP BY `case_type`;")
    evidence_by_type = query_db("SELECT `evidence_type`, COUNT(*) as cnt FROM `evidence` GROUP BY `evidence_type`;")
    evidence_by_status = query_db("SELECT `court_status`, COUNT(*) as cnt FROM `evidence` GROUP BY `court_status`;")

    stats = {
        "totalCases": cases_cnt,
        "totalEvidence": evidence_cnt,
        "pendingVerification": pending_verif,
        "courtSubmitted": court_sub,
        "admittedEvidence": admitted,
        "rejectedEvidence": rejected,
        "recentCases": [CaseModel.to_dict(r) for r in recent_cases_rows],
        "recentEvidence": [EvidenceModel.to_dict(r) for r in recent_evidence_rows],
        "recentActivity": [ActivityModel.to_dict(r) for r in recent_activity_rows],
        "distributions": {
            "casesByType": {r["case_type"]: r["cnt"] for r in cases_by_type},
            "evidenceByType": {r["evidence_type"]: r["cnt"] for r in evidence_by_type},
            "evidenceByStatus": {r["court_status"]: r["cnt"] for r in evidence_by_status}
        },
        "systemStatus": {
            "caseManagement": "Operational",
            "evidenceRegistry": "Operational",
            "verificationEngine": "Operational",
            "submissionGateway": "Operational",
            "auditLog": "Operational",
            "databaseEngine": "MySQL Connected"
        }
    }

    return success_response(stats)
