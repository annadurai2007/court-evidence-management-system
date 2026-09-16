/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * cases.js - Case Registry, Search, Advanced Filtering, Pagination & Case Lifecycle Modal
 */

let allCases = [];
let filteredCases = [];
let currentPage = 1;
const pageSize = 8;
let currentSort = 'newest';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCases();
  initCaseEventListeners();
});

async function loadCases() {
  try {
    allCases = await api.getCases();
    applyFilters();
  } catch (err) {
    console.error('Error loading cases:', err);
    Utils.showToast('Failed to load cases', 'error');
  }
}

function applyFilters() {
  const search = (document.getElementById('cases-search-input')?.value || '').trim().toLowerCase();
  const typeFilter = document.getElementById('filter-case-type')?.value || 'All';
  const statusFilter = document.getElementById('filter-case-status')?.value || 'All';
  const priorityFilter = document.getElementById('filter-case-priority')?.value || 'All';

  filteredCases = allCases.filter(c => {
    const matchesSearch = !search ||
      c.caseId.toLowerCase().includes(search) ||
      c.caseNumber.toLowerCase().includes(search) ||
      c.caseTitle.toLowerCase().includes(search) ||
      c.courtName.toLowerCase().includes(search) ||
      c.judgeName.toLowerCase().includes(search) ||
      c.petitioner.toLowerCase().includes(search) ||
      c.respondent.toLowerCase().includes(search);

    const matchesType = (typeFilter === 'All' || c.caseType === typeFilter);
    const matchesStatus = (statusFilter === 'All' || c.status === statusFilter);
    const matchesPriority = (priorityFilter === 'All' || c.priority === priorityFilter);

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // Apply sorting
  sortCasesData();

  currentPage = 1;
  renderCasesTable();
}

function sortCasesData() {
  if (currentSort === 'newest') {
    filteredCases.sort((a, b) => (b.filingDate || '').localeCompare(a.filingDate || ''));
  } else if (currentSort === 'oldest') {
    filteredCases.sort((a, b) => (a.filingDate || '').localeCompare(b.filingDate || ''));
  } else if (currentSort === 'priority') {
    const pWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    filteredCases.sort((a, b) => (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0));
  } else if (currentSort === 'title') {
    filteredCases.sort((a, b) => a.caseTitle.localeCompare(b.caseTitle));
  }
}

function renderCasesTable() {
  const tbody = document.getElementById('cases-table-tbody');
  const countEl = document.getElementById('cases-count-label');
  const paginationContainer = document.getElementById('cases-pagination');

  if (countEl) {
    countEl.textContent = `Showing ${filteredCases.length} registered cases`;
  }

  if (!tbody) return;

  if (filteredCases.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding: 3rem 1rem;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
            <h4>No matching case files found</h4>
            <p>Try clearing your active filters or create a new case registration entry.</p>
          </div>
        </td>
      </tr>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // Calculate pagination slice
  const totalPages = Math.ceil(filteredCases.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filteredCases.slice(startIdx, startIdx + pageSize);

  tbody.innerHTML = pageItems.map(c => `
    <tr>
      <td data-label="Case ID">
        <a href="case-details.html?id=${c.caseId}" style="font-weight:700; font-family:var(--font-mono); color:var(--gold-primary);">
          ${c.caseId}
        </a>
      </td>
      <td data-label="Title & Number">
        <div style="font-weight:700; color:var(--text-main); font-size:0.92rem;">
          <a href="case-details.html?id=${c.caseId}">${c.caseTitle}</a>
        </div>
        <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
          No: ${c.caseNumber} • Filed: ${Utils.formatDate(c.filingDate)}
        </div>
      </td>
      <td data-label="Court & Judge">
        <div style="font-weight:600; font-size:0.85rem;">${c.courtName}</div>
        <div style="font-size:0.75rem; color:var(--text-dim);">Judge: ${c.judgeName}</div>
      </td>
      <td data-label="Type"><span class="badge badge-gold">${c.caseType}</span></td>
      <td data-label="Priority">${Utils.renderPriorityBadge(c.priority)}</td>
      <td data-label="Status">${Utils.renderStatusBadge(c.status)}</td>
      <td data-label="Next Hearing">
        <div style="font-size:0.82rem; font-weight:600;">${c.nextHearingDate || '—'}</div>
      </td>
      <td data-label="Actions">
        <div class="table-row-actions">
          <a href="case-details.html?id=${c.caseId}" class="btn btn-secondary btn-sm" title="View Profile">
            <i class="fa-solid fa-folder-open"></i>
          </a>
          <button class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.caseId}')" title="Edit Case">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteCase('${c.caseId}')" title="Delete Demo Case">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Render pagination bar
  if (paginationContainer) {
    let pagesHtml = '';
    for (let p = 1; p <= totalPages; p++) {
      pagesHtml += `
        <button class="btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-secondary'}" onclick="goToCasePage(${p})">
          ${p}
        </button>
      `;
    }
    paginationContainer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;flex-wrap:wrap;gap:1rem;">
        <span style="font-size:0.8rem;color:var(--text-dim);">Page ${currentPage} of ${totalPages}</span>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-sm btn-secondary" ${currentPage === 1 ? 'disabled' : ''} onclick="goToCasePage(${currentPage - 1})">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          ${pagesHtml}
          <button class="btn btn-sm btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToCasePage(${currentPage + 1})">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  }
}

window.goToCasePage = function(page) {
  currentPage = page;
  renderCasesTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function initCaseEventListeners() {
  const searchInput = document.getElementById('cases-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  const typeFilter = document.getElementById('filter-case-type');
  const statusFilter = document.getElementById('filter-case-status');
  const priorityFilter = document.getElementById('filter-case-priority');
  const sortSelect = document.getElementById('sort-cases');

  if (typeFilter) typeFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      sortCasesData();
      renderCasesTable();
    });
  }

  // Clear filters
  const resetBtn = document.getElementById('btn-reset-case-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeFilter) typeFilter.value = 'All';
      if (statusFilter) statusFilter.value = 'All';
      if (priorityFilter) priorityFilter.value = 'All';
      applyFilters();
    });
  }

  // Add Case Form Submission
  const caseForm = document.getElementById('case-form');
  if (caseForm) {
    caseForm.addEventListener('submit', handleSaveCase);
  }
}

/**
 * Open Modal for Adding a New Case
 */
window.openAddCaseModal = function() {
  const form = document.getElementById('case-form');
  if (form) form.reset();

  document.getElementById('modal-case-title').textContent = 'Register New Court Case File';
  document.getElementById('case-id-input').value = `CEMS-2026-${String(allCases.length + 1).padStart(3, '0')}`;
  document.getElementById('case-filing-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('is-edit-mode').value = 'false';

  Utils.openModal('case-modal');
};

/**
 * Open Modal for Editing an Existing Case
 */
window.openEditCaseModal = async function(caseId) {
  const c = allCases.find(item => item.caseId === caseId);
  if (!c) return;

  document.getElementById('modal-case-title').textContent = `Edit Case: ${c.caseId}`;
  document.getElementById('is-edit-mode').value = 'true';
  document.getElementById('case-id-input').value = c.caseId;
  document.getElementById('case-number-input').value = c.caseNumber || '';
  document.getElementById('case-title-input').value = c.caseTitle || '';
  document.getElementById('case-type-select').value = c.caseType || 'Criminal';
  document.getElementById('court-name-input').value = c.courtName || '';
  document.getElementById('court-location-input').value = c.courtLocation || '';
  document.getElementById('judge-name-input').value = c.judgeName || '';
  document.getElementById('investigating-officer-input').value = c.investigatingOfficer || '';
  document.getElementById('petitioner-input').value = c.petitioner || '';
  document.getElementById('respondent-input').value = c.respondent || '';
  document.getElementById('advocate-input').value = c.advocate || '';
  document.getElementById('case-priority-select').value = c.priority || 'Medium';
  document.getElementById('case-status-select').value = c.status || 'Active';
  document.getElementById('case-filing-date').value = c.filingDate || '';
  document.getElementById('case-hearing-date').value = c.nextHearingDate || '';
  document.getElementById('case-description-input').value = c.description || '';

  Utils.openModal('case-modal');
};

/**
 * Save / Update Case handler
 */
async function handleSaveCase(e) {
  e.preventDefault();

  const isEdit = document.getElementById('is-edit-mode').value === 'true';
  const caseId = document.getElementById('case-id-input').value.trim();
  const caseNumber = document.getElementById('case-number-input').value.trim();
  const caseTitle = document.getElementById('case-title-input').value.trim();

  if (!caseTitle || !caseNumber) {
    Utils.showToast('Please fill in required fields (Title & Case Number)', 'error');
    return;
  }

  const payload = {
    caseId,
    caseNumber,
    caseTitle,
    caseType: document.getElementById('case-type-select').value,
    courtName: document.getElementById('court-name-input').value.trim() || 'District Court',
    courtLocation: document.getElementById('court-location-input').value.trim() || 'Judicial Chamber',
    judgeName: document.getElementById('judge-name-input').value.trim() || 'Hon. Presiding Magistrate',
    presidingOfficer: 'Arthur Pendelton',
    investigatingOfficer: document.getElementById('investigating-officer-input').value.trim() || 'Unassigned',
    petitioner: document.getElementById('petitioner-input').value.trim() || 'State Prosecution',
    respondent: document.getElementById('respondent-input').value.trim() || 'Respondent Counsel',
    advocate: document.getElementById('advocate-input').value.trim() || 'Bar Panel',
    priority: document.getElementById('case-priority-select').value,
    status: document.getElementById('case-status-select').value,
    filingDate: document.getElementById('case-filing-date').value || new Date().toISOString().split('T')[0],
    nextHearingDate: document.getElementById('case-hearing-date').value || '—',
    description: document.getElementById('case-description-input').value.trim() || 'No description entered.'
  };

  try {
    if (isEdit) {
      await api.updateCase(caseId, payload);
      Utils.showToast(`Case ${caseId} updated successfully`, 'success');
    } else {
      await api.createCase(payload);
      Utils.showToast(`New Case ${caseId} registered`, 'success');
    }
    Utils.closeModal('case-modal');
    await loadCases();
  } catch (err) {
    Utils.showToast('Error saving case: ' + err.message, 'error');
  }
}

/**
 * Confirm and Delete Case
 */
window.confirmDeleteCase = function(caseId) {
  Utils.confirmModal(
    'Delete Demo Case Record',
    `Are you sure you want to delete case "${caseId}"? This will also un-link local mock demo associations.`,
    async () => {
      await api.deleteCase(caseId);
      Utils.showToast(`Case ${caseId} deleted`, 'info');
      await loadCases();
    },
    'Delete Case',
    true
  );
};
