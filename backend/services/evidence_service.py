"""
Evidence Management Business Logic Service
"""

from datetime import datetime
from database.db import query_db, execute_db
from models.evidence import EvidenceModel
from services.hash_service import HashService
from services.custody_service import CustodyService
from services.audit_service import AuditService

class EvidenceService:
    @staticmethod
    def generate_next_evidence_id():
        """Generate sequential EVD-00x identifier."""
        row = query_db("SELECT COUNT(*) as cnt FROM `evidence`;", one=True)
        count = (row["cnt"] if row else 0) + 1
        return f"EVD-{str(count).zfill(3)}"

    @staticmethod
    def create_evidence(data, file_info=None, current_user="System"):
        """
        Creates an evidence record, saves file details if provided,
        and automatically generates the initial Chain of Custody entry.
        """
        evidence_id = data.get("evidenceId") or EvidenceService.generate_next_evidence_id()
        now = datetime.now()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")

        # Extract file properties if file was processed
        file_name = data.get("fileName")
        file_path = data.get("filePath")
        file_size = data.get("fileSize", "0 B")
        file_size_bytes = 0
        hash_val = data.get("hashValue")

        if file_info:
            file_name = file_info.get("fileName", file_name)
            file_path = file_info.get("filePath", file_path)
            file_size = file_info.get("fileSize", file_size)
            file_size_bytes = file_info.get("fileSizeBytes", 0)
            hash_val = file_info.get("hashValue", hash_val)

        if not hash_val:
            # Fallback placeholder if no hash was provided or calculated
            hash_val = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

        original_hash = data.get("originalHash") or hash_val
        current_hash = data.get("currentHash") or hash_val
        verification_status = data.get("verificationStatus", "VERIFIED")
        court_status = data.get("courtStatus", "Registered")

        sql = """
            INSERT INTO `evidence` (
                `evidence_id`, `case_id`, `evidence_name`, `evidence_type`, `description`,
                `collected_by`, `collection_date`, `collection_time`, `collection_location`,
                `source`, `file_name`, `file_path`, `file_size`, `file_size_bytes`,
                `hash_algorithm`, `hash_value`, `original_hash`, `current_hash`,
                `verification_status`, `court_status`, `last_verified`, `notes`
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s
            )
        """
        execute_db(sql, (
            evidence_id,
            data.get("caseId"),
            data.get("evidenceName", "Unnamed Evidence"),
            data.get("evidenceType", "Digital Document"),
            data.get("description", ""),
            data.get("collectedBy", current_user),
            data.get("collectionDate", now.strftime("%Y-%m-%d")),
            data.get("collectionTime", now.strftime("%H:%M")),
            data.get("collectionLocation", "Intake Vault"),
            data.get("source", "Intake Desk"),
            file_name,
            file_path,
            file_size,
            file_size_bytes,
            data.get("hashAlgorithm", "SHA-256"),
            hash_val,
            original_hash,
            current_hash,
            verification_status,
            court_status,
            now_str,
            data.get("notes", "")
        ))

        # Automatically log initial Chain of Custody registration
        CustodyService.create_custody_record(
            evidence_id=evidence_id,
            officer=data.get("collectedBy", current_user),
            action="Evidence Registered",
            from_location=data.get("collectionLocation", "Field Location"),
            to_location="CEMS Digital Evidence Vault",
            reason="Initial cryptographic hashing and master intake",
            notes=f"Ingested with SHA-256 hash {hash_val[:16]}...",
            event_date=data.get("collectionDate", now.strftime("%Y-%m-%d")),
            event_time=data.get("collectionTime", now.strftime("%H:%M"))
        )

        # Audit log
        AuditService.log(
            action="Evidence Added",
            module="Evidence Registry",
            reference_id=evidence_id,
            status="Success",
            details=f"Item \"{data.get('evidenceName')}\" registered under Case {data.get('caseId')}.",
            user=current_user
        )

        # Return the created evidence object
        created = query_db("SELECT * FROM `evidence` WHERE `evidence_id` = %s;", (evidence_id,), one=True)
        return EvidenceModel.to_dict(created)

    @staticmethod
    def verify_evidence_hash(evidence_id, test_hash, current_user="System"):
        """
        Cryptographically verifies provided hash against the original registered baseline.
        Updates verification_status to VERIFIED or MISMATCH.
        """
        evidence_row = query_db("SELECT * FROM `evidence` WHERE `evidence_id` = %s;", (evidence_id,), one=True)
        if not evidence_row:
            return None, "Evidence item not found"

        baseline_hash = (evidence_row.get("original_hash") or evidence_row.get("hash_value") or "").strip().lower()
        test_hash_clean = test_hash.strip().lower()

        is_match = (baseline_hash == test_hash_clean)
        status_str = "VERIFIED" if is_match else "MISMATCH"
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Update evidence record
        execute_db(
            """
            UPDATE `evidence`
            SET `current_hash` = %s, `verification_status` = %s, `last_verified` = %s
            WHERE `evidence_id` = %s
            """,
            (test_hash_clean, status_str, now_str, evidence_id)
        )

        # Log audit trail
        AuditService.log(
            action="Evidence Verified",
            module="Verification Lab",
            reference_id=evidence_id,
            status="Success" if is_match else "Danger",
            details=f"Audit result: {status_str}. Baseline: {baseline_hash[:12]}..., Computed: {test_hash_clean[:12]}...",
            user=current_user
        )

        updated_row = query_db("SELECT * FROM `evidence` WHERE `evidence_id` = %s;", (evidence_id,), one=True)
        evidence_dict = EvidenceModel.to_dict(updated_row)

        return {
            "evidence": evidence_dict,
            "isMatch": is_match,
            "originalHash": baseline_hash,
            "computedHash": test_hash_clean,
            "verificationStatus": status_str,
            "timestamp": now_str
        }, None
