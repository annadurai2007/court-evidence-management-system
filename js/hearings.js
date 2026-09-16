/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * hearings.js - Judicial Hearing Management, Docket Calendar & Schedule Modals
 */

let allHearings = [];
let allCases = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadHearingsData();
  initHearingListeners();
});

async function loadHearingsData() {
  try {
    [allHearings, allCases] = await Promise.all([
      api.getHearings(),
      api.getCases()
    ]);

    renderUpcomingCards();
    renderHearingsTable();

  } catch (err) {
    console.error('Error loading hearings:', err);
    Utils.showToast('Failed to load hearings data', 'error');
  }
}

/**
 * Render Top Upcoming Hearing Cards with Date Countdown
 */
function renderUpcomingCards() {
  const container = document.getElementById('upcoming-hearings-cards');
  if (!container) return;

  const scheduled = allHearings
    .filter(h => h.status === 'Scheduled')
    .sort((a, b) => a.hearingDate.localeCompare(b.hearingDate));

  if (!scheduled.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--text-dim);">
        No upcoming court hearings currently scheduled.
      </div>
    `;
    return;
  }

  container.innerHTML = scheduled.slice(0, 3).map(h => {
    const hearingDateObj = new Date(h.hearingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = hearingDateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let countdownLabel = `${diffDays} days away`;
    if (diffDays === 0) countdownLabel = 'Today';
    else if (diffDays === 1) countdownLabel = 'Tomorrow';
    else if (diffDays < 0) countdownLabel = 'Past';

    return `
      <div class="feature-mini-card" style="border-left: 3px solid var(--gold-primary);">
        <div class="mini-head">
          <span><i class="fa-solid fa-gavel" style="color:var(--gold-primary);margin-right:6px;"></i> ${h.hearingType}</span>
          <span class="badge badge-gold" style="font-size:0.68rem;">${countdownLabel}</span>
        </div>
        <div style="margin: 0.5rem 0;">
          <a href="case-details.html?id=${h.caseId}" style="font-size:0.95rem;font-weight:700;color:var(--text-main);display:block;">
            ${h.caseId}
          </a>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">${h.court}</div>
        </div>
        <div class="mini-footer" style="display:flex;justify-content:space-between;align-items:center;">
          <span><i class="fa-solid fa-clock"></i> ${Utils.formatDate(h.hearingDate)} • ${h.hearingTime}</span>
          <span style="color:var(--gold-primary);font-size:0.75rem;">Judge: ${h.judge}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Complete Hearings Table
 */
function renderHearingsTable() {
  const tbody = document.getElementById('hearings-table-tbody');
  const countEl = document.getElementById('hearings-count-label');
  const search = (document.getElementById('hearings-search-input')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('filter-hearing-status')?.value || 'All';

  const filtered = allHearings.filter(h => {
    const matchesSearch = !search ||
      h.id.toLowerCase().includes(search) ||
      h.caseId.toLowerCase().includes(search) ||
      h.court.toLowerCase().includes(search) ||
      h.judge.toLowerCase().includes(search) ||
      h.hearingType.toLowerCase().includes(search) ||
      h.purpose.toLowerCase().includes(search);

    const matchesStatus = (statusFilter === 'All' || h.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  if (countEl) countEl.textContent = `Showing ${filtered.length} hearing records`;
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 3rem 1rem;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
            <h4>No hearing dockets found</h4>
            <p>Schedule a new judicial hearing using the button above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(h => `
    <tr>
      <td data-label="Hearing ID">
        <span style="font-family:var(--font-mono);font-weight:700;color:var(--gold-primary);">${h.id}</span>
      </td>
      <td data-label="Case ID">
        <a href="case-details.html?id=${h.caseId}" style="font-family:var(--font-mono);font-weight:700;color:var(--text-main);">
          ${h.caseId}
        </a>
      </td>
      <td data-label="Court & Judge">
        <div style="font-weight:600;font-size:0.86rem;">${h.court}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);">Judge: ${h.judge}</div>
      </td>
      <td data-label="Date & Time">
        <div style="font-weight:600;">${Utils.formatDate(h.hearingDate)}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);">${h.hearingTime}</div>
      </td>
      <td data-label="Type"><span class="badge" style="background:var(--bg-primary);">${h.hearingType}</span></td>
      <td data-label="Purpose" style="max-width:280px;">
        <div style="font-size:0.82rem;color:var(--text-muted);">${h.purpose}</div>
      </td>
      <td data-label="Status">${Utils.renderStatusBadge(h.status)}</td>
      <td data-label="Actions">
        <div class="table-row-actions">
          <button class="btn btn-secondary btn-sm" onclick="openHearingStatusModal('${h.id}', '${h.status}')" title="Change Status">
            <i class="fa-solid fa-sliders"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function initHearingListeners() {
  const searchInput = document.getElementById('hearings-search-input');
  const statusFilter = document.getElementById('filter-hearing-status');

  if (searchInput) searchInput.addEventListener('input', renderHearingsTable);
  if (statusFilter) statusFilter.addEventListener('change', renderHearingsTable);

  const form = document.getElementById('schedule-hearing-form');
  if (form) form.addEventListener('submit', handleScheduleHearing);

  const statusForm = document.getElementById('hearing-status-form');
  if (statusForm) statusForm.addEventListener('submit', handleUpdateHearingStatus);
}

/**
 * Open Modal to Schedule Hearing
 */
window.openScheduleHearingModal = function() {
  const form = document.getElementById('schedule-hearing-form');
  if (form) form.reset();

  const caseSelect = document.getElementById('hearing-case-select');
  if (caseSelect) {
    caseSelect.innerHTML = allCases.map(c => `
      <option value="${c.caseId}" data-court="${c.courtName}" data-judge="${c.judgeName}">
        ${c.caseId} — ${c.caseTitle}
      </option>
    `).join('');

    caseSelect.addEventListener('change', () => {
      const opt = caseSelect.selectedOptions[0];
      if (opt) {
        document.getElementById('hearing-court-input').value = opt.getAttribute('data-court') || '';
        document.getElementById('hearing-judge-input').value = opt.getAttribute('data-judge') || '';
      }
    });

    const opt = caseSelect.selectedOptions[0];
    if (opt) {
      document.getElementById('hearing-court-input').value = opt.getAttribute('data-court') || '';
      document.getElementById('hearing-judge-input').value = opt.getAttribute('data-judge') || '';
    }
  }

  const dateInput = document.getElementById('hearing-date-input');
  if (dateInput) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    dateInput.value = nextWeek.toISOString().split('T')[0];
  }

  Utils.openModal('schedule-modal');
};

async function handleScheduleHearing(e) {
  e.preventDefault();

  const payload = {
    caseId: document.getElementById('hearing-case-select').value,
    court: document.getElementById('hearing-court-input').value.trim() || 'Metropolitan High Court',
    judge: document.getElementById('hearing-judge-input').value.trim() || 'Hon. Presiding Magistrate',
    hearingDate: document.getElementById('hearing-date-input').value,
    hearingTime: document.getElementById('hearing-time-input').value || '10:30 AM',
    hearingType: document.getElementById('hearing-type-select').value,
    purpose: document.getElementById('hearing-purpose-input').value.trim() || 'Evidentiary review proceedings'
  };

  try {
    await api.createHearing(payload);
    Utils.showToast(`Hearing successfully scheduled for Case ${payload.caseId}!`, 'success');
    Utils.closeModal('schedule-modal');
    await loadHearingsData();
  } catch (err) {
    Utils.showToast('Error scheduling hearing: ' + err.message, 'error');
  }
}

window.openHearingStatusModal = function(hearingId, currentStatus) {
  document.getElementById('hearing-status-id').value = hearingId;
  document.getElementById('hearing-status-select').value = currentStatus;
  Utils.openModal('hearing-status-modal');
};

async function handleUpdateHearingStatus(e) {
  e.preventDefault();

  const id = document.getElementById('hearing-status-id').value;
  const newStatus = document.getElementById('hearing-status-select').value;

  try {
    await api.updateHearingStatus(id, newStatus);
    Utils.showToast(`Hearing ${id} marked as ${newStatus}`, 'success');
    Utils.closeModal('hearing-status-modal');
    await loadHearingsData();
  } catch (err) {
    Utils.showToast('Error updating hearing: ' + err.message, 'error');
  }
}
