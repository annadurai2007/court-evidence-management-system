/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * storage.js - Centralized LocalStorage Architecture & Realistic Mock Seed Data
 */

const StorageKeys = {
  SESSION: 'cems_session',
  USERS: 'cems_users',
  CASES: 'cems_cases',
  EVIDENCE: 'cems_evidence',
  CUSTODY: 'cems_custody',
  HEARINGS: 'cems_hearings',
  DOCUMENTS: 'cems_documents',
  SUBMISSIONS: 'cems_submissions',
  ACTIVITY: 'cems_activity',
  NOTIFICATIONS: 'cems_notifications',
  SETTINGS: 'cems_settings',
  // Backward compatibility alias
  AUTH: 'cems_session'
};

const StorageManager = {
  /**
   * Get parsed item for a key (getItem)
   */
  getItem(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`[StorageManager] Error reading key "${key}":`, e);
      return null;
    }
  },

  /**
   * Set JSON data for a key (setItem)
   */
  setItem(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`[StorageManager] Error writing key "${key}":`, e);
      return false;
    }
  },

  /**
   * Remove item from localStorage (removeItem)
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[StorageManager] Error removing key "${key}":`, e);
      return false;
    }
  },

  /**
   * Clear item or clear all CEMS data (clearItem)
   */
  clearItem(key) {
    if (key) {
      this.removeItem(key);
    } else {
      Object.values(StorageKeys).forEach(k => localStorage.removeItem(k));
    }
  },

  /**
   * Add a new item to an array stored at key (addItem)
   */
  addItem(key, item) {
    const list = this.getItem(key) || [];
    list.unshift(item); // insert newest first
    this.setItem(key, list);
    return item;
  },

  /**
   * Update an item by ID (updateItem)
   */
  updateItem(key, id, updates) {
    const list = this.getItem(key) || [];
    const index = list.findIndex(item => (
      item.id === id || 
      item.caseId === id || 
      item.evidenceId === id || 
      item.userId === id
    ));
    if (index !== -1) {
      list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
      this.setItem(key, list);
      return list[index];
    }
    return null;
  },

  /**
   * Delete an item by ID (deleteItem)
   */
  deleteItem(key, id) {
    const list = this.getItem(key) || [];
    const filtered = list.filter(item => (
      item.id !== id && 
      item.caseId !== id && 
      item.evidenceId !== id && 
      item.userId !== id
    ));
    this.setItem(key, filtered);
    return true;
  },

  /**
   * Find item by ID
   */
  findById(key, id) {
    const list = this.getItem(key) || [];
    return list.find(item => (
      item.id === id || 
      item.caseId === id || 
      item.evidenceId === id || 
      item.userId === id
    )) || null;
  },

  // Aliases for seamless API compatibility
  getData(key) { return this.getItem(key); },
  saveData(key, data) { return this.setItem(key, data); },
  addData(key, item) { return this.addItem(key, item); },
  updateData(key, id, updates) { return this.updateItem(key, id, updates); },
  deleteData(key, id) { return this.deleteItem(key, id); },
  clearData(key) { return this.clearItem(key); },

  /**
   * Initialize and seed realistic demo data if not already present
   */
  initDemoData(force = false) {
    if (force) {
      this.clearItem();
    }

    if (!localStorage.getItem(StorageKeys.USERS) || force) {
      const demoUsers = [
        {
          userId: 'USR-001',
          name: 'Hon. Arthur Pendelton',
          role: 'Court Officer',
          department: 'Metropolitan High Court, Bench III',
          email: 'arthur.court@cems.com',
          status: 'Active',
          lastLogin: '2026-09-15 10:24 AM'
        },
        {
          userId: 'USR-002',
          name: 'Special Agent Sarah Jenkins',
          role: 'Investigator',
          department: 'Cyber Crime & Digital Forensics Unit',
          email: 'sarah.cyber@cems.com',
          status: 'Active',
          lastLogin: '2026-09-15 09:12 AM'
        },
        {
          userId: 'USR-003',
          name: 'Inspector Marcus Vance',
          role: 'Evidence Officer',
          department: 'Central Evidence Vault & Repository',
          email: 'admin@cems.com',
          status: 'Active',
          lastLogin: '2026-09-15 11:45 AM'
        },
        {
          userId: 'USR-004',
          name: 'Elena Rostova, Senior Counsel',
          role: 'Advocate',
          department: 'Bar Association Panel',
          email: 'elena.counsel@cems.com',
          status: 'Active',
          lastLogin: '2026-09-14 04:30 PM'
        },
        {
          userId: 'USR-005',
          name: 'Dr. Evelyn Reed',
          role: 'Reviewer',
          department: 'State Forensic Science Laboratory',
          email: 'evelyn.forensics@cems.com',
          status: 'Active',
          lastLogin: '2026-09-15 08:00 AM'
        }
      ];
      this.setItem(StorageKeys.USERS, demoUsers);
    }

    if (!localStorage.getItem(StorageKeys.CASES) || force) {
      const demoCases = [
        {
          id: 'CEMS-2026-001',
          caseId: 'CEMS-2026-001',
          caseNumber: 'CRIM-8842/2026',
          caseTitle: 'State v. Apex Global Syndicate (FinTech Fraud)',
          caseType: 'Financial',
          courtName: 'Metropolitan Financial Crimes Court',
          courtLocation: 'Sector 4, Judicial Complex, New Delhi',
          judgeName: 'Hon. Justice Vikramaditya Roy',
          presidingOfficer: 'Arthur Pendelton',
          investigatingOfficer: 'Sarah Jenkins (Cyber Unit)',
          petitioner: 'Securities & Regulatory Commission',
          respondent: 'Apex Global Financial Services Ltd.',
          advocate: 'Elena Rostova, Sr. Advocate',
          priority: 'Critical',
          status: 'Active',
          filingDate: '2026-02-14',
          nextHearingDate: '2026-09-22',
          description: 'Multinational unauthorized algorithmic ledger manipulation and cross-border laundering of $14.2M via spoofed SWIFT tokens.'
        },
        {
          id: 'CEMS-2026-002',
          caseId: 'CEMS-2026-002',
          caseNumber: 'CYBER-1092/2026',
          caseTitle: 'State v. BlackHat Ransomware Nexus',
          caseType: 'Cyber Crime',
          courtName: 'High Court Cyber Appellate Division',
          courtLocation: 'Court Room 7, High Court Complex',
          judgeName: 'Hon. Justice Alistair Montgomery',
          presidingOfficer: 'Arthur Pendelton',
          investigatingOfficer: 'Special Agent Sarah Jenkins',
          petitioner: 'Central Infrastructure Grid Authority',
          respondent: 'Unknown Operators (Alias: ZeroPayload)',
          advocate: 'David Sterling, Esq.',
          priority: 'Critical',
          status: 'Evidence Review',
          filingDate: '2026-04-10',
          nextHearingDate: '2026-09-28',
          description: 'Infiltration and ransomware deployment against thermal power supervisory SCADA systems.'
        },
        {
          id: 'CEMS-2026-003',
          caseId: 'CEMS-2026-003',
          caseNumber: 'CRIM-4109/2026',
          caseTitle: 'Commonwealth v. Sterling Logistics (Contraband)',
          caseType: 'Criminal',
          courtName: 'District & Sessions Court, Harbor Division',
          courtLocation: 'Chamber 12, Maritime Court Annex',
          judgeName: 'Hon. Magistrate Rachel Thorne',
          presidingOfficer: 'Keith Holloway',
          investigatingOfficer: 'Inspector Marcus Vance',
          petitioner: 'Customs & Border Enforcement',
          respondent: 'Sterling Maritime Carriers LLC',
          advocate: 'Rebecca Cole, Attorney',
          priority: 'High',
          status: 'Hearing Scheduled',
          filingDate: '2026-05-19',
          nextHearingDate: '2026-09-18',
          description: 'Interception of unmanifested sealed maritime cargo containers carrying controlled high-grade precision components.'
        },
        {
          id: 'CEMS-2026-004',
          caseId: 'CEMS-2026-004',
          caseNumber: 'CIV-2319/2026',
          caseTitle: 'AeroTech Dynamics v. Horizon Avionics (IP Theft)',
          caseType: 'Property',
          courtName: 'Commercial Appellate Tribunal',
          courtLocation: 'Commercial Bench B, City Center',
          judgeName: 'Hon. Justice Robert K. Chen',
          presidingOfficer: 'Diana Ward',
          investigatingOfficer: 'Detective Ryan Gossett',
          petitioner: 'AeroTech Dynamics Corp.',
          respondent: 'Horizon Avionics International',
          advocate: 'Kavita Iyer, Patent Attorney',
          priority: 'Medium',
          status: 'Under Investigation',
          filingDate: '2026-06-02',
          nextHearingDate: '2026-10-05',
          description: 'Unauthorized exfiltration and patent infringement of next-generation turbine cooling telemetry source code.'
        },
        {
          id: 'CEMS-2026-005',
          caseId: 'CEMS-2026-005',
          caseNumber: 'CIV-9931/2025',
          caseTitle: 'Vanguard Realty Trust v. Greenfield Urban Dev',
          caseType: 'Civil',
          courtName: 'High Court Commercial Division',
          courtLocation: 'Court Room 3, Civil Wing',
          judgeName: 'Hon. Justice Meera Swaminathan',
          presidingOfficer: 'Keith Holloway',
          investigatingOfficer: 'Officer Neil Gallagher',
          petitioner: 'Vanguard Realty Trust',
          respondent: 'Greenfield Urban Developers',
          advocate: 'Siddharth Sen, Advocate',
          priority: 'Low',
          status: 'Closed',
          filingDate: '2025-11-12',
          nextHearingDate: '—',
          description: 'Dispute over commercial title deeds and forged municipal zoning sanction orders.'
        }
      ];
      this.setItem(StorageKeys.CASES, demoCases);
    }

    if (!localStorage.getItem(StorageKeys.EVIDENCE) || force) {
      const demoEvidence = [
        {
          id: 'EVD-001',
          evidenceId: 'EVD-001',
          caseId: 'CEMS-2026-001',
          evidenceName: 'SWIFT Server Audit Trail & Encrypted Blob',
          evidenceType: 'Financial Record',
          description: 'Master binary transaction log file extracted from primary gateway server at Apex Data Center showing manipulated timestamps.',
          collectedBy: 'Sarah Jenkins (Cyber Unit)',
          collectionDate: '2026-02-18',
          collectionTime: '14:35',
          collectionLocation: 'Apex Financial Data Center, Rack 14B',
          source: 'Forensic clone from Dell PowerEdge R750',
          fileName: 'swift_gateway_audit_raw.bin',
          fileSize: '412.8 MB',
          hashAlgorithm: 'SHA-256',
          hashValue: '8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4',
          originalHash: '8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4',
          currentHash: '8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4',
          verificationStatus: 'VERIFIED',
          courtStatus: 'Admitted',
          lastVerified: '2026-09-12 11:20 AM',
          notes: 'Admitted by Hon. Justice Vikramaditya Roy into primary trial evidence.'
        },
        {
          id: 'EVD-002',
          evidenceId: 'EVD-002',
          caseId: 'CEMS-2026-001',
          evidenceName: 'Encrypted USB Cold Wallet Recovered at Airport',
          evidenceType: 'Physical Document',
          description: 'Ledger Nano X hardware crypto wallet seized during suspect baggage search with tamper-evident seal #TE-99214.',
          collectedBy: 'Inspector Marcus Vance',
          collectionDate: '2026-02-20',
          collectionTime: '06:15',
          collectionLocation: 'International Terminal 3, Baggage Inspection Zone',
          source: 'Physical Seizure under Court Warrant #CW-2026-44',
          fileName: 'ledger_hardware_dump_image.dd',
          fileSize: '1.2 GB',
          hashAlgorithm: 'SHA-256',
          hashValue: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
          originalHash: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
          currentHash: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
          verificationStatus: 'VERIFIED',
          courtStatus: 'Submitted',
          lastVerified: '2026-09-14 03:45 PM',
          notes: 'Physical custody held in vault locker B-04. Digital image submitted to court clerk.'
        },
        {
          id: 'EVD-003',
          evidenceId: 'EVD-003',
          caseId: 'CEMS-2026-002',
          evidenceName: 'SCADA Telemetry PCAP Packet Capture',
          evidenceType: 'CCTV Footage',
          description: 'Network packet capture showing beaconing to command & control IP 185.220.101.5 during power station outage.',
          collectedBy: 'Sarah Jenkins (Cyber Unit)',
          collectionDate: '2026-04-12',
          collectionTime: '23:10',
          collectionLocation: 'Thermal Grid Substation Control Room Alpha',
          source: 'Core Cisco Catalyst Switch Port Mirroring SPAN',
          fileName: 'scada_incident_traffic_stream.pcapng',
          fileSize: '89.4 MB',
          hashAlgorithm: 'SHA-256',
          hashValue: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
          originalHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
          currentHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
          verificationStatus: 'VERIFIED',
          courtStatus: 'Under Review',
          lastVerified: '2026-09-10 16:00 PM',
          notes: 'Forensic analysis completed by Dr. Evelyn Reed. Ready for next evidentiary hearing.'
        },
        {
          id: 'EVD-004',
          evidenceId: 'EVD-004',
          caseId: 'CEMS-2026-003',
          evidenceName: 'Dockside CCTV Security DVR Footage (4K)',
          evidenceType: 'CCTV Footage',
          description: 'High-definition video showing unauthorized night offloading of container MSKU-998124 at Berth 11.',
          collectedBy: 'Officer Neil Gallagher',
          collectionDate: '2026-05-20',
          collectionTime: '03:40',
          collectionLocation: 'Port Authority Security Operations Center',
          source: 'Hikvision NVR Channel 04 Export',
          fileName: 'berth11_security_feed_20260520.mp4',
          fileSize: '4.8 GB',
          hashAlgorithm: 'SHA-256',
          hashValue: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          originalHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          currentHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
          verificationStatus: 'VERIFIED',
          courtStatus: 'Submitted',
          lastVerified: '2026-09-15 08:30 AM',
          notes: 'Time synchronization confirmed against atomic clock telemetry.'
        },
        {
          id: 'EVD-005',
          evidenceId: 'EVD-005',
          caseId: 'CEMS-2026-004',
          evidenceName: 'Exfiltrated CAD Blueprint Schematics (PDF)',
          evidenceType: 'Digital Document',
          description: 'Proprietary vector schematics of ceramic turbine fan assembly discovered on suspect cloud staging server.',
          collectedBy: 'Detective Ryan Gossett',
          collectionDate: '2026-06-08',
          collectionTime: '17:20',
          collectionLocation: 'Digital Forensic Workstation 02',
          source: 'AWS S3 Bucket Forensics under subpoena',
          fileName: 'aerotech_turbine_c3_cad_export.pdf',
          fileSize: '18.4 MB',
          hashAlgorithm: 'SHA-256',
          hashValue: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
          originalHash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
          currentHash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
          verificationStatus: 'VERIFIED',
          courtStatus: 'Registered',
          lastVerified: '2026-09-01 10:15 AM',
          notes: 'Pending initial cross-examination review by defense counsel.'
        },
        {
          id: 'EVD-006',
          evidenceId: 'EVD-006',
          caseId: 'CEMS-2026-001',
          evidenceName: 'Suspicious Email Thread Archive (MBOX)',
          evidenceType: 'Email',
          description: 'Full unredacted email thread between Chief Financial Officer and offshore shell intermediary.',
          collectedBy: 'Sarah Jenkins (Cyber Unit)',
          collectionDate: '2026-02-25',
          collectionTime: '11:00',
          collectionLocation: 'Apex Corporate HQ, Floor 18',
          source: 'Microsoft Exchange Server Export',
          fileName: 'cfo_apex_correspondence_archive.mbox',
          fileSize: '64.1 MB',
          hashAlgorithm: 'SHA-256',
          hashValue: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          originalHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          currentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          verificationStatus: 'VERIFIED',
          courtStatus: 'Admitted',
          lastVerified: '2026-09-08 14:10 PM',
          notes: 'Admitted as Exhibit C in preliminary examination.'
        },
        {
          id: 'EVD-007',
          evidenceId: 'EVD-007',
          caseId: 'CEMS-2026-005',
          evidenceName: 'Forged Municipal Title Deed Document',
          evidenceType: 'Physical Document',
          description: 'Original parchment document bearing simulated municipal seal and fabricated notary stamp.',
          collectedBy: 'Officer Neil Gallagher',
          collectionDate: '2025-11-20',
          collectionTime: '15:30',
          collectionLocation: 'Land Registry Office, Counter 4',
          source: 'Registry archival impound',
          fileName: 'municipal_deed_scan_300dpi.tiff',
          fileSize: '45.0 MB',
          hashAlgorithm: 'SHA-256',
          hashValue: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
          originalHash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
          currentHash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
          verificationStatus: 'VERIFIED',
          courtStatus: 'Archived',
          lastVerified: '2026-01-15 11:00 AM',
          notes: 'Case disposed. Physical evidence archived in Long-term Judicial Records.'
        },
        {
          id: 'EVD-008',
          evidenceId: 'EVD-008',
          caseId: 'CEMS-2026-003',
          evidenceName: 'Unverified Corrupted USB Flash Drive',
          evidenceType: 'Computer Data',
          description: 'Damaged flash memory stick found in suspect vehicle with partial bit-rot.',
          collectedBy: 'Inspector Marcus Vance',
          collectionDate: '2026-05-22',
          collectionTime: '18:10',
          collectionLocation: 'Impound Lot 3',
          source: 'Glove compartment search',
          fileName: 'corrupted_dump_0522.raw',
          fileSize: '32.0 MB',
          hashAlgorithm: 'SHA-256',
          hashValue: 'cb8379ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5b34',
          originalHash: 'cb8379ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5b34',
          currentHash: 'ffff79ac2098aa165029e3938a51da0bcecfc008fd6795f401178647f96c5000',
          verificationStatus: 'MISMATCH',
          courtStatus: 'Rejected',
          lastVerified: '2026-09-14 17:00 PM',
          notes: 'Cryptographic hash mismatch detected during laboratory integrity audit. Flagged as rejected.'
        }
      ];
      this.setItem(StorageKeys.EVIDENCE, demoEvidence);
    }

    if (!localStorage.getItem(StorageKeys.CUSTODY) || force) {
      const demoCustody = [
        {
          id: 'CUST-001',
          evidenceId: 'EVD-001',
          date: '2026-02-18',
          time: '14:35',
          officer: 'Sarah Jenkins',
          action: 'Evidence Collected',
          fromLocation: 'Apex Financial Data Center, Server Rack 14B',
          toLocation: 'Cyber Forensics Mobile Lab Unit 1',
          reason: 'Initial physical seizure and bit-stream disk acquisition under Judicial Warrant #CW-2026-44',
          notes: 'Tamper-evident forensic bag #TB-8801 applied and signed by lead investigator.'
        },
        {
          id: 'CUST-002',
          evidenceId: 'EVD-001',
          date: '2026-02-18',
          time: '17:40',
          officer: 'Sarah Jenkins',
          action: 'Evidence Registered',
          fromLocation: 'Cyber Forensics Mobile Lab Unit 1',
          toLocation: 'CEMS Digital Evidence Repository',
          reason: 'Cryptographic SHA-256 hashing and ingestion into master evidence catalog',
          notes: 'Hash verified immediately upon arrival: 8f4343...aa4.'
        },
        {
          id: 'CUST-003',
          evidenceId: 'EVD-001',
          date: '2026-02-19',
          time: '09:15',
          officer: 'Marcus Vance',
          action: 'Evidence Stored',
          fromLocation: 'CEMS Intake Desk',
          toLocation: 'Central Evidence Vault, Sector B, Locker 14',
          reason: 'Secure storage pending forensic laboratory analysis request',
          notes: 'Temperature and biometric access controlled room.'
        },
        {
          id: 'CUST-004',
          evidenceId: 'EVD-001',
          date: '2026-02-24',
          time: '11:00',
          officer: 'Dr. Evelyn Reed',
          action: 'Evidence Transferred',
          fromLocation: 'Central Evidence Vault Locker 14',
          toLocation: 'State Forensic Science Laboratory, Digital Section',
          reason: 'Deep heuristic reverse-engineering of ledger transaction routines',
          notes: 'Digital read-only forensic write-blocker utilized.'
        },
        {
          id: 'CUST-005',
          evidenceId: 'EVD-001',
          date: '2026-03-05',
          time: '15:20',
          officer: 'Dr. Evelyn Reed',
          action: 'Evidence Reviewed',
          fromLocation: 'State Forensic Science Laboratory',
          toLocation: 'Central Evidence Vault Locker 14',
          reason: 'Forensic examination complete; certified expert witness report issued',
          notes: 'Integrity re-verified against baseline SHA-256 without variance.'
        },
        {
          id: 'CUST-006',
          evidenceId: 'EVD-001',
          date: '2026-03-20',
          time: '10:00',
          officer: 'Arthur Pendelton',
          action: 'Evidence Submitted to Court',
          fromLocation: 'Central Evidence Vault Locker 14',
          toLocation: 'Metropolitan Financial Crimes Court, Bench III Record Room',
          reason: 'Formal legal submission for preliminary admissibility hearing',
          notes: 'Official Court Receipt #CR-8821 acknowledged by Court Clerk.'
        },
        {
          id: 'CUST-007',
          evidenceId: 'EVD-001',
          date: '2026-04-02',
          time: '11:30',
          officer: 'Hon. Justice Vikramaditya Roy',
          action: 'Evidence Admitted',
          fromLocation: 'Court Room 3 Judicial Bench',
          toLocation: 'Admitted Evidence Judicial Strongroom',
          reason: 'Marked as Prosecution Exhibit P-1; objections by defense overruled',
          notes: 'Entered into official judicial trial record.'
        },
        {
          id: 'CUST-008',
          evidenceId: 'EVD-002',
          date: '2026-02-20',
          time: '06:15',
          officer: 'Marcus Vance',
          action: 'Evidence Collected',
          fromLocation: 'Terminal 3 International Baggage Screening',
          toLocation: 'Airport Police Custody Annex',
          reason: 'Confiscated during passenger bag inspection under customs warrant',
          notes: 'Device placed in Faraday electromagnetic shield bag #FD-109.'
        },
        {
          id: 'CUST-009',
          evidenceId: 'EVD-002',
          date: '2026-02-20',
          time: '10:45',
          officer: 'Marcus Vance',
          action: 'Evidence Registered',
          fromLocation: 'Airport Police Custody Annex',
          toLocation: 'Central Evidence Vault',
          reason: 'Serial number and physical barcode logging',
          notes: 'Signed handover receipt #HR-441.'
        },
        {
          id: 'CUST-010',
          evidenceId: 'EVD-002',
          date: '2026-03-01',
          time: '14:00',
          officer: 'Marcus Vance',
          action: 'Evidence Submitted to Court',
          fromLocation: 'Central Evidence Vault',
          toLocation: 'Court Clerk Evidence Desk',
          reason: 'Submitted for verification by judicial handwriting and forensics master',
          notes: 'Pending final admissibility arguments.'
        },
        {
          id: 'CUST-011',
          evidenceId: 'EVD-008',
          date: '2026-05-22',
          time: '18:10',
          officer: 'Marcus Vance',
          action: 'Evidence Collected',
          fromLocation: 'Suspect Glove Compartment',
          toLocation: 'Local Precinct Evidence Room',
          reason: 'Discovered during inventory search',
          notes: 'No Faraday shielding applied at point of collection.'
        },
        {
          id: 'CUST-012',
          evidenceId: 'EVD-008',
          date: '2026-09-14',
          time: '17:00',
          officer: 'Arthur Pendelton',
          action: 'Evidence Submitted to Court',
          fromLocation: 'Local Precinct Evidence Room',
          toLocation: 'District Court Evidence Registry',
          reason: 'Direct court delivery attempting to bypass certified laboratory verification',
          notes: 'Hash check produced mismatch! Sequence gap: missed proper Storage & Lab Review.'
        }
      ];
      this.setItem(StorageKeys.CUSTODY, demoCustody);
    }

    if (!localStorage.getItem(StorageKeys.HEARINGS) || force) {
      const demoHearings = [
        {
          id: 'HRG-2026-01',
          caseId: 'CEMS-2026-003',
          court: 'District & Sessions Court, Harbor Division',
          judge: 'Hon. Magistrate Rachel Thorne',
          hearingDate: '2026-09-18',
          hearingTime: '10:30 AM',
          hearingType: 'Evidence Hearing',
          purpose: 'Examination of Port Authority CCTV footage and witness testimony of Crane Operator.',
          status: 'Scheduled'
        },
        {
          id: 'HRG-2026-02',
          caseId: 'CEMS-2026-001',
          court: 'Metropolitan Financial Crimes Court',
          judge: 'Hon. Justice Vikramaditya Roy',
          hearingDate: '2026-09-22',
          hearingTime: '02:00 PM',
          hearingType: 'Trial',
          purpose: 'Cross-examination of forensic audit lead Dr. Evelyn Reed regarding SWIFT blob authenticity.',
          status: 'Scheduled'
        },
        {
          id: 'HRG-2026-03',
          caseId: 'CEMS-2026-002',
          court: 'High Court Cyber Appellate Division',
          judge: 'Hon. Justice Alistair Montgomery',
          hearingDate: '2026-09-28',
          hearingTime: '11:00 AM',
          hearingType: 'Preliminary Hearing',
          purpose: 'Admissibility review of extraterritorial server traffic logs and cyber jurisdiction.',
          status: 'Scheduled'
        },
        {
          id: 'HRG-2026-04',
          caseId: 'CEMS-2026-004',
          court: 'Commercial Appellate Tribunal',
          judge: 'Hon. Justice Robert K. Chen',
          hearingDate: '2026-10-05',
          hearingTime: '11:30 AM',
          hearingType: 'Final Hearing',
          purpose: 'Final arguments on patent infringement damages and permanent injunction.',
          status: 'Scheduled'
        },
        {
          id: 'HRG-2026-05',
          caseId: 'CEMS-2026-001',
          court: 'Metropolitan Financial Crimes Court',
          judge: 'Hon. Justice Vikramaditya Roy',
          hearingDate: '2026-04-02',
          hearingTime: '10:00 AM',
          hearingType: 'Preliminary Hearing',
          purpose: 'Initial bail plea hearing and framing of financial conspiracy charges.',
          status: 'Completed'
        }
      ];
      this.setItem(StorageKeys.HEARINGS, demoHearings);
    }

    if (!localStorage.getItem(StorageKeys.DOCUMENTS) || force) {
      const demoDocuments = [
        {
          id: 'DOC-101',
          caseId: 'CEMS-2026-001',
          documentName: 'First Information Report (FIR-992/2026)',
          documentType: 'FIR',
          uploadedBy: 'Inspector Marcus Vance',
          date: '2026-02-14',
          version: 'v1.0',
          status: 'Verified',
          fileSize: '2.4 MB'
        },
        {
          id: 'DOC-102',
          caseId: 'CEMS-2026-001',
          documentName: 'Forensic Laboratory Integrity Certificate (FSL-551)',
          documentType: 'Forensic Report',
          uploadedBy: 'Dr. Evelyn Reed',
          date: '2026-03-06',
          version: 'v1.2',
          status: 'Verified',
          fileSize: '5.1 MB'
        },
        {
          id: 'DOC-103',
          caseId: 'CEMS-2026-001',
          documentName: 'Judicial Search & Seizure Warrant (CW-2026-44)',
          documentType: 'Court Orders',
          uploadedBy: 'Arthur Pendelton',
          date: '2026-02-16',
          version: 'v1.0',
          status: 'Admitted',
          fileSize: '1.8 MB'
        },
        {
          id: 'DOC-104',
          caseId: 'CEMS-2026-002',
          documentName: 'SCADA Intrusion Incident Response Debrief',
          documentType: 'Evidence Report',
          uploadedBy: 'Sarah Jenkins',
          date: '2026-04-18',
          version: 'v2.0',
          status: 'Pending Review',
          fileSize: '14.6 MB'
        },
        {
          id: 'DOC-105',
          caseId: 'CEMS-2026-003',
          documentName: 'Harbor Security Camera Calibration Affidavit',
          documentType: 'Affidavit',
          uploadedBy: 'Officer Neil Gallagher',
          date: '2026-05-25',
          version: 'v1.0',
          status: 'Verified',
          fileSize: '950 KB'
        },
        {
          id: 'DOC-106',
          caseId: 'CEMS-2026-001',
          documentName: 'Charge Sheet filed under Section 420/120B (CS-14)',
          documentType: 'Charge Sheet',
          uploadedBy: 'Elena Rostova, Sr. Advocate',
          date: '2026-03-15',
          version: 'v1.0',
          status: 'Admitted',
          fileSize: '8.2 MB'
        }
      ];
      this.setItem(StorageKeys.DOCUMENTS, demoDocuments);
    }

    if (!localStorage.getItem(StorageKeys.SUBMISSIONS) || force) {
      const demoSubmissions = [
        {
          id: 'SUB-2026-001',
          evidenceId: 'EVD-001',
          caseId: 'CEMS-2026-001',
          court: 'Metropolitan Financial Crimes Court',
          submissionDate: '2026-03-20',
          submittedBy: 'Arthur Pendelton',
          submissionReference: 'CR-8821/2026',
          submissionType: 'Prosecution Exhibit',
          status: 'Accepted',
          notes: 'Admitted into record by Judge Vikramaditya Roy after integrity verification.'
        },
        {
          id: 'SUB-2026-002',
          evidenceId: 'EVD-002',
          caseId: 'CEMS-2026-001',
          court: 'Metropolitan Financial Crimes Court',
          submissionDate: '2026-03-28',
          submittedBy: 'Inspector Marcus Vance',
          submissionReference: 'CR-8890/2026',
          submissionType: 'Physical Vault Deposition',
          status: 'Submitted',
          notes: 'Pending formal defense cross-examination in hearing scheduled Sept 22.'
        },
        {
          id: 'SUB-2026-003',
          evidenceId: 'EVD-004',
          caseId: 'CEMS-2026-003',
          court: 'District & Sessions Court, Harbor Division',
          submissionDate: '2026-06-04',
          submittedBy: 'Officer Neil Gallagher',
          submissionReference: 'SUB-HRB-409',
          submissionType: 'Digital Multimedia Evidence',
          status: 'Accepted',
          notes: 'Verified against surveillance master disk. Admitted for upcoming hearing.'
        },
        {
          id: 'SUB-2026-004',
          evidenceId: 'EVD-008',
          caseId: 'CEMS-2026-003',
          court: 'District & Sessions Court, Harbor Division',
          submissionDate: '2026-09-14',
          submittedBy: 'Inspector Marcus Vance',
          submissionReference: 'SUB-HRB-712',
          submissionType: 'Physical Memory Medium',
          status: 'Rejected',
          notes: 'Cryptographic hash mismatch reported during intake audit. File marked rejected.'
        }
      ];
      this.setItem(StorageKeys.SUBMISSIONS, demoSubmissions);
    }

    if (!localStorage.getItem(StorageKeys.ACTIVITY) || force) {
      const demoActivity = [
        {
          id: 'ACT-901',
          timestamp: '2026-09-15 11:45:10',
          user: 'Marcus Vance',
          action: 'Evidence Verified',
          module: 'Verification Lab',
          referenceId: 'EVD-004',
          status: 'Success',
          details: 'Recalculated SHA-256 for dockside CCTV. Hash matched 100% with original seizure record.'
        },
        {
          id: 'ACT-902',
          timestamp: '2026-09-15 10:24:00',
          user: 'Arthur Pendelton',
          action: 'Hearing Scheduled',
          module: 'Hearing Management',
          referenceId: 'HRG-2026-01',
          status: 'Success',
          details: 'Court date confirmed for Sept 18, 2026 at Harbor Division.'
        },
        {
          id: 'ACT-903',
          timestamp: '2026-09-14 17:02:15',
          user: 'Arthur Pendelton',
          action: 'Custody Event Added',
          module: 'Chain of Custody',
          referenceId: 'EVD-008',
          status: 'Warning',
          details: 'Submission event logged with sequence warning and hash mismatch flag.'
        },
        {
          id: 'ACT-904',
          timestamp: '2026-09-14 15:30:22',
          user: 'Sarah Jenkins',
          action: 'Evidence Viewed',
          module: 'Evidence Registry',
          referenceId: 'EVD-003',
          status: 'Success',
          details: 'Reviewed SCADA pcap payload parameters for expert witness affidavit.'
        },
        {
          id: 'ACT-905',
          timestamp: '2026-09-12 11:20:44',
          user: 'Dr. Evelyn Reed',
          action: 'Evidence Verified',
          module: 'Verification Lab',
          referenceId: 'EVD-001',
          status: 'Success',
          details: 'Routine weekly cryptographic integrity audit confirmed valid.'
        },
        {
          id: 'ACT-906',
          timestamp: '2026-09-10 09:15:00',
          user: 'Marcus Vance',
          action: 'Document Added',
          module: 'Document Repository',
          referenceId: 'DOC-102',
          status: 'Success',
          details: 'Uploaded forensic laboratory report version 1.2.'
        }
      ];
      this.setItem(StorageKeys.ACTIVITY, demoActivity);
    }

    if (!localStorage.getItem(StorageKeys.NOTIFICATIONS) || force) {
      const demoNotifications = [
        {
          id: 'NOTIF-01',
          title: 'Upcoming Court Hearing in 3 Days',
          message: 'State v. Sterling Logistics (CRIM-4109) hearing scheduled on Sept 18 at Harbor Division.',
          type: 'warning',
          time: '15 minutes ago',
          unread: true
        },
        {
          id: 'NOTIF-02',
          title: 'Evidence Verification Anomaly Flagged',
          message: 'Integrity hash mismatch detected on physical drive EVD-008. Immediate review required.',
          type: 'danger',
          time: '2 hours ago',
          unread: true
        },
        {
          id: 'NOTIF-03',
          title: 'Court Submission Accepted',
          message: 'Hon. Justice Vikramaditya Roy admitted SWIFT Blob (EVD-001) as primary exhibit P-1.',
          type: 'success',
          time: 'Yesterday',
          unread: false
        },
        {
          id: 'NOTIF-04',
          title: 'New Case File Created',
          message: 'Case CEMS-2026-004 (AeroTech Dynamics v. Horizon Avionics) initialized by Clerk.',
          type: 'info',
          time: '3 days ago',
          unread: false
        }
      ];
      this.setItem(StorageKeys.NOTIFICATIONS, demoNotifications);
    }

    if (!localStorage.getItem(StorageKeys.SETTINGS) || force) {
      const defaultSettings = {
        theme: 'dark',
        compactMode: false,
        emailNotifications: true,
        custodyAlerts: true,
        autoHashVerification: true,
        defaultCourt: 'Metropolitan Financial Crimes Court',
        hashAlgorithm: 'SHA-256'
      };
      this.setItem(StorageKeys.SETTINGS, defaultSettings);
    }
  }
};

// Seed on module evaluation if storage is clean
StorageManager.initDemoData(false);

// Export for global browser window usage
window.StorageKeys = StorageKeys;
window.StorageManager = StorageManager;
