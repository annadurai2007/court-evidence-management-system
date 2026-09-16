/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * api.js - Dual-Mode REST Client with LocalStorage Fallback
 * 
 * ARCHITECTURE:
 * 1. LIVE MODE (Default when backend is running):
 *    Direct REST API communication with Python Flask backend (http://127.0.0.1:5000/api)
 *    and MySQL database, using JWT Bearer authentication.
 * 2. STANDALONE DEMO MODE (Automatic Fallback):
 *    If the backend is offline, unreachable, or deployed statically without Flask,
 *    this layer automatically and seamlessly falls back to LocalStorage (StorageManager),
 *    ensuring zero crashes and 100% functionality everywhere (including Netlify).
 */

const API_CONFIG = {
  baseUrl: (window.CEMS_CONFIG && window.CEMS_CONFIG.apiUrl) || 
           window.CEMS_API_URL || 
           (localStorage.getItem('cems_api_url')) ||
           (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
             ? 'http://127.0.0.1:5000/api' 
             : 'https://cems-backend-0tk3.onrender.com/api'),
  timeoutMs: 4000,
  isOnline: null,
  enableDemoFallback: (window.CEMS_CONFIG ? window.CEMS_CONFIG.enableDemoFallback : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
};

const api = {
  config: API_CONFIG,

  // =========================================================================
  // HTTP CLIENT & HEALTH MONITOR
  // =========================================================================

  _getToken() {
    return localStorage.getItem('cems_jwt_token') || null;
  },

  _setToken(token) {
    if (token) {
      localStorage.setItem('cems_jwt_token', token);
    } else {
      localStorage.removeItem('cems_jwt_token');
    }
  },

  /**
   * Check backend health and notify listeners
   */
  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      
      const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        API_CONFIG.isOnline = (data.database === 'connected');
      } else {
        API_CONFIG.isOnline = false;
      }
    } catch (e) {
      API_CONFIG.isOnline = false;
    }

    // Dispatch status event for UI badges
    try {
      window.dispatchEvent(new CustomEvent('cems:backend-status', {
        detail: { isOnline: API_CONFIG.isOnline, url: API_CONFIG.baseUrl }
      }));
    } catch (e) {}

    return API_CONFIG.isOnline;
  },

  /**
   * Low-level fetch wrapper with Bearer token and timeout
   */
  async _fetch(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const token = this._getToken();

    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = json?.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errMsg);
      }

      API_CONFIG.isOnline = true;
      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      const isNetworkFail = (err.name === 'AbortError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed'));

      if (isNetworkFail) {
        API_CONFIG.isOnline = false;

        // Dispatch status event so UI turns into offline warning state
        try {
          window.dispatchEvent(new CustomEvent('cems:backend-status', {
            detail: { isOnline: false, error: err.message, url: url }
          }));
        } catch (e) {}

        // In production (or when demo fallback is disabled), do not hide server errors!
        if (!API_CONFIG.enableDemoFallback) {
          const userMsg = `Backend Server Unavailable: Cannot reach ${API_CONFIG.baseUrl}. Please verify your API URL or backend hosting deployment.`;
          if (window.Utils && typeof window.Utils.showToast === 'function') {
            window.Utils.showToast(userMsg, 'error', 'API Server Offline');
          }
          throw new Error(userMsg);
        }

        console.warn(`[CEMS Dev Notice] Backend unreachable at ${url}. Operating in local demo mode.`);
        return null; // Signals caller to invoke fallback in local development
      }

      // Re-throw genuine server response errors (400, 401, 404, 500)
      throw err;
    }
  },

  _simulateNetwork(data, error = null) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(JSON.parse(JSON.stringify(data)));
        }
      }, 40);
    });
  },

  // =========================================================================
  // AUTHENTICATION
  // =========================================================================

  async login(email, password) {
    // 1. Try Flask REST API
    try {
      const res = await this._fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res && res.success && res.data) {
        this._setToken(res.data.token);
        const session = {
          ...res.data.user,
          token: res.data.token,
          loginAt: new Date().toISOString()
        };
        StorageManager.saveData(StorageKeys.AUTH, session);
        return { success: true, user: session };
      }
    } catch (apiErr) {
      // If it was an explicit invalid credentials error from backend, propagate it
      if (API_CONFIG.isOnline) {
        throw apiErr;
      }
    }

    // 2. Fallback to LocalStorage
    const users = StorageManager.getData(StorageKeys.USERS) || [];
    const validUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if ((email === 'admin@cems.com' && password === 'admin123') || (validUser && password === 'admin123')) {
      const authUser = validUser || {
        userId: 'USR-003',
        name: 'Inspector Marcus Vance',
        role: 'Evidence Officer',
        department: 'Central Evidence Vault & Repository',
        email: email
      };

      const session = {
        token: 'demo-jwt-cems-' + Date.now(),
        ...authUser,
        loginAt: new Date().toISOString()
      };

      this._setToken(session.token);
      StorageManager.saveData(StorageKeys.AUTH, session);
      Utils.logActivity('User Login', 'Authentication', authUser.userId, 'Success', `Demo session created for ${authUser.name}`);
      return this._simulateNetwork({ success: true, user: session });
    }

    return this._simulateNetwork(null, 'Invalid email or password. Use demo credentials: admin@cems.com / admin123');
  },

  async logout() {
    try {
      await this._fetch('/auth/logout', { method: 'POST' });
    } catch (e) {}

    this._setToken(null);
    const session = StorageManager.getData(StorageKeys.AUTH);
    if (session) {
      Utils.logActivity('User Logout', 'Authentication', session.userId, 'Success', `Session terminated for ${session.name}`);
    }
    StorageManager.clearData(StorageKeys.AUTH);
    return { success: true };
  },

  async getCurrentUser() {
    try {
      const res = await this._fetch('/auth/me', { method: 'GET' });
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {}

    const session = StorageManager.getData(StorageKeys.AUTH);
    return this._simulateNetwork(session);
  },

  // =========================================================================
  // CASE MANAGEMENT
  // =========================================================================

  async getCases(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.caseType && filters.caseType !== 'All') params.append('caseType', filters.caseType);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);

    const queryStr = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await this._fetch(`/cases${queryStr}`, { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {}

    // Fallback: LocalStorage
    let cases = StorageManager.getData(StorageKeys.CASES) || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      cases = cases.filter(c =>
        (c.caseId && c.caseId.toLowerCase().includes(q)) ||
        (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) ||
        (c.caseTitle && c.caseTitle.toLowerCase().includes(q)) ||
        (c.courtName && c.courtName.toLowerCase().includes(q)) ||
        (c.judgeName && c.judgeName.toLowerCase().includes(q)) ||
        (c.petitioner && c.petitioner.toLowerCase().includes(q)) ||
        (c.respondent && c.respondent.toLowerCase().includes(q))
      );
    }
    if (filters.caseType && filters.caseType !== 'All') {
      cases = cases.filter(c => c.caseType === filters.caseType);
    }
    if (filters.status && filters.status !== 'All') {
      cases = cases.filter(c => c.status === filters.status);
    }
    if (filters.priority && filters.priority !== 'All') {
      cases = cases.filter(c => c.priority === filters.priority);
    }

    return this._simulateNetwork(cases);
  },

  async getCase(id) {
    try {
      const res = await this._fetch(`/cases/${encodeURIComponent(id)}`, { method: 'GET' });
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {}

    const item = StorageManager.findById(StorageKeys.CASES, id);
    if (!item) return this._simulateNetwork(null, `Case ${id} not found`);
    return this._simulateNetwork(item);
  },

  async getCaseById(id) {
    return this.getCase(id);
  },

  async createCase(caseData) {
    try {
      const res = await this._fetch('/cases', {
        method: 'POST',
        body: JSON.stringify(caseData)
      });
      if (res && res.success && res.data) {
        // Also keep local fallback synced
        StorageManager.addData(StorageKeys.CASES, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    // Fallback: LocalStorage
    const cases = StorageManager.getData(StorageKeys.CASES) || [];
    const newId = caseData.caseId || `CEMS-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, '0')}`;
    const newCase = {
      id: newId,
      caseId: newId,
      ...caseData,
      createdAt: new Date().toISOString()
    };
    StorageManager.addData(StorageKeys.CASES, newCase);
    Utils.logActivity('Case Created', 'Case Management', newId, 'Success', `New legal case "${newCase.caseTitle}" registered.`);
    return this._simulateNetwork(newCase);
  },

  async updateCase(id, caseData) {
    try {
      const res = await this._fetch(`/cases/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(caseData)
      });
      if (res && res.success && res.data) {
        StorageManager.updateData(StorageKeys.CASES, id, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    const updated = StorageManager.updateData(StorageKeys.CASES, id, caseData);
    if (!updated) return this._simulateNetwork(null, `Case ${id} could not be updated`);
    Utils.logActivity('Case Updated', 'Case Management', id, 'Success', `Case record ${id} modified.`);
    return this._simulateNetwork(updated);
  },

  async deleteCase(id) {
    try {
      const res = await this._fetch(`/cases/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res && res.success) {
        StorageManager.deleteData(StorageKeys.CASES, id);
        return { success: true, id };
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    StorageManager.deleteData(StorageKeys.CASES, id);
    Utils.logActivity('Case Deleted', 'Case Management', id, 'Warning', `Demo case ${id} removed.`);
    return this._simulateNetwork({ success: true, id });
  },

  // =========================================================================
  // EVIDENCE MANAGEMENT
  // =========================================================================

  async getEvidence(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.caseId && filters.caseId !== 'All') params.append('caseId', filters.caseId);
    if (filters.evidenceType && filters.evidenceType !== 'All') params.append('evidenceType', filters.evidenceType);
    if (filters.courtStatus && filters.courtStatus !== 'All') params.append('courtStatus', filters.courtStatus);
    if (filters.verificationStatus && filters.verificationStatus !== 'All') params.append('verificationStatus', filters.verificationStatus);

    const queryStr = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await this._fetch(`/evidence${queryStr}`, { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {}

    // Fallback: LocalStorage
    let evidence = StorageManager.getData(StorageKeys.EVIDENCE) || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      evidence = evidence.filter(e =>
        (e.evidenceId && e.evidenceId.toLowerCase().includes(q)) ||
        (e.caseId && e.caseId.toLowerCase().includes(q)) ||
        (e.evidenceName && e.evidenceName.toLowerCase().includes(q)) ||
        (e.fileName && e.fileName.toLowerCase().includes(q)) ||
        (e.collectedBy && e.collectedBy.toLowerCase().includes(q)) ||
        (e.hashValue && e.hashValue.toLowerCase().includes(q))
      );
    }
    if (filters.caseId) {
      evidence = evidence.filter(e => e.caseId === filters.caseId);
    }
    if (filters.evidenceType && filters.evidenceType !== 'All') {
      evidence = evidence.filter(e => e.evidenceType === filters.evidenceType);
    }
    if (filters.courtStatus && filters.courtStatus !== 'All') {
      evidence = evidence.filter(e => e.courtStatus === filters.courtStatus);
    }
    if (filters.verificationStatus && filters.verificationStatus !== 'All') {
      evidence = evidence.filter(e => e.verificationStatus === filters.verificationStatus);
    }

    return this._simulateNetwork(evidence);
  },

  async getEvidenceById(id) {
    try {
      const res = await this._fetch(`/evidence/${encodeURIComponent(id)}`, { method: 'GET' });
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {}

    const item = StorageManager.findById(StorageKeys.EVIDENCE, id);
    if (!item) return this._simulateNetwork(null, `Evidence ${id} not found`);
    return this._simulateNetwork(item);
  },

  async getEvidenceItem(id) {
    return this.getEvidenceById(id);
  },

  async createEvidence(evidenceData, fileObj = null) {
    try {
      let bodyData;
      let headers = {};

      if (fileObj) {
        const formData = new FormData();
        formData.append('file', fileObj);
        Object.keys(evidenceData).forEach(k => {
          if (evidenceData[k] !== undefined && evidenceData[k] !== null) {
            formData.append(k, evidenceData[k]);
          }
        });
        bodyData = formData;
      } else {
        bodyData = JSON.stringify(evidenceData);
      }

      const res = await this._fetch('/evidence', {
        method: 'POST',
        body: bodyData,
        headers
      });

      if (res && res.success && res.data) {
        StorageManager.addData(StorageKeys.EVIDENCE, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    // Fallback: LocalStorage
    const evidenceList = StorageManager.getData(StorageKeys.EVIDENCE) || [];
    const newId = evidenceData.evidenceId || `EVD-${String(evidenceList.length + 1).padStart(3, '0')}`;
    const newEvidence = {
      id: newId,
      evidenceId: newId,
      hashAlgorithm: 'SHA-256',
      verificationStatus: 'VERIFIED',
      courtStatus: evidenceData.courtStatus || 'Registered',
      lastVerified: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...evidenceData,
      createdAt: new Date().toISOString()
    };
    StorageManager.addData(StorageKeys.EVIDENCE, newEvidence);

    // Initial custody event
    const custodyRecord = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      evidenceId: newId,
      date: newEvidence.collectionDate || new Date().toISOString().split('T')[0],
      time: newEvidence.collectionTime || '10:00',
      officer: newEvidence.collectedBy || 'Evidence Intake Desk',
      action: 'Evidence Registered',
      fromLocation: newEvidence.collectionLocation || 'Field Location',
      toLocation: 'CEMS Digital Evidence Vault',
      reason: 'Initial cryptographic hashing and master intake',
      notes: `Ingested with SHA-256 hash ${newEvidence.hashValue ? newEvidence.hashValue.substring(0, 16) + '...' : 'Generated'}`
    };
    StorageManager.addData(StorageKeys.CUSTODY, custodyRecord);

    Utils.logActivity('Evidence Added', 'Evidence Registry', newId, 'Success', `Item "${newEvidence.evidenceName}" registered under Case ${newEvidence.caseId}.`);
    return this._simulateNetwork(newEvidence);
  },

  async updateEvidence(id, evidenceData) {
    try {
      const res = await this._fetch(`/evidence/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(evidenceData)
      });
      if (res && res.success && res.data) {
        StorageManager.updateData(StorageKeys.EVIDENCE, id, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    const updated = StorageManager.updateData(StorageKeys.EVIDENCE, id, evidenceData);
    if (!updated) return this._simulateNetwork(null, `Evidence ${id} could not be updated`);
    Utils.logActivity('Evidence Updated', 'Evidence Registry', id, 'Success', `Evidence record ${id} modified.`);
    return this._simulateNetwork(updated);
  },

  async deleteEvidence(id) {
    try {
      const res = await this._fetch(`/evidence/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res && res.success) {
        StorageManager.deleteData(StorageKeys.EVIDENCE, id);
        return { success: true, id };
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    StorageManager.deleteData(StorageKeys.EVIDENCE, id);
    Utils.logActivity('Evidence Deleted', 'Evidence Registry', id, 'Warning', `Evidence ${id} deleted.`);
    return this._simulateNetwork({ success: true, id });
  },

  /**
   * Cryptographic verification against original hash
   */
  async verifyEvidence(id, testHash, fileObj = null) {
    try {
      let bodyData;
      if (fileObj) {
        const formData = new FormData();
        formData.append('file', fileObj);
        bodyData = formData;
      } else {
        bodyData = JSON.stringify({ testHash: testHash });
      }

      const res = await this._fetch(`/evidence/${encodeURIComponent(id)}/verify`, {
        method: 'POST',
        body: bodyData
      });

      if (res && res.success && res.data) {
        // Sync LocalStorage
        if (res.data.evidence) {
          StorageManager.updateData(StorageKeys.EVIDENCE, id, res.data.evidence);
        }
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    // Fallback: LocalStorage
    const item = StorageManager.findById(StorageKeys.EVIDENCE, id);
    if (!item) return this._simulateNetwork(null, `Evidence ${id} not found`);

    const baseline = (item.originalHash || item.hashValue || '').toLowerCase().trim();
    const computed = (testHash || '').toLowerCase().trim();
    const isMatch = (baseline === computed);
    const verificationStatus = isMatch ? 'VERIFIED' : 'MISMATCH';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updated = StorageManager.updateData(StorageKeys.EVIDENCE, id, {
      currentHash: testHash,
      verificationStatus: verificationStatus,
      lastVerified: now
    });

    Utils.logActivity(
      'Evidence Verified',
      'Verification Lab',
      id,
      isMatch ? 'Success' : 'Danger',
      `Audit result: ${verificationStatus}. Baseline: ${baseline.substring(0, 12)}..., Computed: ${computed.substring(0, 12)}...`
    );

    return this._simulateNetwork({
      evidence: updated,
      isMatch: isMatch,
      originalHash: item.originalHash || item.hashValue,
      computedHash: testHash,
      verificationStatus: verificationStatus,
      timestamp: now
    });
  },

  // =========================================================================
  // CHAIN OF CUSTODY
  // =========================================================================

  async getCustody(evidenceId = null) {
    const query = evidenceId ? `?evidenceId=${encodeURIComponent(evidenceId)}` : '';
    try {
      const res = await this._fetch(`/custody${query}`, { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {}

    let events = StorageManager.getData(StorageKeys.CUSTODY) || [];
    if (evidenceId) {
      events = events.filter(e => e.evidenceId === evidenceId);
    }
    events.sort((a, b) => ((a.date || '') + ' ' + (a.time || '')).localeCompare((b.date || '') + ' ' + (b.time || '')));
    return this._simulateNetwork(events);
  },

  async getCustodyByEvidenceId(evidenceId) {
    return this.getCustody(evidenceId);
  },

  async addCustodyEvent(eventData) {
    try {
      const res = await this._fetch('/custody', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      if (res && res.success && res.data) {
        StorageManager.addData(StorageKeys.CUSTODY, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    const custodyList = StorageManager.getData(StorageKeys.CUSTODY) || [];
    const newId = `CUST-${String(custodyList.length + 1).padStart(3, '0')}`;
    const newEvent = {
      id: newId,
      custodyId: newId,
      date: eventData.date || new Date().toISOString().split('T')[0],
      time: eventData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      ...eventData,
      createdAt: new Date().toISOString()
    };

    StorageManager.addData(StorageKeys.CUSTODY, newEvent);
    Utils.logActivity('Custody Event Added', 'Chain of Custody', newEvent.evidenceId, 'Success', `Logged: ${newEvent.action} by ${newEvent.officer}`);
    return this._simulateNetwork(newEvent);
  },

  // =========================================================================
  // HEARINGS
  // =========================================================================

  async getHearings(filters = {}) {
    const params = new URLSearchParams();
    if (filters.caseId) params.append('caseId', filters.caseId);
    if (filters.status) params.append('status', filters.status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await this._fetch(`/hearings${queryStr}`, { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (e) {}

    let hearings = StorageManager.getData(StorageKeys.HEARINGS) || [];
    if (filters.caseId) {
      hearings = hearings.filter(h => h.caseId === filters.caseId);
    }
    if (filters.status && filters.status !== 'All') {
      hearings = hearings.filter(h => h.status === filters.status);
    }
    hearings.sort((a, b) => (a.hearingDate || '').localeCompare(b.hearingDate || ''));
    return this._simulateNetwork(hearings);
  },

  async getHearing(id) {
    try {
      const res = await this._fetch(`/hearings/${encodeURIComponent(id)}`, { method: 'GET' });
      if (res && res.success && res.data) return res.data;
    } catch (e) {}
    const item = StorageManager.findById(StorageKeys.HEARINGS, id);
    return this._simulateNetwork(item);
  },

  async createHearing(hearingData) {
    try {
      const res = await this._fetch('/hearings', {
        method: 'POST',
        body: JSON.stringify(hearingData)
      });
      if (res && res.success && res.data) {
        StorageManager.addData(StorageKeys.HEARINGS, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    const list = StorageManager.getData(StorageKeys.HEARINGS) || [];
    const newId = `HRG-${new Date().getFullYear()}-${String(list.length + 1).padStart(2, '0')}`;
    const newHearing = {
      id: newId,
      hearingId: newId,
      status: 'Scheduled',
      ...hearingData,
      createdAt: new Date().toISOString()
    };
    StorageManager.addData(StorageKeys.HEARINGS, newHearing);
    Utils.logActivity('Hearing Scheduled', 'Hearing Management', newId, 'Success', `Hearing scheduled on ${newHearing.hearingDate} for Case ${newHearing.caseId}`);
    return this._simulateNetwork(newHearing);
  },

  async updateHearing(id, hearingData) {
    try {
      const res = await this._fetch(`/hearings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(hearingData)
      });
      if (res && res.success && res.data) {
        StorageManager.updateData(StorageKeys.HEARINGS, id, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    const updated = StorageManager.updateData(StorageKeys.HEARINGS, id, hearingData);
    Utils.logActivity('Hearing Updated', 'Hearing Management', id, 'Success', `Hearing ${id} updated.`);
    return this._simulateNetwork(updated);
  },

  async updateHearingStatus(id, status) {
    return this.updateHearing(id, { status });
  },

  async deleteHearing(id) {
    try {
      const res = await this._fetch(`/hearings/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res && res.success) {
        StorageManager.deleteData(StorageKeys.HEARINGS, id);
        return { success: true, id };
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    StorageManager.deleteData(StorageKeys.HEARINGS, id);
    Utils.logActivity('Hearing Removed', 'Hearing Management', id, 'Warning', `Hearing ${id} cancelled.`);
    return this._simulateNetwork({ success: true, id });
  },

  // =========================================================================
  // DOCUMENTS
  // =========================================================================

  async getDocuments(filters = {}) {
    const query = filters.caseId ? `?caseId=${encodeURIComponent(filters.caseId)}` : '';
    try {
      const res = await this._fetch(`/documents${query}`, { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) return res.data;
    } catch (e) {}

    let docs = StorageManager.getData(StorageKeys.DOCUMENTS) || [];
    if (filters.caseId) {
      docs = docs.filter(d => d.caseId === filters.caseId);
    }
    return this._simulateNetwork(docs);
  },

  async getDocument(id) {
    try {
      const res = await this._fetch(`/documents/${encodeURIComponent(id)}`, { method: 'GET' });
      if (res && res.success && res.data) return res.data;
    } catch (e) {}
    const item = StorageManager.findById(StorageKeys.DOCUMENTS, id);
    return this._simulateNetwork(item);
  },

  async createDocument(docData, fileObj = null) {
    try {
      let bodyData;
      if (fileObj) {
        const formData = new FormData();
        formData.append('file', fileObj);
        Object.keys(docData).forEach(k => formData.append(k, docData[k]));
        bodyData = formData;
      } else {
        bodyData = JSON.stringify(docData);
      }

      const res = await this._fetch('/documents', {
        method: 'POST',
        body: bodyData
      });

      if (res && res.success && res.data) {
        StorageManager.addData(StorageKeys.DOCUMENTS, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    const list = StorageManager.getData(StorageKeys.DOCUMENTS) || [];
    const newId = `DOC-${list.length + 101}`;
    const newDoc = {
      id: newId,
      documentId: newId,
      version: 'v1.0',
      status: 'Verified',
      fileSize: '1.8 MB',
      date: new Date().toISOString().split('T')[0],
      ...docData,
      createdAt: new Date().toISOString()
    };
    StorageManager.addData(StorageKeys.DOCUMENTS, newDoc);
    Utils.logActivity('Document Added', 'Document Repository', newId, 'Success', `Document "${newDoc.documentName}" uploaded.`);
    return this._simulateNetwork(newDoc);
  },

  async deleteDocument(id) {
    try {
      const res = await this._fetch(`/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res && res.success) {
        StorageManager.deleteData(StorageKeys.DOCUMENTS, id);
        return { success: true, id };
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    StorageManager.deleteData(StorageKeys.DOCUMENTS, id);
    Utils.logActivity('Document Removed', 'Document Repository', id, 'Warning', `Document ${id} deleted.`);
    return this._simulateNetwork({ success: true, id });
  },

  // =========================================================================
  // COURT SUBMISSIONS
  // =========================================================================

  async getSubmissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.caseId) params.append('caseId', filters.caseId);
    if (filters.status) params.append('status', filters.status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await this._fetch(`/submissions${queryStr}`, { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) return res.data;
    } catch (e) {}

    let list = StorageManager.getData(StorageKeys.SUBMISSIONS) || [];
    if (filters.caseId) list = list.filter(s => s.caseId === filters.caseId);
    if (filters.status && filters.status !== 'All') list = list.filter(s => s.status === filters.status);
    return this._simulateNetwork(list);
  },

  async getSubmission(id) {
    try {
      const res = await this._fetch(`/submissions/${encodeURIComponent(id)}`, { method: 'GET' });
      if (res && res.success && res.data) return res.data;
    } catch (e) {}
    const item = StorageManager.findById(StorageKeys.SUBMISSIONS, id);
    return this._simulateNetwork(item);
  },

  async submitEvidence(subData) {
    try {
      const res = await this._fetch('/submissions', {
        method: 'POST',
        body: JSON.stringify(subData)
      });
      if (res && res.success && res.data) {
        StorageManager.addData(StorageKeys.SUBMISSIONS, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    const list = StorageManager.getData(StorageKeys.SUBMISSIONS) || [];
    const newId = `SUB-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
    const newSub = {
      id: newId,
      submissionId: newId,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      ...subData,
      createdAt: new Date().toISOString()
    };
    StorageManager.addData(StorageKeys.SUBMISSIONS, newSub);

    // Update evidence status
    StorageManager.updateData(StorageKeys.EVIDENCE, newSub.evidenceId, { courtStatus: 'Submitted' });

    // Custody event
    this.addCustodyEvent({
      evidenceId: newSub.evidenceId,
      officer: newSub.submittedBy || 'Court Liaison Officer',
      action: 'Evidence Submitted to Court',
      fromLocation: 'Central Evidence Vault',
      toLocation: `${newSub.court} Record Room`,
      reason: `Formal legal submission under reference ${newSub.submissionReference || newId}`,
      notes: newSub.notes || ''
    });

    Utils.logActivity('Court Submission', 'Court Submission Gateway', newId, 'Success', `Evidence ${newSub.evidenceId} submitted to ${newSub.court}.`);
    return this._simulateNetwork(newSub);
  },

  async updateSubmissionStatus(id, status, notes = '') {
    try {
      const res = await this._fetch(`/submissions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });
      if (res && res.success && res.data) {
        StorageManager.updateData(StorageKeys.SUBMISSIONS, id, res.data);
        return res.data;
      }
    } catch (e) {
      if (API_CONFIG.isOnline) throw e;
    }

    const updated = StorageManager.updateData(StorageKeys.SUBMISSIONS, id, { status, notes });
    if (updated) {
      const evidenceStatus = status === 'Accepted' ? 'Admitted' : status === 'Rejected' ? 'Rejected' : 'Submitted';
      StorageManager.updateData(StorageKeys.EVIDENCE, updated.evidenceId, { courtStatus: evidenceStatus });

      if (status === 'Accepted') {
        this.addCustodyEvent({
          evidenceId: updated.evidenceId,
          officer: 'Judicial Bench',
          action: 'Evidence Admitted',
          fromLocation: `${updated.court} Bench`,
          toLocation: 'Admitted Evidence Judicial Strongroom',
          reason: 'Marked as trial exhibit; entered into official court record.',
          notes: notes
        });
      }
    }

    Utils.logActivity('Submission Status Updated', 'Court Submission Gateway', id, 'Success', `Status changed to "${status}".`);
    return this._simulateNetwork(updated);
  },

  // =========================================================================
  // DASHBOARD AGGREGATES
  // =========================================================================

  async getDashboardStats() {
    try {
      const res = await this._fetch('/dashboard/stats', { method: 'GET' });
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {}

    // Fallback: LocalStorage
    const cases = StorageManager.getData(StorageKeys.CASES) || [];
    const evidence = StorageManager.getData(StorageKeys.EVIDENCE) || [];
    const activity = StorageManager.getData(StorageKeys.ACTIVITY) || [];

    const stats = {
      totalCases: cases.length,
      totalEvidence: evidence.length,
      pendingVerification: evidence.filter(e => e.verificationStatus === 'PENDING').length,
      courtSubmitted: evidence.filter(e => e.courtStatus === 'Submitted').length,
      admittedEvidence: evidence.filter(e => e.courtStatus === 'Admitted').length,
      rejectedEvidence: evidence.filter(e => e.courtStatus === 'Rejected' || e.verificationStatus === 'MISMATCH').length,
      recentCases: cases.slice(0, 5),
      recentEvidence: evidence.slice(0, 5),
      recentActivity: activity.slice(0, 6),
      systemStatus: {
        caseManagement: 'Operational',
        evidenceRegistry: 'Operational',
        verificationEngine: 'Operational',
        submissionGateway: 'Operational',
        auditLog: 'Operational',
        databaseEngine: 'LocalStorage Demo Store'
      }
    };
    return this._simulateNetwork(stats);
  },

  // =========================================================================
  // ACTIVITY & NOTIFICATIONS & USERS & SETTINGS
  // =========================================================================

  async getActivityLogs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.module) params.append('module', filters.module);
    if (filters.user) params.append('user', filters.user);
    if (filters.limit) params.append('limit', filters.limit);

    const query = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await this._fetch(`/activity${query}`, { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) return res.data;
    } catch (e) {}

    let activity = StorageManager.getData(StorageKeys.ACTIVITY) || [];
    if (filters.module && filters.module !== 'All') {
      activity = activity.filter(a => a.module === filters.module);
    }
    if (filters.user && filters.user !== 'All') {
      activity = activity.filter(a => a.user === filters.user);
    }
    return this._simulateNetwork(activity);
  },

  async getNotifications() {
    try {
      const res = await this._fetch('/notifications', { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) return res.data;
    } catch (e) {}
    const notifs = StorageManager.getData(StorageKeys.NOTIFICATIONS) || [];
    return this._simulateNetwork(notifs);
  },

  async markNotificationRead(id) {
    try {
      await this._fetch(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' });
    } catch (e) {}
    const list = StorageManager.getData(StorageKeys.NOTIFICATIONS) || [];
    const item = list.find(n => n.id === id);
    if (item) item.unread = false;
    StorageManager.saveData(StorageKeys.NOTIFICATIONS, list);
    return { success: true };
  },

  async getUsers() {
    try {
      const res = await this._fetch('/users', { method: 'GET' });
      if (res && res.success && Array.isArray(res.data)) return res.data;
    } catch (e) {}
    const users = StorageManager.getData(StorageKeys.USERS) || [];
    return this._simulateNetwork(users);
  },

  async getSettings() {
    try {
      const res = await this._fetch('/settings', { method: 'GET' });
      if (res && res.success && res.data) return res.data;
    } catch (e) {}
    const settings = StorageManager.getData(StorageKeys.SETTINGS) || {};
    return this._simulateNetwork(settings);
  },

  async saveSettings(settings) {
    try {
      const res = await this._fetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (res && res.success && res.data) {
        StorageManager.saveData(StorageKeys.SETTINGS, res.data);
        return res.data;
      }
    } catch (e) {}
    StorageManager.saveData(StorageKeys.SETTINGS, settings);
    return this._simulateNetwork(settings);
  },

  async resetDatabase() {
    try {
      await this._fetch('/settings/reset', { method: 'POST' });
    } catch (e) {}
    StorageManager.initDemoData(true);
    return { success: true };
  },

  // =========================================================================
  // REPORTS
  // =========================================================================

  async getReports(type, params = {}) {
    const cases = await this.getCases(params);
    const evidence = await this.getEvidence(params);
    const custody = await this.getCustody();
    const hearings = await this.getHearings();
    const submissions = await this.getSubmissions();
    const activity = await this.getActivityLogs();

    const reportData = {
      generatedAt: new Date().toISOString(),
      reportType: type,
      totalRecords: 0,
      data: []
    };

    switch (type) {
      case 'CaseSummary':
        reportData.data = cases.map(c => ({
          'Case ID': c.caseId,
          'Case Number': c.caseNumber,
          'Title': c.caseTitle,
          'Court': c.courtName,
          'Judge': c.judgeName,
          'Priority': c.priority,
          'Status': c.status,
          'Filing Date': c.filingDate,
          'Next Hearing': c.nextHearingDate
        }));
        break;

      case 'EvidenceRegister':
        reportData.data = evidence.map(e => ({
          'Evidence ID': e.evidenceId,
          'Case ID': e.caseId,
          'Name': e.evidenceName,
          'Type': e.evidenceType,
          'Collected By': e.collectedBy,
          'Date': e.collectionDate,
          'SHA-256 Hash': e.hashValue,
          'Verification': e.verificationStatus,
          'Court Status': e.courtStatus
        }));
        break;

      case 'ChainOfCustodyReport':
        reportData.data = custody.map(c => ({
          'Custody ID': c.id,
          'Evidence ID': c.evidenceId,
          'Date': c.date,
          'Time': c.time,
          'Officer': c.officer,
          'Action': c.action,
          'From': c.fromLocation,
          'To': c.toLocation,
          'Reason': c.reason
        }));
        break;

      case 'CourtSubmissionReport':
        reportData.data = submissions.map(s => ({
          'Submission ID': s.id,
          'Evidence ID': s.evidenceId,
          'Case ID': s.caseId,
          'Court': s.court,
          'Submission Ref': s.submissionReference,
          'Date': s.submissionDate,
          'Submitted By': s.submittedBy,
          'Status': s.status
        }));
        break;

      case 'HearingReport':
        reportData.data = hearings.map(h => ({
          'Hearing ID': h.id,
          'Case ID': h.caseId,
          'Court': h.court,
          'Judge': h.judge,
          'Date': h.hearingDate,
          'Time': h.hearingTime,
          'Type': h.hearingType,
          'Status': h.status
        }));
        break;

      case 'EvidenceVerificationReport':
        reportData.data = evidence.map(e => ({
          'Evidence ID': e.evidenceId,
          'Case ID': e.caseId,
          'Name': e.evidenceName,
          'Algorithm': e.hashAlgorithm || 'SHA-256',
          'Registered Hash': e.originalHash || e.hashValue,
          'Current Hash': e.currentHash || e.hashValue,
          'Verification Status': e.verificationStatus,
          'Last Verified': e.lastVerified || '—'
        }));
        break;

      case 'ActivityReport':
      default:
        reportData.data = activity.map(a => ({
          'Activity ID': a.id,
          'Timestamp': a.timestamp,
          'User': a.user,
          'Module': a.module,
          'Action': a.action,
          'Reference ID': a.referenceId,
          'Status': a.status,
          'Details': a.details
        }));
        break;
    }

    reportData.totalRecords = reportData.data.length;
    return this._simulateNetwork(reportData);
  }
};

// Check backend status automatically when api.js evaluates
api.checkBackendHealth();

window.api = api;
