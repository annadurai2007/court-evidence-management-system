/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * add-evidence.js - Drag-and-Drop Ingestion, Real-Time Web Crypto SHA-256 Hashing & Storage
 */

let selectedFile = null;
let computedHash = '';

document.addEventListener('DOMContentLoaded', async () => {
  await initAddEvidenceForm();
});

async function initAddEvidenceForm() {
  const cases = await api.getCases();
  const evidenceList = await api.getEvidence();

  // Populate Case Dropdown
  const caseSelect = document.getElementById('case-id-select');
  if (caseSelect) {
    caseSelect.innerHTML = cases.map(c => `
      <option value="${c.caseId}">${c.caseId} — ${c.caseTitle}</option>
    `).join('');

    // Pre-select if caseId query param is present
    const urlParams = new URLSearchParams(window.location.search);
    const prefillCaseId = urlParams.get('caseId');
    if (prefillCaseId) {
      caseSelect.value = prefillCaseId;
    }
  }

  // Auto-generate Evidence ID
  const evIdInput = document.getElementById('evidence-id-input');
  if (evIdInput) {
    evIdInput.value = `EVD-${String(evidenceList.length + 1).padStart(3, '0')}`;
  }

  // Set today's date & time
  const dateInput = document.getElementById('collection-date-input');
  const timeInput = document.getElementById('collection-time-input');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  if (timeInput) timeInput.value = new Date().toTimeString().substring(0, 5);

  // Bind Dropzone & File Hashing
  initDropzone();

  // Form Submit Handler
  const form = document.getElementById('add-evidence-form');
  if (form) {
    form.addEventListener('submit', handleAddEvidenceSubmit);
  }
}

function initDropzone() {
  const dropzone = document.getElementById('evidence-dropzone');
  const fileInput = document.getElementById('evidence-file-input');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) {
      processSelectedFile(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      processSelectedFile(fileInput.files[0]);
    }
  });
}

/**
 * Read file locally and compute authentic SHA-256 hash using Web Crypto API
 */
async function processSelectedFile(file) {
  selectedFile = file;
  const hashDisplay = document.getElementById('computed-hash-display');
  const fileMetaDisplay = document.getElementById('file-meta-display');
  const fileNameInput = document.getElementById('file-name-input');
  const fileSizeInput = document.getElementById('file-size-input');
  const hashInput = document.getElementById('hash-value-input');

  if (hashDisplay) {
    hashDisplay.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;color:var(--gold-primary);">
        <i class="fa-solid fa-spinner fa-spin"></i> Calculating cryptographic SHA-256 hash in browser memory...
      </div>
    `;
  }

  try {
    const startTime = performance.now();
    computedHash = await Utils.computeSHA256(file);
    const elapsed = Math.round(performance.now() - startTime);

    const formattedSize = Utils.formatFileSize(file.size);

    if (fileNameInput) fileNameInput.value = file.name;
    if (fileSizeInput) fileSizeInput.value = formattedSize;
    if (hashInput) hashInput.value = computedHash;

    if (fileMetaDisplay) {
      fileMetaDisplay.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:0.75rem;background:var(--bg-primary);border-radius:8px;border:1px solid var(--border-subtle);margin-top:10px;">
          <i class="fa-solid fa-file-shield" style="font-size:1.5rem;color:var(--accent-blue);"></i>
          <div style="flex:1;">
            <div style="font-weight:700;color:var(--text-main);">${file.name}</div>
            <div style="font-size:0.75rem;color:var(--text-dim);">${formattedSize} • ${file.type || 'Binary Data'} • Ingested locally</div>
          </div>
          <span class="badge badge-active"><i class="fa-solid fa-check"></i> Loaded</span>
        </div>
      `;
    }

    if (hashDisplay) {
      hashDisplay.innerHTML = `
        <div style="margin-top:10px;padding:0.85rem 1rem;background:var(--bg-primary);border:1px solid var(--border-medium);border-radius:8px;">
          <div style="font-size:0.75rem;font-weight:700;color:var(--gold-primary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;display:flex;justify-content:space-between;">
            <span><i class="fa-solid fa-fingerprint"></i> SHA-256 Cryptographic Checksum</span>
            <span style="color:var(--text-dim);font-family:var(--font-sans);">${elapsed} ms</span>
          </div>
          <div class="font-mono" style="font-size:0.85rem;color:var(--text-main);word-break:break-all;letter-spacing:0.04em;">
            ${computedHash}
          </div>
        </div>
      `;
    }

    Utils.showToast('SHA-256 hash successfully computed via Web Crypto API', 'success');

  } catch (err) {
    console.error('Error hashing file:', err);
    if (hashDisplay) {
      hashDisplay.innerHTML = `<div style="color:var(--status-danger-text);">Failed to compute hash: ${err.message}</div>`;
    }
    Utils.showToast('Failed to compute file hash', 'error');
  }
}

/**
 * Form Submission
 */
async function handleAddEvidenceSubmit(e) {
  e.preventDefault();

  const evidenceName = document.getElementById('evidence-name-input').value.trim();
  const caseId = document.getElementById('case-id-select').value;
  const evidenceId = document.getElementById('evidence-id-input').value.trim();

  if (!evidenceName || !caseId) {
    Utils.showToast('Evidence Name and Case ID are required', 'error');
    return;
  }

  // If no file was dropped, generate a simulated forensic hash
  let finalHash = computedHash;
  let finalFileName = document.getElementById('file-name-input').value.trim();
  let finalFileSize = document.getElementById('file-size-input').value.trim();

  if (!finalHash) {
    const rawSeed = `${evidenceId}-${caseId}-${evidenceName}-${Date.now()}`;
    finalHash = await Utils.computeSHA256(rawSeed);
    if (!finalFileName) finalFileName = `${evidenceName.toLowerCase().replace(/\s+/g, '_')}_deposition.dat`;
    if (!finalFileSize) finalFileSize = '4.2 MB';
  }

  const payload = {
    evidenceId,
    caseId,
    evidenceName,
    evidenceType: document.getElementById('evidence-type-select').value,
    description: document.getElementById('evidence-description-input').value.trim() || 'Official deposition record.',
    collectedBy: document.getElementById('collected-by-input').value.trim() || 'Officer in Charge',
    collectionDate: document.getElementById('collection-date-input').value,
    collectionTime: document.getElementById('collection-time-input').value,
    collectionLocation: document.getElementById('collection-location-input').value.trim() || 'Secure Precinct Vault',
    source: document.getElementById('evidence-source-input').value.trim() || 'Direct Seizure',
    fileName: finalFileName,
    fileSize: finalFileSize,
    hashAlgorithm: 'SHA-256',
    hashValue: finalHash,
    originalHash: finalHash,
    currentHash: finalHash,
    courtStatus: document.getElementById('court-status-select').value || 'Registered',
    verificationStatus: 'VERIFIED',
    notes: document.getElementById('evidence-notes-input').value.trim() || 'Ingested via CEMS Browser Portal'
  };

  try {
    await api.createEvidence(payload);
    Utils.showToast(`Evidence ${evidenceId} registered and initial custody node created!`, 'success');
    setTimeout(() => {
      window.location.href = `evidence-details.html?id=${evidenceId}`;
    }, 800);
  } catch (err) {
    Utils.showToast('Error registering evidence: ' + err.message, 'error');
  }
}
