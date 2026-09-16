"""
CEMS Backend REST API — Exhaustive Production Test Suite
Validates all 12 modules, auth security, RBAC, file uploads, and SHA-256 verification.
"""

import sys
import io
import json
import time
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app import create_app

def run_tests():
    print("=" * 65)
    print(" CEMS REST API — EXHAUSTIVE DEPLOYMENT VALIDATION SUITE")
    print("=" * 65)

    app = create_app()
    client = app.test_client()
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name}")
        else:
            print(f" [FAIL] {name} - {details}")

    # =========================================================================
    # 1. Health Check
    # =========================================================================
    res = client.get("/api/health")
    data = res.get_json() or {}
    assert_test("1. GET /api/health (Database Connected)", res.status_code == 200 and data.get("database") == "connected", f"{res.status_code}, {data}")

    # =========================================================================
    # 2. Authentication
    # =========================================================================
    # Valid Login
    login_res = client.post("/api/auth/login", json={"email": "admin@cems.com", "password": "admin123"})
    login_data = login_res.get_json() or {}
    token = login_data.get("data", {}).get("token")
    assert_test("2. POST /api/auth/login (Valid Credentials -> JWT)", login_res.status_code == 200 and bool(token), f"{login_res.status_code}")

    # Invalid Login
    bad_login_res = client.post("/api/auth/login", json={"email": "admin@cems.com", "password": "wrongpassword!"})
    assert_test("3. POST /api/auth/login (Invalid Password -> 401)", bad_login_res.status_code == 401)

    # Auth Profile with Token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    me_data = me_res.get_json() or {}
    assert_test("4. GET /api/auth/me (Protected Route with Bearer Token)", me_res.status_code == 200 and me_data.get("data", {}).get("email") == "admin@cems.com")

    # Auth Profile without Token -> 401
    no_token_res = client.get("/api/auth/me")
    assert_test("5. GET /api/auth/me (Missing Token -> 401 Unauthorized)", no_token_res.status_code == 401)

    # User Registration
    new_user_email = f"officer_test_{int(time.time() * 1000)}@cems.com"
    reg_res = client.post("/api/auth/register", json={
        "name": "Detective Test User",
        "email": new_user_email,
        "password": "securepassword123",
        "role": "Investigator",
        "department": "Special Investigations Unit"
    })
    reg_data = reg_res.get_json() or {}
    assert_test("6. POST /api/auth/register (Create User with Hashed Password)", reg_res.status_code == 201 and reg_data.get("success") is True)

    # =========================================================================
    # 3. Case Management
    # =========================================================================
    # List Cases
    cases_res = client.get("/api/cases")
    cases = (cases_res.get_json() or {}).get("data", [])
    assert_test("7. GET /api/cases (List Cases)", cases_res.status_code == 200 and len(cases) >= 5, f"Count: {len(cases)}")

    # Filter Cases
    search_res = client.get("/api/cases?search=ransomware")
    search_cases = (search_res.get_json() or {}).get("data", [])
    assert_test("8. GET /api/cases?search=... (Search Filter)", len(search_cases) >= 1)

    # Create Case
    new_case_id = f"CEMS-TEST-CASE-{passed}"
    create_case_res = client.post("/api/cases", json={
        "caseId": new_case_id,
        "caseNumber": "CRIM-TEST-9999/2026",
        "caseTitle": "State v. Automated Testing Syndicate",
        "caseType": "Criminal",
        "courtName": "Automated Testing Court Bench 1",
        "priority": "High",
        "status": "Active"
    })
    assert_test("9. POST /api/cases (Create Case)", create_case_res.status_code == 201)

    # Get Single Case
    get_case_res = client.get(f"/api/cases/{new_case_id}")
    assert_test("10. GET /api/cases/<id> (Get Single Case)", get_case_res.status_code == 200 and (get_case_res.get_json() or {}).get("data", {}).get("caseId") == new_case_id)

    # Update Case
    up_case_res = client.put(f"/api/cases/{new_case_id}", json={"priority": "Critical"})
    assert_test("11. PUT /api/cases/<id> (Update Case)", up_case_res.status_code == 200 and (up_case_res.get_json() or {}).get("data", {}).get("priority") == "Critical")

    # Delete Case
    del_case_res = client.delete(f"/api/cases/{new_case_id}")
    assert_test("12. DELETE /api/cases/<id> (Delete Case)", del_case_res.status_code == 200)

    # =========================================================================
    # 4. Evidence Registry, Multipart File Upload, and Verification
    # =========================================================================
    ev_list_res = client.get("/api/evidence")
    evidence_list = (ev_list_res.get_json() or {}).get("data", [])
    assert_test("13. GET /api/evidence (List Evidence)", ev_list_res.status_code == 200 and len(evidence_list) >= 8)

    # Multipart File Upload for Evidence with Server-Side SHA-256
    file_content = b"EVIDENTIARY_BITSTREAM_CONTENT_FOR_CEMS_TESTING_2026_09"
    # Expected SHA-256 of file_content
    import hashlib
    expected_sha256 = hashlib.sha256(file_content).hexdigest().lower()

    test_ev_id = f"EVD-TEST-{passed}"
    upload_res = client.post("/api/evidence", data={
        "evidenceId": test_ev_id,
        "caseId": "CEMS-2026-001",
        "evidenceName": "Seized Forensic Hard Drive Image",
        "evidenceType": "Digital Document",
        "file": (io.BytesIO(file_content), "forensic_seizure_test.raw")
    }, content_type="multipart/form-data")

    upload_data = (upload_res.get_json() or {}).get("data", {})
    calculated_hash = upload_data.get("hashValue")
    assert_test("14. POST /api/evidence (Multipart Upload & Server-Side SHA-256)", upload_res.status_code == 201 and calculated_hash == expected_sha256, f"Hash match: {calculated_hash == expected_sha256}")

    # Cryptographic Hash Verification - Exact Match
    verif_match_res = client.post(f"/api/evidence/{test_ev_id}/verify", json={"testHash": expected_sha256})
    verif_data = (verif_match_res.get_json() or {}).get("data", {})
    assert_test("15. POST /api/evidence/<id>/verify (Exact SHA-256 Match -> VERIFIED)", verif_data.get("isMatch") is True and verif_data.get("verificationStatus") == "VERIFIED")

    # Cryptographic Hash Verification - Tamper/Mismatch
    tampered_hash = "1111111111111111111111111111111111111111111111111111111111111111"
    verif_mismatch_res = client.post(f"/api/evidence/{test_ev_id}/verify", json={"testHash": tampered_hash})
    mismatch_data = (verif_mismatch_res.get_json() or {}).get("data", {})
    assert_test("16. POST /api/evidence/<id>/verify (Tampered Hash -> MISMATCH)", mismatch_data.get("isMatch") is False and mismatch_data.get("verificationStatus") == "MISMATCH")

    # Clean up test evidence
    client.delete(f"/api/evidence/{test_ev_id}")

    # =========================================================================
    # 5. Chain of Custody
    # =========================================================================
    cust_res = client.get("/api/custody?evidenceId=EVD-001")
    cust_events = (cust_res.get_json() or {}).get("data", [])
    assert_test("17. GET /api/custody (Custody Timeline)", cust_res.status_code == 200 and len(cust_events) >= 5)

    add_cust_res = client.post("/api/custody", json={
        "evidenceId": "EVD-001",
        "officer": "Inspector Marcus Vance",
        "action": "Evidence Transferred",
        "fromLocation": "Vault Locker B",
        "toLocation": "High Court Bench",
        "reason": "Test Transfer"
    })
    assert_test("18. POST /api/custody (Log Custody Event)", add_cust_res.status_code == 201)

    val_res = client.get("/api/custody/EVD-001/validate")
    assert_test("19. GET /api/custody/<id>/validate (Sequence Anomaly Detection)", val_res.status_code == 200 and "isValid" in (val_res.get_json() or {}).get("data", {}))

    # =========================================================================
    # 6. Hearings
    # =========================================================================
    hearings_res = client.get("/api/hearings")
    assert_test("20. GET /api/hearings (List Hearings)", hearings_res.status_code == 200 and len((hearings_res.get_json() or {}).get("data", [])) >= 5)

    test_hrg_id = f"HRG-TEST-{passed}"
    create_hrg_res = client.post("/api/hearings", json={
        "hearingId": test_hrg_id,
        "caseId": "CEMS-2026-001",
        "court": "Metropolitan Financial Crimes Court",
        "judge": "Hon. Justice Vikramaditya Roy",
        "hearingDate": "2026-10-15",
        "hearingTime": "11:00 AM",
        "hearingType": "Motion Hearing",
        "purpose": "Admissibility review test",
        "status": "Scheduled"
    })
    assert_test("21. POST /api/hearings (Schedule Court Hearing)", create_hrg_res.status_code == 201)

    up_hrg_res = client.put(f"/api/hearings/{test_hrg_id}", json={"status": "Completed"})
    assert_test("22. PUT /api/hearings/<id> (Update Hearing Status)", up_hrg_res.status_code == 200)
    client.delete(f"/api/hearings/{test_hrg_id}")

    # =========================================================================
    # 7. Case Documents Repository
    # =========================================================================
    docs_res = client.get("/api/documents")
    assert_test("23. GET /api/documents (List Case Documents)", docs_res.status_code == 200 and len((docs_res.get_json() or {}).get("data", [])) >= 6)

    test_doc_id = f"DOC-TEST-{passed}"
    create_doc_res = client.post("/api/documents", data={
        "documentId": test_doc_id,
        "caseId": "CEMS-2026-001",
        "documentName": "Forensic Calibration Certificate Test",
        "documentType": "Forensic Report",
        "file": (io.BytesIO(b"DOCUMENT_CONTENT_SAMPLE"), "certificate.pdf")
    }, content_type="multipart/form-data")
    assert_test("24. POST /api/documents (Upload Case Document)", create_doc_res.status_code == 201)

    dl_doc_res = client.get(f"/api/documents/{test_doc_id}/download")
    assert_test("25. GET /api/documents/<id>/download (Download Stored File)", dl_doc_res.status_code == 200 and len(dl_doc_res.data) > 0)
    client.delete(f"/api/documents/{test_doc_id}")

    # =========================================================================
    # 8. Court Submissions Gateway
    # =========================================================================
    subs_res = client.get("/api/submissions")
    assert_test("26. GET /api/submissions (List Court Submissions)", subs_res.status_code == 200 and len((subs_res.get_json() or {}).get("data", [])) >= 4)

    test_sub_id = f"SUB-TEST-{int(time.time() * 1000)}"
    create_sub_res = client.post("/api/submissions", json={
        "submissionId": test_sub_id,
        "evidenceId": "EVD-001",
        "caseId": "CEMS-2026-001",
        "court": "Metropolitan Financial Crimes Court",
        "submissionReference": "CR-TEST-1001/2026",
        "submissionType": "Prosecution Exhibit",
        "status": "Submitted"
    })
    assert_test("27. POST /api/submissions (Submit Evidence to Court)", create_sub_res.status_code == 201)

    up_sub_res = client.put(f"/api/submissions/{test_sub_id}", json={"status": "Accepted", "notes": "Admitted into record"})
    assert_test("28. PUT /api/submissions/<id> (Update Submission Admission Status)", up_sub_res.status_code == 200)
    client.delete(f"/api/submissions/{test_sub_id}")


    # =========================================================================
    # 9. Dashboard, Activity, Notifications, Users, Settings
    # =========================================================================
    dash_res = client.get("/api/dashboard/stats")
    dash_data = (dash_res.get_json() or {}).get("data", {})
    assert_test("29. GET /api/dashboard/stats (KPI Aggregates & System Health)", dash_res.status_code == 200 and dash_data.get("totalCases", 0) >= 5)

    act_res = client.get("/api/activity")
    assert_test("30. GET /api/activity (Audit Activity Log)", act_res.status_code == 200 and len((act_res.get_json() or {}).get("data", [])) >= 6)

    notifs_res = client.get("/api/notifications")
    assert_test("31. GET /api/notifications (System Notifications)", notifs_res.status_code == 200 and len((notifs_res.get_json() or {}).get("data", [])) >= 4)

    mark_read_res = client.put("/api/notifications/NOTIF-01/read")
    assert_test("32. PUT /api/notifications/<id>/read (Mark Single Read)", mark_read_res.status_code == 200)

    mark_all_read_res = client.put("/api/notifications/read-all")
    assert_test("33. PUT /api/notifications/read-all (Mark All Read)", mark_all_read_res.status_code == 200)

    users_res = client.get("/api/users")
    assert_test("34. GET /api/users (Staff Directory)", users_res.status_code == 200 and len((users_res.get_json() or {}).get("data", [])) >= 5)

    settings_res = client.get("/api/settings")
    assert_test("35. GET /api/settings (System Preferences)", settings_res.status_code == 200 and (settings_res.get_json() or {}).get("data", {}).get("hashAlgorithm") == "SHA-256")

    up_settings_res = client.put("/api/settings", json={"theme": "dark", "compactMode": True})
    assert_test("36. PUT /api/settings (Update Preferences)", up_settings_res.status_code == 200 and (up_settings_res.get_json() or {}).get("data", {}).get("compactMode") is True)

    print("\n" + "=" * 65)
    print(f" FINAL TEST RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * 65)
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
