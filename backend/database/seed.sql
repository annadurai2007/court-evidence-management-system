-- =============================================================================
-- COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
-- Realistic Seed Dataset Matching Frontend Mock State
-- =============================================================================

USE `cems_db`;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `custody_records`;
TRUNCATE TABLE `court_submissions`;
TRUNCATE TABLE `documents`;
TRUNCATE TABLE `hearings`;
TRUNCATE TABLE `evidence`;
TRUNCATE TABLE `cases`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `activity_logs`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `settings`;

-- -----------------------------------------------------------------------------
-- 1. SEED USERS (Password for all: admin123)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `role`, `department`, `status`, `last_login`) VALUES
('USR-001', 'Hon. Arthur Pendelton', 'arthur.court@cems.com', 'scrypt:32768:8:1$IHEKsgz9nV0Lusfu$373ba410067151076e87fd30e2b34bbd09c196202e51ea8a329d5a1b9e719e84e80b0d041a496ad08deacbb78a2124b579ad50a6f26e5f00cb2d3b6ebf25aa99', 'Court Officer', 'Metropolitan High Court, Bench III', 'Active', '2026-09-15 10:24 AM'),
('USR-002', 'Special Agent Sarah Jenkins', 'sarah.cyber@cems.com', 'scrypt:32768:8:1$IHEKsgz9nV0Lusfu$373ba410067151076e87fd30e2b34bbd09c196202e51ea8a329d5a1b9e719e84e80b0d041a496ad08deacbb78a2124b579ad50a6f26e5f00cb2d3b6ebf25aa99', 'Investigator', 'Cyber Crime & Digital Forensics Unit', 'Active', '2026-09-15 09:12 AM'),
('USR-003', 'Inspector Marcus Vance', 'admin@cems.com', 'scrypt:32768:8:1$IHEKsgz9nV0Lusfu$373ba410067151076e87fd30e2b34bbd09c196202e51ea8a329d5a1b9e719e84e80b0d041a496ad08deacbb78a2124b579ad50a6f26e5f00cb2d3b6ebf25aa99', 'Evidence Officer', 'Central Evidence Vault & Repository', 'Active', '2026-09-15 11:45 AM'),
('USR-004', 'Elena Rostova, Senior Counsel', 'elena.counsel@cems.com', 'scrypt:32768:8:1$IHEKsgz9nV0Lusfu$373ba410067151076e87fd30e2b34bbd09c196202e51ea8a329d5a1b9e719e84e80b0d041a496ad08deacbb78a2124b579ad50a6f26e5f00cb2d3b6ebf25aa99', 'Advocate', 'Bar Association Panel', 'Active', '2026-09-14 04:30 PM'),
('USR-005', 'Dr. Evelyn Reed', 'evelyn.forensics@cems.com', 'scrypt:32768:8:1$IHEKsgz9nV0Lusfu$373ba410067151076e87fd30e2b34bbd09c196202e51ea8a329d5a1b9e719e84e80b0d041a496ad08deacbb78a2124b579ad50a6f26e5f00cb2d3b6ebf25aa99', 'Reviewer', 'State Forensic Science Laboratory', 'Active', '2026-09-15 08:00 AM');

-- -----------------------------------------------------------------------------
-- 2. SEED CASES
-- -----------------------------------------------------------------------------
INSERT INTO `cases` (`case_id`, `case_number`, `case_title`, `case_type`, `court_name`, `court_location`, `judge_name`, `presiding_officer`, `investigating_officer`, `petitioner`, `respondent`, `advocate`, `priority`, `status`, `filing_date`, `next_hearing_date`, `description`) VALUES
('CEMS-2026-001', 'CRIM-8842/2026', 'State v. Apex Global Syndicate (FinTech Fraud)', 'Financial', 'Metropolitan Financial Crimes Court', 'Sector 4, Judicial Complex, New Delhi', 'Hon. Justice Vikramaditya Roy', 'Arthur Pendelton', 'Sarah Jenkins (Cyber Unit)', 'Securities & Regulatory Commission', 'Apex Global Financial Services Ltd.', 'Elena Rostova, Sr. Advocate', 'Critical', 'Active', '2026-02-14', '2026-09-22', 'Multinational unauthorized algorithmic ledger manipulation and cross-border laundering of $14.2M via spoofed SWIFT tokens.'),
('CEMS-2026-002', 'CYBER-1092/2026', 'State v. BlackHat Ransomware Nexus', 'Cyber Crime', 'High Court Cyber Appellate Division', 'Court Room 7, High Court Complex', 'Hon. Justice Alistair Montgomery', 'Arthur Pendelton', 'Special Agent Sarah Jenkins', 'Central Infrastructure Grid Authority', 'Unknown Operators (Alias: ZeroPayload)', 'David Sterling, Esq.', 'Critical', 'Evidence Review', '2026-04-10', '2026-09-28', 'Infiltration and ransomware deployment against thermal power supervisory SCADA systems.'),
('CEMS-2026-003', 'CRIM-4109/2026', 'Commonwealth v. Sterling Logistics (Contraband)', 'Criminal', 'District & Sessions Court, Harbor Division', 'Chamber 12, Maritime Court Annex', 'Hon. Magistrate Rachel Thorne', 'Keith Holloway', 'Inspector Marcus Vance', 'Customs & Border Enforcement', 'Sterling Maritime Carriers LLC', 'Rebecca Cole, Attorney', 'High', 'Hearing Scheduled', '2026-05-19', '2026-09-18', 'Interception of unmanifested sealed maritime cargo containers carrying controlled high-grade precision components.'),
('CEMS-2026-004', 'CIV-2319/2026', 'AeroTech Dynamics v. Horizon Avionics (IP Theft)', 'Property', 'Commercial Appellate Tribunal', 'Commercial Bench B, City Center', 'Hon. Justice Robert K. Chen', 'Diana Ward', 'Detective Ryan Gossett', 'AeroTech Dynamics Corp.', 'Horizon Avionics International', 'Kavita Iyer, Patent Attorney', 'Medium', 'Under Investigation', '2026-06-02', '2026-10-05', 'Unauthorized exfiltration and patent infringement of next-generation turbine cooling telemetry source code.'),
('CEMS-2026-005', 'CIV-9931/2025', 'Vanguard Realty Trust v. Greenfield Urban Dev', 'Civil', 'High Court Commercial Division', 'Court Room 3, Civil Wing', 'Hon. Justice Meera Swaminathan', 'Keith Holloway', 'Officer Neil Gallagher', 'Vanguard Realty Trust', 'Greenfield Urban Developers', 'Siddharth Sen, Advocate', 'Low', 'Closed', '2025-11-12', '—', 'Dispute over commercial title deeds and forged municipal zoning sanction orders.');

-- -----------------------------------------------------------------------------
-- 3. SEED EVIDENCE
-- -----------------------------------------------------------------------------
INSERT INTO `evidence` (`evidence_id`, `case_id`, `evidence_name`, `evidence_type`, `description`, `collected_by`, `collection_date`, `collection_time`, `collection_location`, `source`, `file_name`, `file_size`, `hash_algorithm`, `hash_value`, `original_hash`, `current_hash`, `verification_status`, `court_status`, `last_verified`, `notes`) VALUES
('EVD-001', 'CEMS-2026-001', 'SWIFT Server Audit Trail & Encrypted Blob', 'Financial Record', 'Master binary transaction log file extracted from primary gateway server at Apex Data Center showing manipulated timestamps.', 'Sarah Jenkins (Cyber Unit)', '2026-02-18', '14:35', 'Apex Financial Data Center, Rack 14B', 'Forensic clone from Dell PowerEdge R750', 'swift_gateway_audit_raw.bin', '412.8 MB', 'SHA-256', '8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4', '8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4', '8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4', 'VERIFIED', 'Admitted', '2026-09-12 11:20 AM', 'Admitted by Hon. Justice Vikramaditya Roy into primary trial evidence.'),
('EVD-002', 'CEMS-2026-001', 'Encrypted USB Cold Wallet Recovered at Airport', 'Physical Document', 'Ledger Nano X hardware crypto wallet seized during suspect baggage search with tamper-evident seal #TE-99214.', 'Inspector Marcus Vance', '2026-02-20', '06:15', 'International Terminal 3, Baggage Inspection Zone', 'Physical Seizure under Court Warrant #CW-2026-44', 'ledger_hardware_dump_image.dd', '1.2 GB', 'SHA-256', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d', 'VERIFIED', 'Submitted', '2026-09-14 03:45 PM', 'Physical custody held in vault locker B-04. Digital image submitted to court clerk.'),
('EVD-003', 'CEMS-2026-002', 'SCADA Telemetry PCAP Packet Capture', 'CCTV Footage', 'Network packet capture showing beaconing to command & control IP 185.220.101.5 during power station outage.', 'Sarah Jenkins (Cyber Unit)', '2026-04-12', '23:10', 'Thermal Grid Substation Control Room Alpha', 'Core Cisco Catalyst Switch Port Mirroring SPAN', 'scada_incident_traffic_stream.pcapng', '89.4 MB', 'SHA-256', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', 'VERIFIED', 'Under Review', '2026-09-10 16:00 PM', 'Forensic analysis completed by Dr. Evelyn Reed. Ready for next evidentiary hearing.'),
('EVD-004', 'CEMS-2026-003', 'Dockside CCTV Security DVR Footage (4K)', 'CCTV Footage', 'High-definition video showing unauthorized night offloading of container MSKU-998124 at Berth 11.', 'Officer Neil Gallagher', '2026-05-20', '03:40', 'Port Authority Security Operations Center', 'Hikvision NVR Channel 04 Export', 'berth11_security_feed_20260520.mp4', '4.8 GB', 'SHA-256', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'VERIFIED', 'Submitted', '2026-09-15 08:30 AM', 'Time synchronization confirmed against atomic clock telemetry.'),
('EVD-005', 'CEMS-2026-004', 'Exfiltrated CAD Blueprint Schematics (PDF)', 'Digital Document', 'Proprietary vector schematics of ceramic turbine fan assembly discovered on suspect cloud staging server.', 'Detective Ryan Gossett', '2026-06-08', '17:20', 'Digital Forensic Workstation 02', 'AWS S3 Bucket Forensics under subpoena', 'aerotech_turbine_c3_cad_export.pdf', '18.4 MB', 'SHA-256', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'VERIFIED', 'Registered', '2026-09-01 10:15 AM', 'Pending initial cross-examination review by defense counsel.'),
('EVD-006', 'CEMS-2026-001', 'Suspicious Email Thread Archive (MBOX)', 'Email', 'Full unredacted email thread between Chief Financial Officer and offshore shell intermediary.', 'Sarah Jenkins (Cyber Unit)', '2026-02-25', '11:00', 'Apex Corporate HQ, Floor 18', 'Microsoft Exchange Server Export', 'cfo_apex_correspondence_archive.mbox', '64.1 MB', 'SHA-256', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'VERIFIED', 'Admitted', '2026-09-08 14:10 PM', 'Admitted as Exhibit C in preliminary examination.'),
('EVD-007', 'CEMS-2026-005', 'Forged Municipal Title Deed Document', 'Physical Document', 'Original parchment document bearing simulated municipal seal and fabricated notary stamp.', 'Officer Neil Gallagher', '2025-11-20', '15:30', 'Land Registry Office, Counter 4', 'Registry archival impound', 'municipal_deed_scan_300dpi.tiff', '45.0 MB', 'SHA-256', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'VERIFIED', 'Archived', '2026-01-15 11:00 AM', 'Case disposed. Physical evidence archived in Long-term Judicial Records.'),
('EVD-008', 'CEMS-2026-003', 'Unverified Corrupted USB Flash Drive', 'Computer Data', 'Damaged flash memory stick found in suspect vehicle with partial bit-rot.', 'Inspector Marcus Vance', '2026-05-22', '18:10', 'Impound Lot 3', 'Glove compartment search', 'corrupted_dump_0522.raw', '32.0 MB', 'SHA-256', 'cb8379ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5b34', 'cb8379ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5b34', 'ffff79ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5000', 'MISMATCH', 'Rejected', '2026-09-14 17:00 PM', 'Cryptographic hash mismatch detected during laboratory integrity audit. Flagged as rejected.');

-- -----------------------------------------------------------------------------
-- 4. SEED CHAIN OF CUSTODY RECORDS
-- -----------------------------------------------------------------------------
INSERT INTO `custody_records` (`custody_id`, `evidence_id`, `event_date`, `event_time`, `officer`, `action`, `from_location`, `to_location`, `reason`, `notes`) VALUES
('CUST-001', 'EVD-001', '2026-02-18', '14:35', 'Sarah Jenkins', 'Evidence Collected', 'Apex Financial Data Center, Server Rack 14B', 'Cyber Forensics Mobile Lab Unit 1', 'Initial physical seizure and bit-stream disk acquisition under Judicial Warrant #CW-2026-44', 'Tamper-evident forensic bag #TB-8801 applied and signed by lead investigator.'),
('CUST-002', 'EVD-001', '2026-02-18', '17:40', 'Sarah Jenkins', 'Evidence Registered', 'Cyber Forensics Mobile Lab Unit 1', 'CEMS Digital Evidence Repository', 'Cryptographic SHA-256 hashing and ingestion into master evidence catalog', 'Hash verified immediately upon arrival: 8f4343...aa4.'),
('CUST-003', 'EVD-001', '2026-02-19', '09:15', 'Marcus Vance', 'Evidence Stored', 'CEMS Intake Desk', 'Central Evidence Vault, Sector B, Locker 14', 'Secure storage pending forensic laboratory analysis request', 'Temperature and biometric access controlled room.'),
('CUST-004', 'EVD-001', '2026-02-24', '11:00', 'Dr. Evelyn Reed', 'Evidence Transferred', 'Central Evidence Vault Locker 14', 'State Forensic Science Laboratory, Digital Section', 'Deep heuristic reverse-engineering of ledger transaction routines', 'Digital read-only forensic write-blocker utilized.'),
('CUST-005', 'EVD-001', '2026-03-05', '15:20', 'Dr. Evelyn Reed', 'Evidence Reviewed', 'State Forensic Science Laboratory', 'Central Evidence Vault Locker 14', 'Forensic examination complete; certified expert witness report issued', 'Integrity re-verified against baseline SHA-256 without variance.'),
('CUST-006', 'EVD-001', '2026-03-20', '10:00', 'Arthur Pendelton', 'Evidence Submitted to Court', 'Central Evidence Vault Locker 14', 'Metropolitan Financial Crimes Court, Bench III Record Room', 'Formal legal submission for preliminary admissibility hearing', 'Official Court Receipt #CR-8821 acknowledged by Court Clerk.'),
('CUST-007', 'EVD-001', '2026-04-02', '11:30', 'Hon. Justice Vikramaditya Roy', 'Evidence Admitted', 'Court Room 3 Judicial Bench', 'Admitted Evidence Judicial Strongroom', 'Marked as Prosecution Exhibit P-1; objections by defense overruled', 'Entered into official judicial trial record.'),
('CUST-008', 'EVD-002', '2026-02-20', '06:15', 'Marcus Vance', 'Evidence Collected', 'Terminal 3 International Baggage Screening', 'Airport Police Custody Annex', 'Confiscated during passenger bag inspection under customs warrant', 'Device placed in Faraday electromagnetic shield bag #FD-109.'),
('CUST-009', 'EVD-002', '2026-02-20', '10:45', 'Marcus Vance', 'Evidence Registered', 'Airport Police Custody Annex', 'Central Evidence Vault', 'Serial number and physical barcode logging', 'Signed handover receipt #HR-441.'),
('CUST-010', 'EVD-002', '2026-03-01', '14:00', 'Marcus Vance', 'Evidence Submitted to Court', 'Central Evidence Vault', 'Court Clerk Evidence Desk', 'Submitted for verification by judicial handwriting and forensics master', 'Pending final admissibility arguments.'),
('CUST-011', 'EVD-008', '2026-05-22', '18:10', 'Marcus Vance', 'Evidence Collected', 'Suspect Glove Compartment', 'Local Precinct Evidence Room', 'Discovered during inventory search', 'No Faraday shielding applied at point of collection.'),
('CUST-012', 'EVD-008', '2026-09-14', '17:00', 'Arthur Pendelton', 'Evidence Submitted to Court', 'Local Precinct Evidence Room', 'District Court Evidence Registry', 'Direct court delivery attempting to bypass certified laboratory verification', 'Hash check produced mismatch! Sequence gap: missed proper Storage & Lab Review.');

-- -----------------------------------------------------------------------------
-- 5. SEED HEARINGS
-- -----------------------------------------------------------------------------
INSERT INTO `hearings` (`hearing_id`, `case_id`, `court`, `judge`, `hearing_date`, `hearing_time`, `hearing_type`, `purpose`, `status`) VALUES
('HRG-2026-01', 'CEMS-2026-003', 'District & Sessions Court, Harbor Division', 'Hon. Magistrate Rachel Thorne', '2026-09-18', '10:30 AM', 'Evidence Hearing', 'Examination of Port Authority CCTV footage and witness testimony of Crane Operator.', 'Scheduled'),
('HRG-2026-02', 'CEMS-2026-001', 'Metropolitan Financial Crimes Court', 'Hon. Justice Vikramaditya Roy', '2026-09-22', '02:00 PM', 'Trial', 'Cross-examination of forensic audit lead Dr. Evelyn Reed regarding SWIFT blob authenticity.', 'Scheduled'),
('HRG-2026-03', 'CEMS-2026-002', 'High Court Cyber Appellate Division', 'Hon. Justice Alistair Montgomery', '2026-09-28', '11:00 AM', 'Preliminary Hearing', 'Admissibility review of extraterritorial server traffic logs and cyber jurisdiction.', 'Scheduled'),
('HRG-2026-04', 'CEMS-2026-004', 'Commercial Appellate Tribunal', 'Hon. Justice Robert K. Chen', '2026-10-05', '11:30 AM', 'Final Hearing', 'Final arguments on patent infringement damages and permanent injunction.', 'Scheduled'),
('HRG-2026-05', 'CEMS-2026-001', 'Metropolitan Financial Crimes Court', 'Hon. Justice Vikramaditya Roy', '2026-04-02', '10:00 AM', 'Preliminary Hearing', 'Initial bail plea hearing and framing of financial conspiracy charges.', 'Completed');

-- -----------------------------------------------------------------------------
-- 6. SEED DOCUMENTS
-- -----------------------------------------------------------------------------
INSERT INTO `documents` (`document_id`, `case_id`, `document_name`, `document_type`, `uploaded_by`, `upload_date`, `version`, `status`, `file_size`) VALUES
('DOC-101', 'CEMS-2026-001', 'First Information Report (FIR-992/2026)', 'FIR', 'Inspector Marcus Vance', '2026-02-14', 'v1.0', 'Verified', '2.4 MB'),
('DOC-102', 'CEMS-2026-001', 'Forensic Laboratory Integrity Certificate (FSL-551)', 'Forensic Report', 'Dr. Evelyn Reed', '2026-03-06', 'v1.2', 'Verified', '5.1 MB'),
('DOC-103', 'CEMS-2026-001', 'Judicial Search & Seizure Warrant (CW-2026-44)', 'Court Orders', 'Arthur Pendelton', '2026-02-16', 'v1.0', 'Admitted', '1.8 MB'),
('DOC-104', 'CEMS-2026-002', 'SCADA Intrusion Incident Response Debrief', 'Evidence Report', 'Sarah Jenkins', '2026-04-18', 'v2.0', 'Pending Review', '14.6 MB'),
('DOC-105', 'CEMS-2026-003', 'Harbor Security Camera Calibration Affidavit', 'Affidavit', 'Officer Neil Gallagher', '2026-05-25', 'v1.0', 'Verified', '950 KB'),
('DOC-106', 'CEMS-2026-001', 'Charge Sheet filed under Section 420/120B (CS-14)', 'Charge Sheet', 'Elena Rostova, Sr. Advocate', '2026-03-15', 'v1.0', 'Admitted', '8.2 MB');

-- -----------------------------------------------------------------------------
-- 7. SEED COURT SUBMISSIONS
-- -----------------------------------------------------------------------------
INSERT INTO `court_submissions` (`submission_id`, `evidence_id`, `case_id`, `court`, `submission_date`, `submitted_by`, `submission_reference`, `submission_type`, `status`, `notes`) VALUES
('SUB-2026-001', 'EVD-001', 'CEMS-2026-001', 'Metropolitan Financial Crimes Court', '2026-03-20', 'Arthur Pendelton', 'CR-8821/2026', 'Prosecution Exhibit', 'Accepted', 'Admitted into record by Judge Vikramaditya Roy after integrity verification.'),
('SUB-2026-002', 'EVD-002', 'CEMS-2026-001', 'Metropolitan Financial Crimes Court', '2026-03-28', 'Inspector Marcus Vance', 'CR-8890/2026', 'Physical Vault Deposition', 'Submitted', 'Pending formal defense cross-examination in hearing scheduled Sept 22.'),
('SUB-2026-003', 'EVD-004', 'CEMS-2026-003', 'District & Sessions Court, Harbor Division', '2026-06-04', 'Officer Neil Gallagher', 'SUB-HRB-409', 'Digital Multimedia Evidence', 'Accepted', 'Verified against surveillance master disk. Admitted for upcoming hearing.'),
('SUB-2026-004', 'EVD-008', 'CEMS-2026-003', 'District & Sessions Court, Harbor Division', '2026-09-14', 'Inspector Marcus Vance', 'SUB-HRB-712', 'Physical Memory Medium', 'Rejected', 'Cryptographic hash mismatch reported during intake audit. File marked rejected.');

-- -----------------------------------------------------------------------------
-- 8. SEED AUDIT ACTIVITY LOGS
-- -----------------------------------------------------------------------------
INSERT INTO `activity_logs` (`activity_id`, `timestamp`, `user`, `action`, `module`, `reference_id`, `status`, `details`) VALUES
('ACT-901', '2026-09-15 11:45:10', 'Marcus Vance', 'Evidence Verified', 'Verification Lab', 'EVD-004', 'Success', 'Recalculated SHA-256 for dockside CCTV. Hash matched 100% with original seizure record.'),
('ACT-902', '2026-09-15 10:24:00', 'Arthur Pendelton', 'Hearing Scheduled', 'Hearing Management', 'HRG-2026-01', 'Success', 'Court date confirmed for Sept 18, 2026 at Harbor Division.'),
('ACT-903', '2026-09-14 17:02:15', 'Arthur Pendelton', 'Custody Event Added', 'Chain of Custody', 'EVD-008', 'Warning', 'Submission event logged with sequence warning and hash mismatch flag.'),
('ACT-904', '2026-09-14 15:30:22', 'Sarah Jenkins', 'Evidence Viewed', 'Evidence Registry', 'EVD-003', 'Success', 'Reviewed SCADA pcap payload parameters for expert witness affidavit.'),
('ACT-905', '2026-09-12 11:20:44', 'Dr. Evelyn Reed', 'Evidence Verified', 'Verification Lab', 'EVD-001', 'Success', 'Routine weekly cryptographic integrity audit confirmed valid.'),
('ACT-906', '2026-09-10 09:15:00', 'Marcus Vance', 'Document Added', 'Document Repository', 'DOC-102', 'Success', 'Uploaded forensic laboratory report version 1.2.');

-- -----------------------------------------------------------------------------
-- 9. SEED NOTIFICATIONS
-- -----------------------------------------------------------------------------
INSERT INTO `notifications` (`notification_id`, `title`, `message`, `type`, `time_ago`, `is_unread`) VALUES
('NOTIF-01', 'Upcoming Court Hearing in 3 Days', 'State v. Sterling Logistics (CRIM-4109) hearing scheduled on Sept 18 at Harbor Division.', 'warning', '15 minutes ago', 1),
('NOTIF-02', 'Evidence Verification Anomaly Flagged', 'Integrity hash mismatch detected on physical drive EVD-008. Immediate review required.', 'danger', '2 hours ago', 1),
('NOTIF-03', 'Court Submission Accepted', 'Hon. Justice Vikramaditya Roy admitted SWIFT Blob (EVD-001) as primary exhibit P-1.', 'success', 'Yesterday', 0),
('NOTIF-04', 'New Case File Created', 'Case CEMS-2026-004 (AeroTech Dynamics v. Horizon Avionics) initialized by Clerk.', 'info', '3 days ago', 0);

-- -----------------------------------------------------------------------------
-- 10. SEED SETTINGS
-- -----------------------------------------------------------------------------
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('theme', 'dark'),
('compactMode', 'false'),
('emailNotifications', 'true'),
('custodyAlerts', 'true'),
('autoHashVerification', 'true'),
('defaultCourt', 'Metropolitan Financial Crimes Court'),
('hashAlgorithm', 'SHA-256');

SET FOREIGN_KEY_CHECKS = 1;
