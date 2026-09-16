/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * custody.js - Interactive Chain of Custody Timeline, Sequence Anomaly Detection & Custody Logging
 */

let allCustodyEvents = [];
let allEvidence = [];
let currentEvidenceId = '';

const STANDARD_CUSTODY_FLOW = [
  'Evidence Collected',
  'Evidence Registered',
  'Evidence Stored',
  'Evidence Transferred',
  'Evidence Reviewed',
  'Evidence Submitted to Court',
  'Evidence Admitted',
  'Evidence Archived'
];

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentEvidenceId = urlParams.get('id') || '';

  await loadCustodyData();
  initCustodyListeners();
});

async function loadCustodyData() {
  try {
    [allEvidence, allCustodyEvents] = await Promise.all([
      api.getEvidence(),
      api.getCustody()
    ]);

    // Populate Evidence Filter Dropdown
    populateEvidenceSelector();

    // Render Timeline for selected evidence or default first evidence
    if (!currentEvidenceId && allEvidence.length) {
      currentEvidenceId = allEvidence[0].evidenceId;
    }

    renderTimelineForEvidence(currentEvidenceId);

  } catch (err) {
    console.error('Error loading custody data:', err);
    Utils.showToast('Failed to load chain of custody', 'error');
  }
}

function populateEvidenceSelector() {
  const select = document.getElementById('custody-evidence-selector');
  if (!select) return;

  select.innerHTML = allEvidence.map(e => `
    <option value="${e.evidenceId}" ${e.evidenceId === currentEvidenceId ? 'selected' : ''}>
      ${e.evidenceId} — ${e.evidenceName} (${e.caseId})
    </option>
  `).join('');

  select.addEventListener('change', (e) => {
    currentEvidenceId = e.target.value;
    renderTimelineForEvidence(currentEvidenceId);
  });
}

/**
 * Render the Vertical Chain of Custody Timeline with Integrity Validation
 */
function renderTimelineForEvidence(evidenceId) {
  const container = document.getElementById('custody-timeline-container');
  const metaContainer = document.getElementById('custody-evidence-meta');
  const anomalyContainer = document.getElementById('custody-anomaly-warning');

  const evidenceItem = allEvidence.find(e => e.evidenceId === evidenceId);
  const events = allCustodyEvents.filter(c => c.evidenceId === evidenceId);

  // 1. Evidence Context Header with 8-Step Pipeline
  if (metaContainer && evidenceItem) {
    const recordedActions = events.map(e => e.action);
    const pipelineSteps = [
      { label: 'Collected', action: 'Evidence Collected', icon: 'fa-handcuffs' },
      { label: 'Registered', action: 'Evidence Registered', icon: 'fa-fingerprint' },
      { label: 'Stored', action: 'Evidence Stored', icon: 'fa-vault' },
      { label: 'Transferred', action: 'Evidence Transferred', icon: 'fa-truck' },
      { label: 'Reviewed', action: 'Evidence Reviewed', icon: 'fa-microscope' },
      { label: 'Submitted', action: 'Evidence Submitted to Court', icon: 'fa-building-columns' },
      { label: 'Admitted', action: 'Evidence Admitted', icon: 'fa-gavel' },
      { label: 'Archived', action: 'Evidence Archived', icon: 'fa-box-archive' }
    ];

    let lastCompletedIndex = -1;
    pipelineSteps.forEach((step, idx) => {
      if (recordedActions.includes(step.action)) {
        lastCompletedIndex = Math.max(lastCompletedIndex, idx);
      }
    });

    const pipelineHtml = `
      <div class="custody-pipeline">
        ${pipelineSteps.map((step, idx) => {
          const isCompleted = recordedActions.includes(step.action) || (lastCompletedIndex !== -1 && idx <= lastCompletedIndex);
          const isCurrent = idx === lastCompletedIndex;
          const stepClass = isCurrent ? 'current completed' : (isCompleted ? 'completed' : '');
          return `
            <div class="pipeline-step ${stepClass}">
              <div class="pipeline-icon" title="${step.label}: ${isCompleted ? 'Completed' : 'Pending'}">
                <i class="fa-solid ${isCompleted ? 'fa-check' : step.icon}"></i>
              </div>
              <div class="pipeline-label">${step.label}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    metaContainer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
        <div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--gold-primary);text-transform:uppercase;letter-spacing:0.08em;">
            Chain of Custody Ledger Record
          </div>
          <h2 style="font-size:1.4rem;font-weight:800;color:var(--text-main);margin-top:2px;">
            ${evidenceItem.evidenceName}
          </h2>
          <div style="font-size:0.82rem;color:var(--text-dim);margin-top:4px;">
            ID: <strong style="color:var(--accent-blue);font-family:var(--font-mono);">${evidenceItem.evidenceId}</strong> • 
            Case: <a href="case-details.html?id=${evidenceItem.caseId}" style="color:var(--gold-primary);font-family:var(--font-mono);">${evidenceItem.caseId}</a> • 
            Type: <strong>${evidenceItem.evidenceType}</strong>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          ${Utils.renderStatusBadge(evidenceItem.courtStatus)}
          <button class="btn btn-primary btn-sm" onclick="openAddCustodyModal('${evidenceItem.evidenceId}')">
            <i class="fa-solid fa-plus"></i> Add Custody Transfer
          </button>
        </div>
      </div>
      ${pipelineHtml}
    `;
  }

  // 2. Sequence Gap Anomaly Detection
  const sequenceCheck = checkCustodySequenceIntegrity(events, evidenceItem);
  if (anomalyContainer) {
    if (sequenceCheck.hasAnomaly) {
      anomalyContainer.style.display = 'block';
      anomalyContainer.innerHTML = `
        <div style="background:rgba(239, 68, 68, 0.1);border:1px solid rgba(239, 68, 68, 0.35);border-radius:10px;padding:1.25rem;display:flex;align-items:flex-start;gap:14px;">
          <i class="fa-solid fa-triangle-exclamation" style="color:#EF4444;font-size:1.4rem;margin-top:2px;"></i>
          <div>
            <div style="font-weight:700;color:#F87171;font-size:0.95rem;">Chain of Custody Sequence Warning</div>
            <p style="font-size:0.84rem;color:var(--text-main);margin-top:4px;">${sequenceCheck.message}</p>
            <div style="font-size:0.75rem;color:var(--text-dim);margin-top:4px;">
              Auditor Note: Unbroken linear custody is essential for judicial admissibility under forensic legal standards.
            </div>
          </div>
        </div>
      `;
    } else {
      anomalyContainer.style.display = 'none';
      anomalyContainer.innerHTML = '';
    }
  }

  // 3. Render Timeline Nodes
  if (!container) return;

  if (!events.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-route"></i></div>
        <h4>No chain of custody events recorded</h4>
        <p>Log the initial seizure or registration event using the button above.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="custody-timeline">
      ${events.map((e, index) => {
        let nodeIcon = 'fa-check';
        if (e.action.includes('Collected')) nodeIcon = 'fa-handcuffs';
        else if (e.action.includes('Registered')) nodeIcon = 'fa-fingerprint';
        else if (e.action.includes('Stored')) nodeIcon = 'fa-vault';
        else if (e.action.includes('Transferred')) nodeIcon = 'fa-truck';
        else if (e.action.includes('Reviewed')) nodeIcon = 'fa-microscope';
        else if (e.action.includes('Submitted')) nodeIcon = 'fa-building-columns';
        else if (e.action.includes('Admitted')) nodeIcon = 'fa-gavel';
        else if (e.action.includes('Archived')) nodeIcon = 'fa-box-archive';

        return `
          <div class="custody-item">
            <div class="custody-node">
              <i class="fa-solid ${nodeIcon}" style="font-size:0.7rem;color:var(--gold-primary);"></i>
            </div>
            <div class="custody-card">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                <div>
                  <span class="badge badge-gold" style="font-size:0.68rem;">Step #${index + 1}</span>
                  <h4 style="font-size:1.05rem;font-weight:700;color:var(--text-main);margin-top:4px;">
                    ${e.action}
                  </h4>
                </div>
                <div style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-dim);background:var(--bg-surface);padding:3px 8px;border-radius:4px;border:1px solid var(--border-subtle);">
                  ${Utils.formatDate(e.date)} • ${e.time}
                </div>
              </div>

              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:0.75rem;margin:0.75rem 0;font-size:0.84rem;">
                <div>
                  <span style="color:var(--text-dim);font-size:0.75rem;display:block;">Transfer Route:</span>
                  <span style="color:var(--text-main);font-weight:600;">${e.fromLocation} &rarr; ${e.toLocation}</span>
                </div>
                <div>
                  <span style="color:var(--text-dim);font-size:0.75rem;display:block;">Authorized Officer:</span>
                  <span style="color:var(--gold-primary);font-weight:600;"><i class="fa-solid fa-user-shield"></i> ${e.officer}</span>
                </div>
              </div>

              <div style="background:var(--bg-surface-hover);padding:0.75rem;border-radius:6px;border-left:3px solid var(--gold-primary);margin-top:8px;">
                <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Reason / Authority:</div>
                <div style="font-size:0.84rem;color:var(--text-main);margin-top:2px;">${e.reason}</div>
              </div>

              ${e.notes ? `
                <div style="font-size:0.78rem;color:var(--text-dim);margin-top:8px;">
                  <i class="fa-regular fa-clipboard"></i> Notes: ${e.notes}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Check if custody timeline has gaps (e.g. jumped from Stored directly to Admitted)
 */
function checkCustodySequenceIntegrity(events, evidenceItem) {
  if (events.length <= 1) return { hasAnomaly: false };

  // If evidence verification has a mismatch, warn directly
  if (evidenceItem && evidenceItem.verificationStatus === 'MISMATCH') {
    return {
      hasAnomaly: true,
      message: 'Critical: Cryptographic hash mismatch recorded during chain validation! Physical device integrity or raw bitstream has deviated.'
    };
  }

  // Check if events skipped registration or storage
  const actions = events.map(e => e.action);
  if (actions.includes('Evidence Submitted to Court') && !actions.includes('Evidence Stored')) {
    return {
      hasAnomaly: true,
      message: 'Sequence gap detected: Evidence was marked as submitted without prior secure vault storage record.'
    };
  }

  return { hasAnomaly: false };
}

function initCustodyListeners() {
  const form = document.getElementById('add-custody-form');
  if (form) {
    form.addEventListener('submit', handleAddCustodyEvent);
  }
}

/**
 * Modal to add custody event
 */
window.openAddCustodyModal = function(evidenceId) {
  const form = document.getElementById('add-custody-form');
  if (form) form.reset();

  const idInput = document.getElementById('custody-ev-id-input');
  const dateInput = document.getElementById('custody-date-input');
  const timeInput = document.getElementById('custody-time-input');

  if (idInput) idInput.value = evidenceId;
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  if (timeInput) timeInput.value = new Date().toTimeString().substring(0, 5);

  Utils.openModal('custody-modal');
};

async function handleAddCustodyEvent(e) {
  e.preventDefault();

  const payload = {
    evidenceId: document.getElementById('custody-ev-id-input').value,
    action: document.getElementById('custody-action-select').value,
    date: document.getElementById('custody-date-input').value,
    time: document.getElementById('custody-time-input').value,
    officer: document.getElementById('custody-officer-input').value.trim() || 'Marcus Vance',
    fromLocation: document.getElementById('custody-from-input').value.trim() || 'Central Vault',
    toLocation: document.getElementById('custody-to-input').value.trim() || 'Court Room 3',
    reason: document.getElementById('custody-reason-input').value.trim() || 'Judicial Hearing Transfer',
    notes: document.getElementById('custody-notes-input').value.trim() || 'Logged via CEMS Chain of Custody module'
  };

  try {
    await api.addCustodyEvent(payload);
    Utils.showToast('Custody transfer event successfully recorded to immutable ledger', 'success');
    Utils.closeModal('custody-modal');
    await loadCustodyData();
  } catch (err) {
    Utils.showToast('Error recording custody event: ' + err.message, 'error');
  }
}
