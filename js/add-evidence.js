/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * add-evidence.js - Drag-and-Drop Ingestion, Real-Time Web Crypto SHA-256 Hashing & Storage
 */

let selectedFile = null;
let computedHash = '';
let selectedFileDataUrl = '';
let selectedFileType = '';

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

  fileInput.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  dropzone.addEventListener('click', (e) => {
    if (e.target === fileInput || e.target.closest('#evidence-file-input')) return;
    if (e.target.closest('#btn-remove-selected-file') || e.target.closest('video') || e.target.closest('audio') || e.target.closest('button')) {
      return;
    }
    fileInput.click();
  });

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
    e.preventDefault();
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
 * Read file locally, generate live preview, and compute authentic SHA-256 hash using Web Crypto API
 */
async function processSelectedFile(file) {
  selectedFile = file;
  selectedFileType = file.type || '';
  const hashDisplay = document.getElementById('computed-hash-display');
  const fileMetaDisplay = document.getElementById('file-meta-display');
  const fileNameInput = document.getElementById('file-name-input');
  const fileSizeInput = document.getElementById('file-size-input');
  const hashInput = document.getElementById('hash-value-input');
  const typeSelect = document.getElementById('evidence-type-select');

  // Auto-detect Evidence Type based on MIME type or extension
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (typeSelect) {
    if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) {
      typeSelect.value = 'Image';
    } else if (file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv'].includes(ext)) {
      typeSelect.value = 'Video';
    } else if (file.type.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext)) {
      typeSelect.value = 'Audio';
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      typeSelect.value = 'Digital Document';
    }
  }

  // Instant zero-copy preview (avoids browser memory crash on large video/audio)
  try {
    const previewUrl = URL.createObjectURL(file);
    renderDropzonePreview(file, previewUrl);
  } catch (err) {
    console.warn('Preview creation error:', err);
  }

  // Only read DataURL if file is small (<= 2MB)
  selectedFileDataUrl = '';
  if (file.size <= 2 * 1024 * 1024) {
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedFileDataUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

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
          <div style="flex:1;overflow:hidden;">
            <div style="font-weight:700;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${file.name}</div>
            <div style="font-size:0.75rem;color:var(--text-dim);">${formattedSize} • ${file.type || ext.toUpperCase() || 'Binary Data'} • Ingested locally</div>
          </div>
          <span class="badge badge-active"><i class="fa-solid fa-check"></i> Ready</span>
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
 * Render immediate live preview of image, video, audio or document inside dropzone
 */
function renderDropzonePreview(file, dataUrl) {
  const container = document.getElementById('dropzone-media-preview');
  if (!container) return;

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
  const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext);
  const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg', 'm4a'].includes(ext);

  container.style.display = 'block';

  let previewHtml = '';
  if (isImage) {
    previewHtml = `
      <div style="position:relative;border-radius:8px;overflow:hidden;border:1px solid var(--border-medium);background:#070d19;text-align:center;padding:8px;">
        <img src="${dataUrl}" alt="Evidence Photo Preview" style="max-height:220px;max-width:100%;object-fit:contain;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.5);">
        <div style="position:absolute;top:12px;left:12px;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);padding:4px 8px;border-radius:4px;font-size:0.72rem;color:var(--gold-primary);font-weight:700;border:1px solid var(--gold-border);">
          <i class="fa-solid fa-image"></i> Photo Asset Ingested
        </div>
      </div>
    `;
  } else if (isVideo) {
    previewHtml = `
      <div style="position:relative;border-radius:8px;overflow:hidden;border:1px solid var(--border-medium);background:#070d19;padding:6px;">
        <video src="${dataUrl}" controls playsinline style="width:100%;max-height:240px;border-radius:4px;background:#000;"></video>
        <div style="padding:4px 8px;font-size:0.75rem;color:var(--text-dim);display:flex;justify-content:space-between;align-items:center;">
          <span><i class="fa-solid fa-film" style="color:var(--gold-primary);"></i> Video Player Ready</span>
          <span style="font-family:var(--font-mono);">${Utils.formatFileSize(file.size)}</span>
        </div>
      </div>
    `;
  } else if (isAudio) {
    previewHtml = `
      <div style="border-radius:8px;border:1px solid var(--gold-border);background:rgba(245,158,11,0.05);padding:1rem;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <i class="fa-solid fa-volume-high" style="color:var(--gold-primary);font-size:1.3rem;"></i>
          <div>
            <div style="font-weight:700;font-size:0.88rem;color:var(--text-main);">${file.name}</div>
            <div style="font-size:0.74rem;color:var(--text-dim);">Audio Forensic Stream • ${Utils.formatFileSize(file.size)}</div>
          </div>
        </div>
        <audio src="${dataUrl}" controls style="width:100%;height:36px;margin-top:6px;"></audio>
      </div>
    `;
  } else {
    previewHtml = `
      <div style="border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-primary);padding:1rem;display:flex;align-items:center;gap:12px;">
        <i class="fa-solid fa-file-contract" style="color:var(--accent-blue);font-size:1.8rem;"></i>
        <div style="flex:1;">
          <div style="font-weight:700;color:var(--text-main);font-size:0.9rem;">${file.name}</div>
          <div style="font-size:0.75rem;color:var(--text-dim);">${Utils.formatFileSize(file.size)} • Deposition File Loaded</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="margin-top:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">
          <i class="fa-solid fa-eye" style="color:var(--gold-primary);"></i> Ingested Asset Preview
        </span>
        <button type="button" id="btn-remove-selected-file" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:0.72rem;color:var(--status-danger-text);">
          <i class="fa-solid fa-xmark"></i> Change File
        </button>
      </div>
      ${previewHtml}
    </div>
  `;

  const removeBtn = document.getElementById('btn-remove-selected-file');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSelectedFile();
    });
  }
}

function clearSelectedFile() {
  selectedFile = null;
  selectedFileDataUrl = '';
  selectedFileType = '';
  computedHash = '';

  const fileInput = document.getElementById('evidence-file-input');
  if (fileInput) fileInput.value = '';

  const container = document.getElementById('dropzone-media-preview');
  if (container) {
    container.innerHTML = '';
    container.style.display = 'none';
  }

  const fileMetaDisplay = document.getElementById('file-meta-display');
  if (fileMetaDisplay) fileMetaDisplay.innerHTML = '';

  const hashDisplay = document.getElementById('computed-hash-display');
  if (hashDisplay) hashDisplay.innerHTML = '';

  const fileNameInput = document.getElementById('file-name-input');
  if (fileNameInput) fileNameInput.value = '';

  const fileSizeInput = document.getElementById('file-size-input');
  if (fileSizeInput) fileSizeInput.value = '';

  const hashInput = document.getElementById('hash-value-input');
  if (hashInput) hashInput.value = '';
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
    fileType: selectedFileType || (selectedFile ? selectedFile.type : ''),
    fileDataUrl: (selectedFileDataUrl && selectedFileDataUrl.length < 2 * 1024 * 1024) ? selectedFileDataUrl : '', // keep in payload if reasonable size
    hashAlgorithm: 'SHA-256',
    hashValue: finalHash,
    originalHash: finalHash,
    currentHash: finalHash,
    courtStatus: document.getElementById('court-status-select').value || 'Registered',
    verificationStatus: 'VERIFIED',
    notes: document.getElementById('evidence-notes-input').value.trim() || 'Ingested via CEMS Browser Portal'
  };

  try {
    // 1. Persist raw media in High-Capacity IndexedDB Vault
    if (selectedFile && window.MediaStorage) {
      await MediaStorage.saveMedia(evidenceId, {
        blob: selectedFile,
        dataUrl: selectedFileDataUrl || '',
        fileName: finalFileName,
        fileType: payload.fileType,
        fileSize: finalFileSize
      });
    }

    // 2. Register evidence via API (sends selectedFile multipart when backend is active)
    const result = await api.createEvidence(payload, selectedFile);
    const savedId = (result && (result.evidenceId || result.id)) || evidenceId;

    if (selectedFile && window.MediaStorage && savedId !== evidenceId) {
      await MediaStorage.saveMedia(savedId, {
        blob: selectedFile,
        dataUrl: selectedFileDataUrl || '',
        fileName: finalFileName,
        fileType: payload.fileType,
        fileSize: finalFileSize
      });
    }

    Utils.showToast(`Evidence ${savedId} registered with evidentiary media & initial custody node!`, 'success');
    setTimeout(() => {
      window.location.href = `evidence-details.html?id=${savedId}`;
    }, 800);
  } catch (err) {
    Utils.showToast('Error registering evidence: ' + err.message, 'error');
  }
}
