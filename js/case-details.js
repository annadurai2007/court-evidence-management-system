/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * case-details.js - Comprehensive Case Profile, Tab Navigation & Linked Modules
 */

let currentCase = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id') || 'CEMS-2026-001';

  await loadCaseProfile(caseId);
  initTabs();
});

async function loadCaseProfile(caseId) {
  try {
    currentCase = await api.getCase(caseId);
    if (!currentCase) {
      Utils.showToast(`Case ${caseId} not found`, 'error');
      setTimeout(() => window.location.href = 'cases.html', 1500);
      return;
    }

    // Populate Case Header & Info
    renderCaseHeader(currentCase);

    // Load Tab Data concurrently
    await Promise.all([
      loadCaseEvidence(caseId),
      loadCaseHearings(caseId),
      loadCaseDocuments(caseId),
      loadCaseTimeline(caseId)
    ]);

  } catch (err) {
    console.error('Error loading case profile:', err);
    Utils.showToast('Failed to load case profile', 'error');
  }
}

function renderCaseHeader(c) {
  document.title = `${c.caseId} - ${c.caseTitle} | CEMS`;

  const titleEl = document.getElementById('case-hero-title');
  const metaEl = document.getElementById('case-hero-meta');
  const statusEl = document.getElementById('case-hero-status');
  const priorityEl = document.getElementById('case-hero-priority');

  if (titleEl) titleEl.textContent = c.caseTitle;
  if (metaEl) {
    metaEl.innerHTML = `
      <span><i class="fa-solid fa-hashtag"></i> ${c.caseNumber}</span>
      <span>•</span>
      <span><i class="fa-solid fa-building-columns"></i> ${c.courtName}</span>
      <span>•</span>
      <span><i class="fa-solid fa-gavel"></i> ${c.judgeName}</span>
      <span>•</span>
      <span><i class="fa-solid fa-calendar-days"></i> Filed: ${Utils.formatDate(c.filingDate)}</span>
    `;
  }
  if (statusEl) statusEl.innerHTML = Utils.renderStatusBadge(c.status);
  if (priorityEl) priorityEl.innerHTML = Utils.renderPriorityBadge(c.priority);

  // Overview Tab Fields
  setFieldText('case-ov-id', c.caseId);
  setFieldText('case-ov-number', c.caseNumber);
  setFieldText('case-ov-type', c.caseType);
  setFieldText('case-ov-court', c.courtName);
  setFieldText('case-ov-location', c.courtLocation);
  setFieldText('case-ov-judge', c.judgeName);
  setFieldText('case-ov-presiding', c.presidingOfficer);
  setFieldText('case-ov-officer', c.investigatingOfficer);
  setFieldText('case-ov-petitioner', c.petitioner);
  setFieldText('case-ov-respondent', c.respondent);
  setFieldText('case-ov-advocate', c.advocate);
  setFieldText('case-ov-filing-date', Utils.formatDate(c.filingDate));
  setFieldText('case-ov-hearing-date', c.nextHearingDate || 'None Scheduled');
  setFieldText('case-ov-description', c.description);
}

function setFieldText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '—';
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.cems-tabs .tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

/**
 * Tab 2: Linked Evidence
 */
async function loadCaseEvidence(caseId) {
  const evidenceList = await api.getEvidence({ caseId });
  const tbody = document.getElementById('case-evidence-tbody');
  const badge = document.getElementById('tab-evidence-count');

  if (badge) badge.textContent = evidenceList.length;
  if (!tbody) return;

  if (!evidenceList.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 2.5rem 1rem;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-box-open"></i></div>
            <h4>No evidence registered for this case</h4>
            <a href="add-evidence.html?caseId=${caseId}" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-plus"></i> Ingest New Evidence
            </a>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = evidenceList.map(e => `
    <tr>
      <td data-label="Evidence ID">
        <a href="evidence-details.html?id=${e.evidenceId}" style="font-family:var(--font-mono);font-weight:700;color:var(--accent-blue);">
          ${e.evidenceId}
        </a>
      </td>
      <td data-label="Evidence Name">
        <div style="font-weight:600;color:var(--text-main);">${e.evidenceName}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);">${e.fileName || 'Physical Asset'} • ${e.fileSize || 'N/A'}</div>
      </td>
      <td data-label="Type"><span class="badge" style="background:var(--bg-primary);">${e.evidenceType}</span></td>
      <td data-label="SHA-256">
        <div class="hash-pill" onclick="Utils.copyToClipboard('${e.hashValue}', 'Hash')">
          <i class="fa-solid fa-fingerprint" style="color:var(--gold-primary);"></i>
          ${Utils.truncateHash(e.hashValue, 8, 6)}
        </div>
      </td>
      <td data-label="Integrity">
        <span class="badge ${e.verificationStatus === 'VERIFIED' ? 'badge-verified' : 'badge-mismatch'}">
          ${e.verificationStatus}
        </span>
      </td>
      <td data-label="Court Status">${Utils.renderStatusBadge(e.courtStatus)}</td>
      <td data-label="Actions">
        <a href="evidence-details.html?id=${e.evidenceId}" class="btn btn-secondary btn-sm" title="View Details">
          <i class="fa-solid fa-eye"></i>
        </a>
      </td>
    </tr>
  `).join('');
}

/**
 * Tab 3: Linked Hearings
 */
async function loadCaseHearings(caseId) {
  const allHearings = await api.getHearings();
  const hearings = allHearings.filter(h => h.caseId === caseId);
  const tbody = document.getElementById('case-hearings-tbody');
  const badge = document.getElementById('tab-hearings-count');

  if (badge) badge.textContent = hearings.length;
  if (!tbody) return;

  if (!hearings.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 2rem 1rem;">
          <p style="color:var(--text-dim);">No hearings currently scheduled for this case.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = hearings.map(h => `
    <tr>
      <td data-label="Hearing ID" style="font-family:var(--font-mono);font-weight:600;">${h.id}</td>
      <td data-label="Hearing Type"><strong>${h.hearingType}</strong></td>
      <td data-label="Date & Time">${Utils.formatDate(h.hearingDate)} at ${h.hearingTime}</td>
      <td data-label="Court">${h.court}</td>
      <td data-label="Purpose" style="max-width:320px;font-size:0.82rem;color:var(--text-muted);">${h.purpose}</td>
      <td data-label="Status">${Utils.renderStatusBadge(h.status)}</td>
    </tr>
  `).join('');
}

/**
 * Tab 4: Linked Documents
 */
async function loadCaseDocuments(caseId) {
  const docs = await api.getDocuments(caseId);
  const tbody = document.getElementById('case-documents-tbody');
  const badge = document.getElementById('tab-documents-count');

  if (badge) badge.textContent = docs.length;
  if (!tbody) return;

  if (!docs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 2rem 1rem;">
          <p style="color:var(--text-dim);">No court orders or charge sheets registered for this case.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = docs.map(d => `
    <tr>
      <td data-label="Document ID" style="font-family:var(--font-mono);">${d.id}</td>
      <td data-label="Document Name">
        <div style="font-weight:600;">${d.documentName}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);">${d.fileSize || '2.4 MB'}</div>
      </td>
      <td data-label="Type"><span class="badge badge-gold">${d.documentType}</span></td>
      <td data-label="Uploaded By">${d.uploadedBy}</td>
      <td data-label="Date">${Utils.formatDate(d.date)}</td>
      <td data-label="Status">${Utils.renderStatusBadge(d.status)}</td>
    </tr>
  `).join('');
}

/**
 * Tab 5: Case Timeline
 */
async function loadCaseTimeline(caseId) {
  const container = document.getElementById('case-timeline-container');
  if (!container) return;

  const activity = await api.getActivityLogs();
  const caseActivity = activity.filter(a => a.referenceId === caseId || a.details.includes(caseId));

  if (!caseActivity.length) {
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-dim);">
        <p>No logged timeline events yet for this case.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="custody-timeline">
      ${caseActivity.map(a => `
        <div class="custody-item">
          <div class="custody-node"><i class="fa-solid fa-clock" style="font-size:0.65rem;color:var(--gold-primary);"></i></div>
          <div class="custody-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <strong style="color:var(--text-main);">${a.action}</strong>
              <span style="font-size:0.75rem;color:var(--text-dim);">${a.timestamp}</span>
            </div>
            <p style="font-size:0.84rem;color:var(--text-muted);">${a.details}</p>
            <div style="font-size:0.72rem;color:var(--gold-primary);margin-top:6px;">
              Recorded by: ${a.user} • Module: ${a.module}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
