/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * evidence.js - Master Evidence Registry, Search, Type Filtering & Quick Actions
 */

let allEvidence = [];
let filteredEvidence = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadEvidenceCatalog();
  initEvidenceListeners();
});

async function loadEvidenceCatalog() {
  try {
    allEvidence = await api.getEvidence();
    applyEvidenceFilters();
  } catch (err) {
    console.error('Error loading evidence catalog:', err);
    Utils.showToast('Failed to load evidence', 'error');
  }
}

function applyEvidenceFilters() {
  const search = (document.getElementById('evidence-search-input')?.value || '').trim().toLowerCase();
  const typeFilter = document.getElementById('filter-evidence-type')?.value || 'All';
  const statusFilter = document.getElementById('filter-court-status')?.value || 'All';
  const verifyFilter = document.getElementById('filter-verify-status')?.value || 'All';

  filteredEvidence = allEvidence.filter(e => {
    const matchesSearch = !search ||
      e.evidenceId.toLowerCase().includes(search) ||
      e.caseId.toLowerCase().includes(search) ||
      e.evidenceName.toLowerCase().includes(search) ||
      (e.fileName && e.fileName.toLowerCase().includes(search)) ||
      (e.collectedBy && e.collectedBy.toLowerCase().includes(search)) ||
      (e.hashValue && e.hashValue.toLowerCase().includes(search));

    const matchesType = (typeFilter === 'All' || e.evidenceType === typeFilter);
    const matchesStatus = (statusFilter === 'All' || e.courtStatus === statusFilter);
    const matchesVerify = (verifyFilter === 'All' || e.verificationStatus === verifyFilter);

    return matchesSearch && matchesType && matchesStatus && matchesVerify;
  });

  renderEvidenceTable();
}

function renderEvidenceTable() {
  const tbody = document.getElementById('evidence-table-tbody');
  const countEl = document.getElementById('evidence-count-label');

  if (countEl) {
    countEl.textContent = `Showing ${filteredEvidence.length} evidence records`;
  }

  if (!tbody) return;

  if (filteredEvidence.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding: 3rem 1rem;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-box-archive"></i></div>
            <h4>No evidence records match the selected criteria</h4>
            <p>Try broadening your search query or reset active filters.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredEvidence.map(e => `
    <tr>
      <td data-label="Evidence ID">
        <a href="evidence-details.html?id=${e.evidenceId}" style="font-weight:700; font-family:var(--font-mono); color:var(--accent-blue);">
          ${e.evidenceId}
        </a>
      </td>
      <td data-label="Case ID">
        <a href="case-details.html?id=${e.caseId}" style="font-family:var(--font-mono); font-size:0.8rem; color:var(--gold-primary);">
          ${e.caseId}
        </a>
      </td>
      <td data-label="Evidence Name">
        <div style="font-weight:700; color:var(--text-main);">
          <a href="evidence-details.html?id=${e.evidenceId}">${e.evidenceName}</a>
        </div>
        <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
          ${e.fileName || 'Physical Deposition'} ${e.fileSize ? '• ' + e.fileSize : ''}
        </div>
      </td>
      <td data-label="Type">
        <span class="badge" style="background:var(--bg-primary); border:1px solid var(--border-medium);">
          ${e.evidenceType}
        </span>
      </td>
      <td data-label="Collected By">
        <div style="font-size:0.82rem;">${e.collectedBy}</div>
        <div style="font-size:0.72rem; color:var(--text-dim);">${Utils.formatDate(e.collectionDate)}</div>
      </td>
      <td data-label="SHA-256">
        <div class="hash-pill" onclick="Utils.copyToClipboard('${e.hashValue}', 'SHA-256 Hash')" title="Click to copy full hash">
          <i class="fa-solid fa-fingerprint" style="color:var(--gold-primary);"></i>
          ${Utils.truncateHash(e.hashValue, 7, 5)}
        </div>
      </td>
      <td data-label="Integrity">
        <span class="badge ${e.verificationStatus === 'VERIFIED' ? 'badge-verified' : 'badge-mismatch'}">
          <i class="fa-solid ${e.verificationStatus === 'VERIFIED' ? 'fa-shield-halved' : 'fa-triangle-exclamation'}"></i>
          ${e.verificationStatus}
        </span>
      </td>
      <td data-label="Court Status">${Utils.renderStatusBadge(e.courtStatus)}</td>
      <td data-label="Actions">
        <div class="table-row-actions">
          <a href="evidence-details.html?id=${e.evidenceId}" class="btn btn-secondary btn-sm" title="View Full Evidence Profile">
            <i class="fa-solid fa-eye"></i>
          </a>
          <a href="verification.html?id=${e.evidenceId}" class="btn btn-secondary btn-sm" title="Verify Cryptographic Hash">
            <i class="fa-solid fa-shield-halved"></i>
          </a>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteEvidence('${e.evidenceId}')" title="Delete Demo Item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function initEvidenceListeners() {
  const searchInput = document.getElementById('evidence-search-input');
  const typeFilter = document.getElementById('filter-evidence-type');
  const statusFilter = document.getElementById('filter-court-status');
  const verifyFilter = document.getElementById('filter-verify-status');
  const resetBtn = document.getElementById('btn-reset-evidence-filters');

  if (searchInput) searchInput.addEventListener('input', applyEvidenceFilters);
  if (typeFilter) typeFilter.addEventListener('change', applyEvidenceFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyEvidenceFilters);
  if (verifyFilter) verifyFilter.addEventListener('change', applyEvidenceFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeFilter) typeFilter.value = 'All';
      if (statusFilter) statusFilter.value = 'All';
      if (verifyFilter) verifyFilter.value = 'All';
      applyEvidenceFilters();
    });
  }
}

window.confirmDeleteEvidence = function(evidenceId) {
  Utils.confirmModal(
    'Delete Evidence Record',
    `Are you sure you want to remove evidence record "${evidenceId}" from this demo environment?`,
    async () => {
      await api.deleteEvidence(evidenceId);
      Utils.showToast(`Evidence ${evidenceId} deleted`, 'info');
      await loadEvidenceCatalog();
    },
    'Delete Record',
    true
  );
};
