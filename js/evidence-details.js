/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * evidence-details.js - Evidence Profile, Cryptographic Integrity Card & Chain of Custody Snapshot
 */

let currentEvidence = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const evidenceId = urlParams.get('id') || 'EVD-001';

  await loadEvidenceProfile(evidenceId);
});

async function loadEvidenceProfile(evidenceId) {
  try {
    currentEvidence = await api.getEvidenceById(evidenceId);
    if (!currentEvidence) {
      Utils.showToast(`Evidence ${evidenceId} not found`, 'error');
      setTimeout(() => window.location.href = 'evidence.html', 1500);
      return;
    }

    renderEvidenceHeader(currentEvidence);
    renderIntegrityCard(currentEvidence);
    renderEvidenceMetadata(currentEvidence);
    await renderCustodySnapshot(evidenceId);

  } catch (err) {
    console.error('Error loading evidence profile:', err);
    Utils.showToast('Failed to load evidence details', 'error');
  }
}

function renderEvidenceHeader(e) {
  document.title = `${e.evidenceId} - ${e.evidenceName} | CEMS`;

  const titleEl = document.getElementById('evidence-hero-title');
  const metaEl = document.getElementById('evidence-hero-meta');
  const statusEl = document.getElementById('evidence-hero-status');
  const verifyEl = document.getElementById('evidence-hero-verification');

  if (titleEl) titleEl.textContent = e.evidenceName;
  if (metaEl) {
    metaEl.innerHTML = `
      <span><strong style="color:var(--accent-blue);font-family:var(--font-mono);">${e.evidenceId}</strong></span>
      <span>•</span>
      <span>Case: <a href="case-details.html?id=${e.caseId}" style="color:var(--gold-primary);font-family:var(--font-mono);">${e.caseId}</a></span>
      <span>•</span>
      <span>Type: <strong style="color:var(--text-main);">${e.evidenceType}</strong></span>
      <span>•</span>
      <span>Collected: ${Utils.formatDate(e.collectionDate)}</span>
    `;
  }
  if (statusEl) statusEl.innerHTML = Utils.renderStatusBadge(e.courtStatus);
  if (verifyEl) {
    verifyEl.innerHTML = `
      <span class="badge ${e.verificationStatus === 'VERIFIED' ? 'badge-verified' : 'badge-mismatch'}">
        <i class="fa-solid ${e.verificationStatus === 'VERIFIED' ? 'fa-shield-halved' : 'fa-triangle-exclamation'}"></i>
        ${e.verificationStatus}
      </span>
    `;
  }

  // Quick Action Buttons
  const verifyBtn = document.getElementById('btn-quick-verify');
  const submitBtn = document.getElementById('btn-quick-submit');
  const custodyBtn = document.getElementById('btn-view-custody');

  if (verifyBtn) verifyBtn.href = `verification.html?id=${e.evidenceId}`;
  if (custodyBtn) custodyBtn.href = `custody.html?id=${e.evidenceId}`;
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      window.location.href = `court-submission.html?evidenceId=${e.evidenceId}&caseId=${e.caseId}`;
    });
  }
}

/**
 * Render Cryptographic Evidence Integrity Card
 */
function renderIntegrityCard(e) {
  const card = document.getElementById('evidence-integrity-card');
  if (!card) return;

  const isVerified = e.verificationStatus === 'VERIFIED';
  card.className = `cems-card integrity-card ${isVerified ? 'verified' : 'mismatch'}`;

  card.innerHTML = `
    <div class="integrity-header">
      <div class="integrity-icon">
        <i class="fa-solid ${isVerified ? 'fa-shield-check' : 'fa-triangle-exclamation'}"></i>
      </div>
      <div>
        <h3 style="font-size:1.15rem;font-weight:700;color:var(--text-main);">
          ${isVerified ? 'Cryptographic Integrity Verified' : 'Integrity Mismatch Detected'}
        </h3>
        <p style="font-size:0.8rem;color:var(--text-dim);margin-top:2px;">
          ${isVerified ? 'Digital fingerprint matches baseline seizure checksum exactly.' : 'Current file state does NOT match the initial registered hash. Flagged for review.'}
        </p>
      </div>
      <div style="margin-left:auto;">
        <a href="verification.html?id=${e.evidenceId}" class="btn btn-sm ${isVerified ? 'btn-secondary' : 'btn-danger'}">
          <i class="fa-solid fa-microscope"></i> Test File in Verification Lab
        </a>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1rem;margin-top:1.25rem;">
      <div style="background:var(--bg-primary);padding:1rem;border-radius:8px;border:1px solid var(--border-subtle);">
        <div style="font-size:0.75rem;font-weight:700;color:var(--gold-primary);text-transform:uppercase;margin-bottom:4px;">
          Registered Original Hash (${e.hashAlgorithm || 'SHA-256'})
        </div>
        <div class="font-mono" style="font-size:0.85rem;color:var(--text-main);word-break:break-all;">
          ${e.originalHash || e.hashValue}
        </div>
      </div>

      <div style="background:var(--bg-primary);padding:1rem;border-radius:8px;border:1px solid var(--border-subtle);">
        <div style="font-size:0.75rem;font-weight:700;color:${isVerified ? 'var(--status-active-text)' : 'var(--status-danger-text)'};text-transform:uppercase;margin-bottom:4px;">
          Current Verification State
        </div>
        <div class="font-mono" style="font-size:0.85rem;color:var(--text-main);word-break:break-all;">
          ${e.currentHash || e.hashValue}
        </div>
        <div style="font-size:0.72rem;color:var(--text-dim);margin-top:6px;">
          Last Verified: ${e.lastVerified || 'Recent'}
        </div>
      </div>
    </div>
  `;
}

function renderEvidenceMetadata(e) {
  setFieldText('ev-meta-id', e.evidenceId);
  setFieldText('ev-meta-case', e.caseId);
  setFieldText('ev-meta-name', e.evidenceName);
  setFieldText('ev-meta-type', e.evidenceType);
  setFieldText('ev-meta-filename', e.fileName || 'N/A');
  setFieldText('ev-meta-filesize', e.fileSize || 'N/A');
  setFieldText('ev-meta-officer', e.collectedBy);
  setFieldText('ev-meta-date', `${Utils.formatDate(e.collectionDate)} at ${e.collectionTime || '—'}`);
  setFieldText('ev-meta-location', e.collectionLocation);
  setFieldText('ev-meta-source', e.source);
  setFieldText('ev-meta-courtstatus', e.courtStatus);
  setFieldText('ev-meta-description', e.description);
  setFieldText('ev-meta-notes', e.notes);
}

function setFieldText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '—';
}

/**
 * Custody Snapshot on Evidence Profile
 */
async function renderCustodySnapshot(evidenceId) {
  const container = document.getElementById('evidence-custody-snapshot');
  if (!container) return;

  const custodyEvents = await api.getCustody(evidenceId);

  if (!custodyEvents.length) {
    container.innerHTML = `<p style="color:var(--text-dim);font-size:0.85rem;">No custody events recorded yet.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="custody-timeline" style="margin: 1rem 0 0 0;">
      ${custodyEvents.slice(0, 4).map(c => `
        <div class="custody-item" style="margin-bottom:1.25rem;">
          <div class="custody-node" style="width:18px;height:18px;left:-1.75rem;top:2px;"><i class="fa-solid fa-check" style="font-size:0.55rem;color:var(--gold-primary);"></i></div>
          <div class="custody-card" style="padding:0.85rem 1rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <strong style="color:var(--text-main);font-size:0.88rem;">${c.action}</strong>
              <span style="font-size:0.74rem;color:var(--text-dim);">${Utils.formatDate(c.date)} • ${c.time}</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:3px;">
              ${c.fromLocation} &rarr; ${c.toLocation}
            </div>
            <div style="font-size:0.72rem;color:var(--gold-primary);margin-top:4px;">
              Officer: ${c.officer}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:1rem;text-align:right;">
      <a href="custody.html?id=${evidenceId}" class="btn btn-secondary btn-sm">
        <i class="fa-solid fa-timeline"></i> View Full Chain of Custody (${custodyEvents.length} Events)
      </a>
    </div>
  `;
}
