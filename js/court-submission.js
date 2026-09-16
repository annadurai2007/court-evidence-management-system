/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * court-submission.js - Judicial Evidence Submission Tracking & Admissibility Workflow
 */

let allSubmissions = [];
let filteredSubmissions = [];
let allEvidence = [];
let allCases = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadSubmissionsData();
  initSubmissionListeners();

  // Check URL query parameters for pre-filling submission form
  const urlParams = new URLSearchParams(window.location.search);
  const prefillEvId = urlParams.get('evidenceId');
  if (prefillEvId) {
    openSubmitModal(prefillEvId);
  }
});

async function loadSubmissionsData() {
  try {
    [allSubmissions, allEvidence, allCases] = await Promise.all([
      api.getSubmissions(),
      api.getEvidence(),
      api.getCases()
    ]);

    applySubmissionFilters();

  } catch (err) {
    console.error('Error loading submissions:', err);
    Utils.showToast('Failed to load court submissions', 'error');
  }
}

function applySubmissionFilters() {
  const search = (document.getElementById('submissions-search-input')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('filter-submission-status')?.value || 'All';

  filteredSubmissions = allSubmissions.filter(s => {
    const matchesSearch = !search ||
      s.id.toLowerCase().includes(search) ||
      s.evidenceId.toLowerCase().includes(search) ||
      s.caseId.toLowerCase().includes(search) ||
      s.court.toLowerCase().includes(search) ||
      s.submissionReference.toLowerCase().includes(search) ||
      s.submittedBy.toLowerCase().includes(search);

    const matchesStatus = (statusFilter === 'All' || s.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  renderSubmissionsTable();
}

function renderSubmissionsTable() {
  const tbody = document.getElementById('submissions-table-tbody');
  const countEl = document.getElementById('submissions-count-label');

  if (countEl) {
    countEl.textContent = `Showing ${filteredSubmissions.length} court submissions`;
  }

  if (!tbody) return;

  if (filteredSubmissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 3rem 1rem;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-scale-balanced"></i></div>
            <h4>No court submissions found</h4>
            <p>Submit evidence to the judicial bench using the button above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredSubmissions.map(s => {
    const ev = allEvidence.find(e => e.evidenceId === s.evidenceId);
    const evName = ev ? ev.evidenceName : 'Evidence Item';

    return `
      <tr>
        <td data-label="Submission ID">
          <span style="font-family:var(--font-mono);font-weight:700;color:var(--gold-primary);">
            ${s.id}
          </span>
        </td>
        <td data-label="Evidence ID">
          <a href="evidence-details.html?id=${s.evidenceId}" style="font-weight:700;color:var(--accent-blue);font-family:var(--font-mono);">
            ${s.evidenceId}
          </a>
          <div style="font-size:0.75rem;color:var(--text-dim);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${evName}</div>
        </td>
        <td data-label="Case ID">
          <a href="case-details.html?id=${s.caseId}" style="color:var(--text-main);font-weight:600;font-family:var(--font-mono);">
            ${s.caseId}
          </a>
        </td>
        <td data-label="Court & Ref">
          <div style="font-size:0.86rem;font-weight:600;">${s.court}</div>
          <div style="font-size:0.75rem;color:var(--text-dim);">Ref: ${s.submissionReference}</div>
        </td>
        <td data-label="Submitted By">
          <div style="font-size:0.82rem;">${s.submittedBy}</div>
          <div style="font-size:0.72rem;color:var(--text-dim);">${Utils.formatDate(s.submissionDate)}</div>
        </td>
        <td data-label="Type"><span class="badge" style="background:var(--bg-primary);">${s.submissionType}</span></td>
        <td data-label="Status">${Utils.renderStatusBadge(s.status)}</td>
        <td data-label="Actions">
          <div class="table-row-actions">
            <button class="btn btn-secondary btn-sm" onclick="openUpdateStatusModal('${s.id}', '${s.status}')" title="Update Judicial Status">
              <i class="fa-solid fa-sliders"></i>
            </button>
            <a href="evidence-details.html?id=${s.evidenceId}" class="btn btn-secondary btn-sm" title="View Evidence">
              <i class="fa-solid fa-eye"></i>
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function initSubmissionListeners() {
  const searchInput = document.getElementById('submissions-search-input');
  const statusFilter = document.getElementById('filter-submission-status');

  if (searchInput) searchInput.addEventListener('input', applySubmissionFilters);
  if (statusFilter) statusFilter.addEventListener('change', applySubmissionFilters);

  // Form submit handlers
  const addForm = document.getElementById('add-submission-form');
  if (addForm) addForm.addEventListener('submit', handleAddSubmission);

  const statusForm = document.getElementById('update-submission-status-form');
  if (statusForm) statusForm.addEventListener('submit', handleUpdateSubmissionStatus);
}

/**
 * Open Modal to Submit Evidence to Court
 */
window.openSubmitModal = function(prefillEvidenceId = '') {
  const form = document.getElementById('add-submission-form');
  if (form) form.reset();

  const evSelect = document.getElementById('sub-evidence-select');
  if (evSelect) {
    evSelect.innerHTML = allEvidence.map(e => `
      <option value="${e.evidenceId}" data-case="${e.caseId}" ${e.evidenceId === prefillEvidenceId ? 'selected' : ''}>
        ${e.evidenceId} — ${e.evidenceName} (${e.caseId})
      </option>
    `).join('');

    // Update case display automatically
    evSelect.addEventListener('change', () => {
      const opt = evSelect.selectedOptions[0];
      const caseInput = document.getElementById('sub-case-input');
      if (caseInput && opt) caseInput.value = opt.getAttribute('data-case') || '';
    });

    // Trigger initial
    const opt = evSelect.selectedOptions[0];
    const caseInput = document.getElementById('sub-case-input');
    if (caseInput && opt) caseInput.value = opt.getAttribute('data-case') || '';
  }

  const dateInput = document.getElementById('sub-date-input');
  const refInput = document.getElementById('sub-ref-input');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  if (refInput) refInput.value = `CR-${Math.floor(1000 + Math.random() * 9000)}/2026`;

  Utils.openModal('submission-modal');
};

async function handleAddSubmission(e) {
  e.preventDefault();

  const evidenceId = document.getElementById('sub-evidence-select').value;
  const ev = allEvidence.find(item => item.evidenceId === evidenceId);
  const caseId = ev ? ev.caseId : document.getElementById('sub-case-input').value;

  const payload = {
    evidenceId,
    caseId,
    court: document.getElementById('sub-court-input').value.trim() || 'Metropolitan High Court',
    submissionDate: document.getElementById('sub-date-input').value,
    submittedBy: document.getElementById('sub-officer-input').value.trim() || 'Arthur Pendelton (Court Officer)',
    submissionReference: document.getElementById('sub-ref-input').value.trim() || 'CR-2026-001',
    submissionType: document.getElementById('sub-type-select').value,
    status: 'Submitted',
    notes: document.getElementById('sub-notes-input').value.trim() || 'Formal submission logged to court docket'
  };

  try {
    await api.submitEvidence(payload);

    // Also add chain of custody event
    await api.addCustodyEvent({
      evidenceId,
      date: payload.submissionDate,
      time: new Date().toTimeString().substring(0, 5),
      officer: payload.submittedBy,
      action: 'Evidence Submitted to Court',
      fromLocation: 'Central Evidence Vault',
      toLocation: payload.court,
      reason: `Formal legal submission under Ref: ${payload.submissionReference}`,
      notes: payload.notes
    });

    Utils.showToast(`Evidence ${evidenceId} submitted to court!`, 'success');
    Utils.closeModal('submission-modal');
    await loadSubmissionsData();
  } catch (err) {
    Utils.showToast('Error submitting evidence: ' + err.message, 'error');
  }
}

/**
 * Open Modal to Update Submission Judicial Status (Accepted, Rejected, Returned)
 */
window.openUpdateStatusModal = function(subId, currentStatus) {
  document.getElementById('status-modal-sub-id').value = subId;
  document.getElementById('status-modal-select').value = currentStatus;
  document.getElementById('status-modal-notes').value = '';
  Utils.openModal('status-modal');
};

async function handleUpdateSubmissionStatus(e) {
  e.preventDefault();

  const subId = document.getElementById('status-modal-sub-id').value;
  const newStatus = document.getElementById('status-modal-select').value;
  const notes = document.getElementById('status-modal-notes').value.trim();

  try {
    await api.updateSubmissionStatus(subId, newStatus, notes);
    Utils.showToast(`Submission ${subId} marked as ${newStatus}`, 'success');
    Utils.closeModal('status-modal');
    await loadSubmissionsData();
  } catch (err) {
    Utils.showToast('Error updating status: ' + err.message, 'error');
  }
}
