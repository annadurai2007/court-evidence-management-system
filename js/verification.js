/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * verification.js - Evidence Integrity Laboratory & Real-time Web Crypto SHA-256 Verifier
 */

let allCases = [];
let allEvidence = [];
let selectedEvidence = null;
let computedFileHash = '';

document.addEventListener('DOMContentLoaded', async () => {
  await loadVerificationLab();
  initLabListeners();
});

async function loadVerificationLab() {
  try {
    [allCases, allEvidence] = await Promise.all([
      api.getCases(),
      api.getEvidence()
    ]);

    populateCaseDropdown();

    // Check URL parameters for pre-selected evidence
    const urlParams = new URLSearchParams(window.location.search);
    const prefillEvId = urlParams.get('id');

    if (prefillEvId) {
      const ev = allEvidence.find(e => e.evidenceId === prefillEvId);
      if (ev) {
        document.getElementById('verify-case-select').value = ev.caseId;
        updateEvidenceDropdown(ev.caseId);
        document.getElementById('verify-evidence-select').value = ev.evidenceId;
        onEvidenceSelected(ev.evidenceId);
      }
    } else if (allCases.length) {
      updateEvidenceDropdown(allCases[0].caseId);
    }

  } catch (err) {
    console.error('Error initializing verification lab:', err);
    Utils.showToast('Failed to initialize verification laboratory', 'error');
  }
}

function populateCaseDropdown() {
  const select = document.getElementById('verify-case-select');
  if (!select) return;

  select.innerHTML = allCases.map(c => `
    <option value="${c.caseId}">${c.caseId} — ${c.caseTitle}</option>
  `).join('');

  select.addEventListener('change', (e) => {
    updateEvidenceDropdown(e.target.value);
  });
}

function updateEvidenceDropdown(caseId) {
  const evSelect = document.getElementById('verify-evidence-select');
  if (!evSelect) return;

  const caseEvidence = allEvidence.filter(e => e.caseId === caseId);

  if (!caseEvidence.length) {
    evSelect.innerHTML = `<option value="">No evidence found for this case</option>`;
    selectedEvidence = null;
    renderEvidenceTargetCard(null);
    return;
  }

  evSelect.innerHTML = caseEvidence.map(e => `
    <option value="${e.evidenceId}">${e.evidenceId} — ${e.evidenceName} (${e.evidenceType})</option>
  `).join('');

  evSelect.addEventListener('change', (e) => {
    onEvidenceSelected(e.target.value);
  });

  // Select first item
  onEvidenceSelected(caseEvidence[0].evidenceId);
}

function onEvidenceSelected(evidenceId) {
  selectedEvidence = allEvidence.find(e => e.evidenceId === evidenceId) || null;
  renderEvidenceTargetCard(selectedEvidence);
  resetVerificationResults();
}

function renderEvidenceTargetCard(e) {
  const targetContainer = document.getElementById('verification-target-card');
  if (!targetContainer) return;

  if (!e) {
    targetContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-dim);">
        Select a registered evidence record to examine its baseline cryptographic signature.
      </div>
    `;
    return;
  }

  targetContainer.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
      <div>
        <span class="badge badge-gold" style="font-size:0.68rem;">Target Baseline</span>
        <h3 style="font-size:1.2rem;font-weight:700;color:var(--text-main);margin-top:4px;">
          ${e.evidenceName}
        </h3>
        <div style="font-size:0.8rem;color:var(--text-dim);margin-top:2px;">
          ID: <strong style="color:var(--accent-blue);font-family:var(--font-mono);">${e.evidenceId}</strong> • 
          Case: <strong style="color:var(--gold-primary);font-family:var(--font-mono);">${e.caseId}</strong> • 
          Type: <strong>${e.evidenceType}</strong>
        </div>
      </div>
      <div>
        ${Utils.renderStatusBadge(e.courtStatus)}
      </div>
    </div>

    <div style="margin-top:1.25rem;background:var(--bg-primary);padding:1rem;border-radius:8px;border:1px solid var(--border-subtle);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:0.75rem;font-weight:700;color:var(--gold-primary);text-transform:uppercase;">
          <i class="fa-solid fa-fingerprint"></i> Registered Baseline Hash (${e.hashAlgorithm || 'SHA-256'})
        </span>
        <button class="btn-text-action" onclick="Utils.copyToClipboard('${e.originalHash || e.hashValue}', 'Baseline Hash')">
          <i class="fa-solid fa-copy"></i> Copy
        </button>
      </div>
      <div id="target-baseline-hash" class="font-mono" style="font-size:0.85rem;color:var(--text-main);word-break:break-all;letter-spacing:0.04em;">
        ${e.originalHash || e.hashValue}
      </div>
      <div style="font-size:0.72rem;color:var(--text-dim);margin-top:6px;">
        Original Collection: ${Utils.formatDate(e.collectionDate)} by ${e.collectedBy}
      </div>
    </div>
  `;
}

function initLabListeners() {
  const dropzone = document.getElementById('lab-dropzone');
  const fileInput = document.getElementById('lab-file-input');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length) {
        processLabFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        processLabFile(fileInput.files[0]);
      }
    });
  }

  // Quick Simulation Buttons for Easy Academic Demonstration
  const btnSimMatch = document.getElementById('btn-sim-match');
  const btnSimMismatch = document.getElementById('btn-sim-mismatch');

  if (btnSimMatch) {
    btnSimMatch.addEventListener('click', () => {
      if (!selectedEvidence) {
        Utils.showToast('Please select an evidence record first', 'warning');
        return;
      }
      runComparison(selectedEvidence.originalHash || selectedEvidence.hashValue, 'Simulated Authentic File');
    });
  }

  if (btnSimMismatch) {
    btnSimMismatch.addEventListener('click', () => {
      if (!selectedEvidence) {
        Utils.showToast('Please select an evidence record first', 'warning');
        return;
      }
      // Corrupt the hash slightly
      const original = selectedEvidence.originalHash || selectedEvidence.hashValue;
      const corrupted = 'ffff' + original.substring(4);
      runComparison(corrupted, 'Simulated Altered / Tampered File');
    });
  }
}

async function processLabFile(file) {
  if (!selectedEvidence) {
    Utils.showToast('Please select an evidence item first', 'warning');
    return;
  }

  const statusMsg = document.getElementById('lab-hashing-status');
  if (statusMsg) {
    statusMsg.innerHTML = `<span style="color:var(--gold-primary);"><i class="fa-solid fa-spinner fa-spin"></i> Reading file and calculating SHA-256 checksum in memory...</span>`;
  }

  try {
    const hash = await Utils.computeSHA256(file);
    computedFileHash = hash;
    if (statusMsg) statusMsg.innerHTML = '';
    runComparison(hash, `${file.name} (${Utils.formatFileSize(file.size)})`);
  } catch (err) {
    console.error(err);
    if (statusMsg) statusMsg.innerHTML = `<span style="color:#EF4444;">Error hashing file: ${err.message}</span>`;
  }
}

async function runComparison(testHash, sourceLabel) {
  if (!selectedEvidence) return;

  const resultCard = document.getElementById('lab-result-card');
  if (resultCard) {
    resultCard.style.display = 'block';
    resultCard.className = 'cems-card integrity-card animate-fade-in';
    resultCard.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:14px;padding:2rem;color:var(--gold-primary);">
        <i class="fa-solid fa-shield-halved fa-spin" style="font-size:1.6rem;"></i>
        <div>
          <div style="font-weight:700;font-size:0.95rem;">Evaluating Cryptographic Signatures...</div>
          <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px;">Comparing Web Crypto SHA-256 bitstream against registered court vault baseline</div>
        </div>
      </div>
    `;
  }

  // Subtle verification scan latency
  await new Promise(resolve => setTimeout(resolve, 320));

  const originalHash = (selectedEvidence.originalHash || selectedEvidence.hashValue).toLowerCase().trim();
  const normalizedTest = testHash.toLowerCase().trim();
  const isMatch = originalHash === normalizedTest;

  // Persist result through API layer
  await api.verifyEvidence(selectedEvidence.evidenceId, testHash);

  renderVerificationResult(isMatch, originalHash, normalizedTest, sourceLabel);
}

function renderVerificationResult(isMatch, originalHash, testHash, sourceLabel) {
  const resultCard = document.getElementById('lab-result-card');
  if (!resultCard) return;

  resultCard.style.display = 'block';
  resultCard.className = `cems-card integrity-card ${isMatch ? 'verified' : 'mismatch'}`;

  resultCard.innerHTML = `
    <div class="integrity-header">
      <div class="integrity-icon">
        <i class="fa-solid ${isMatch ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
      </div>
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:${isMatch ? 'var(--status-active-text)' : 'var(--status-danger-text)'};">
          ${isMatch ? '✓ HASH MATCH — INTEGRITY CONFIRMED' : '✕ HASH MISMATCH — TAMPER DETECTED'}
        </h2>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-top:2px;">
          ${isMatch 
            ? 'Evidence integrity verified in demo environment. The file byte stream produces an identical SHA-256 digest.'
            : 'The selected file does not match the stored demo hash. Cryptographic checksum variance indicates the asset has been modified or corrupted.'
          }
        </p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1.25rem;">
      <div style="background:var(--bg-primary);padding:0.85rem 1rem;border-radius:6px;border:1px solid var(--border-subtle);">
        <div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;font-weight:700;">Tested File / Source</div>
        <div style="font-size:0.88rem;font-weight:600;color:var(--text-main);">${sourceLabel}</div>
      </div>

      <div style="background:var(--bg-primary);padding:0.85rem 1rem;border-radius:6px;border:1px solid var(--border-subtle);">
        <div style="font-size:0.75rem;color:var(--gold-primary);text-transform:uppercase;font-weight:700;">Baseline Stored Hash</div>
        <div class="font-mono" style="font-size:0.85rem;color:var(--text-main);word-break:break-all;">${originalHash}</div>
      </div>

      <div style="background:var(--bg-primary);padding:0.85rem 1rem;border-radius:6px;border:1px solid ${isMatch ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};">
        <div style="font-size:0.75rem;color:${isMatch ? 'var(--status-active-text)' : 'var(--status-danger-text)'};text-transform:uppercase;font-weight:700;">
          Computed Cryptographic Hash
        </div>
        <div class="font-mono" style="font-size:0.85rem;color:${isMatch ? 'var(--status-active-text)' : 'var(--status-danger-text)'};word-break:break-all;">
          ${testHash}
        </div>
      </div>
    </div>

    <div style="margin-top:1.25rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
      <div style="font-size:0.75rem;color:var(--text-dim);">
        <i class="fa-solid fa-lock"></i> Web Crypto API Algorithm: SHA-256 (256-bit digest)
      </div>
      <a href="evidence-details.html?id=${selectedEvidence.evidenceId}" class="btn btn-secondary btn-sm">
        <i class="fa-solid fa-arrow-right"></i> Return to Evidence Profile
      </a>
    </div>
  `;

  if (isMatch) {
    Utils.showToast('Evidence hash confirmed valid and authentic', 'success', 'Verification Succeeded');
  } else {
    Utils.showToast('Cryptographic mismatch flagged in audit trail', 'error', 'Integrity Breach');
  }
}

function resetVerificationResults() {
  const resultCard = document.getElementById('lab-result-card');
  if (resultCard) {
    resultCard.style.display = 'none';
    resultCard.innerHTML = '';
  }
}
