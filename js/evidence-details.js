/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * evidence-details.js - Evidence Profile, Evidentiary Media & Digital Asset Viewer,
 * Cryptographic Integrity Card & Chain of Custody Snapshot
 */

let currentEvidence = null;
let currentLightboxZoom = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const evidenceId = urlParams.get('id') || 'EVD-001';

  await loadEvidenceProfile(evidenceId);
  initLightboxControls();
});

async function loadEvidenceProfile(evidenceId) {
  try {
    currentEvidence = await api.getEvidenceById(evidenceId);
    if (!currentEvidence) {
      Utils.showToast(`Evidence ${evidenceId} not found`, 'error');
      setTimeout(() => window.location.href = 'evidence.html', 1500);
      return;
    }

    // Attempt to load full evidentiary media from IndexedDB Vault
    if (window.MediaStorage) {
      try {
        const storedMedia = await MediaStorage.getMedia(evidenceId);
        if (storedMedia && storedMedia.dataUrl) {
          currentEvidence.fileDataUrl = storedMedia.dataUrl;
          if (storedMedia.fileType) currentEvidence.fileType = storedMedia.fileType;
          if (storedMedia.fileName) currentEvidence.fileName = storedMedia.fileName;
        }
      } catch (mediaErr) {
        console.warn('Error reading from MediaStorage:', mediaErr);
      }
    }

    renderEvidenceHeader(currentEvidence);
    renderIntegrityCard(currentEvidence);
    await renderEvidenceMedia(currentEvidence);
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

/**
 * =========================================================================
 * EVIDENTIARY MEDIA & DIGITAL ASSET VIEWER
 * Handles: Real Photos, HTML5 Video, High-Fidelity Audio, Documents & Attachments
 * =========================================================================
 */
async function renderEvidenceMedia(e) {
  const card = document.getElementById('evidence-media-viewer-card');
  if (!card) return;

  const fileName = e.fileName || 'evidentiary_asset.dat';
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const fileType = (e.fileType || '').toLowerCase();
  const evType = (e.evidenceType || '').toLowerCase();

  // Determine media URL
  let mediaSrc = e.fileDataUrl || null;
  if (!mediaSrc && e.filePath) {
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.baseURL && !e.filePath.startsWith('http')) {
      mediaSrc = `${API_CONFIG.baseURL.replace('/api', '')}/${e.filePath.replace(/^\//, '')}`;
    } else {
      mediaSrc = e.filePath;
    }
  }

  // Classification
  const isImage = (mediaSrc && mediaSrc.startsWith('data:image/')) || 
                  fileType.startsWith('image/') || 
                  ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext) || 
                  evType === 'image';

  const isVideo = (mediaSrc && mediaSrc.startsWith('data:video/')) || 
                  fileType.startsWith('video/') || 
                  ['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv'].includes(ext) || 
                  evType === 'video' || 
                  evType.includes('cctv');

  const isAudio = (mediaSrc && mediaSrc.startsWith('data:audio/')) || 
                  fileType.startsWith('audio/') || 
                  ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(ext) || 
                  evType === 'audio';

  const isPdf = (mediaSrc && mediaSrc.startsWith('data:application/pdf')) || ext === 'pdf';

  let mediaBodyHtml = '';
  let badgeLabel = 'Digital Asset';
  let badgeIcon = 'fa-file';

  // 1. LIVE IMAGE PHOTO VIEWER
  if (isImage && mediaSrc) {
    badgeLabel = 'Photographic Evidence';
    badgeIcon = 'fa-camera';
    mediaBodyHtml = `
      <div style="background:radial-gradient(circle at center, #0e1726 0%, #030712 100%);padding:1.5rem;border-radius:10px;border:1px solid var(--border-medium);text-align:center;position:relative;">
        <div style="position:relative;display:inline-block;max-width:100%;">
          <img id="evidence-display-photo" src="${mediaSrc}" alt="${e.evidenceName}" style="max-height:480px;max-width:100%;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.7);cursor:zoom-in;transition:transform 0.2s ease;border:1px solid rgba(255,255,255,0.1);" onclick="openMediaLightbox('${mediaSrc}', '${Utils.escapeHtml(e.evidenceName)}', 'image')" />
          <div style="position:absolute;bottom:12px;right:12px;background:rgba(2,6,23,0.85);backdrop-filter:blur(6px);padding:4px 10px;border-radius:6px;font-size:0.75rem;color:var(--gold-primary);font-weight:700;border:1px solid var(--gold-border);pointer-events:none;">
            <i class="fa-solid fa-fingerprint"></i> SHA-256 Protected
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:1.25rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openMediaLightbox('${mediaSrc}', '${Utils.escapeHtml(e.evidenceName)}', 'image')">
            <i class="fa-solid fa-expand"></i> Inspect &amp; Zoom
          </button>
          <button type="button" class="btn btn-primary btn-sm" onclick="downloadEvidenceAsset('${mediaSrc}', '${e.fileName || 'evidence_photo.png'}')">
            <i class="fa-solid fa-download"></i> Download Photo (${e.fileSize || 'Original'})
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('attach-media-input').click()">
            <i class="fa-solid fa-arrows-rotate"></i> Replace File
          </button>
        </div>
      </div>
    `;
  }
  // 2. LIVE VIDEO PLAYER
  else if (isVideo && mediaSrc) {
    badgeLabel = 'Video / CCTV Recording';
    badgeIcon = 'fa-film';
    mediaBodyHtml = `
      <div style="background:#030712;padding:1rem;border-radius:10px;border:1px solid var(--border-medium);text-align:center;">
        <div style="position:relative;max-width:850px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,0.8);border:1px solid var(--border-subtle);">
          <video id="evidence-display-video" src="${mediaSrc}" controls playsinline preload="metadata" style="width:100%;max-height:460px;background:#000;display:block;"></video>
          <div style="position:absolute;top:10px;left:10px;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);padding:4px 10px;border-radius:4px;font-size:0.72rem;color:#f87171;font-weight:700;border:1px solid rgba(239,68,68,0.3);letter-spacing:0.04em;">
            <i class="fa-solid fa-circle" style="font-size:0.5rem;animation:pulse 1.5s infinite;"></i> EVIDENTIARY RECORDING • ${e.evidenceId}
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:1rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary btn-sm" onclick="downloadEvidenceAsset('${mediaSrc}', '${e.fileName || 'evidence_video.mp4'}')">
            <i class="fa-solid fa-download"></i> Download Video (${e.fileSize || 'Original'})
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('attach-media-input').click()">
            <i class="fa-solid fa-arrows-rotate"></i> Replace Video
          </button>
        </div>
      </div>
    `;
  }
  // 3. LIVE AUDIO PLAYER & SOUNDWAVE
  else if (isAudio && mediaSrc) {
    badgeLabel = 'Forensic Audio Deposition';
    badgeIcon = 'fa-microphone-lines';
    mediaBodyHtml = `
      <div style="background:linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(3,7,18,0.95) 100%);padding:1.75rem;border-radius:10px;border:1px solid var(--border-medium);">
        <!-- Soundwave Visualization Graphic -->
        <div style="display:flex;align-items:flex-end;justify-content:center;gap:4px;height:55px;padding:0 1rem;margin-bottom:1.5rem;opacity:0.85;">
          ${Array.from({ length: 42 }).map((_, idx) => {
            const heights = [20, 35, 50, 25, 45, 15, 55, 30, 40, 20, 50, 35, 15, 45, 55, 25, 35, 50, 20, 45, 30];
            const h = heights[idx % heights.length];
            return `<div style="width:4px;height:${h}%;background:linear-gradient(180deg, var(--gold-primary), #3b82f6);border-radius:2px;"></div>`;
          }).join('')}
        </div>

        <div style="max-width:650px;margin:0 auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-weight:700;color:var(--text-main);font-size:0.92rem;"><i class="fa-solid fa-volume-high" style="color:var(--gold-primary);margin-right:6px;"></i> ${e.fileName}</span>
            <span class="font-mono" style="font-size:0.78rem;color:var(--text-dim);">${e.fileSize || ''}</span>
          </div>
          <audio id="evidence-display-audio" src="${mediaSrc}" controls style="width:100%;height:44px;outline:none;filter:invert(0.9) hue-rotate(180deg);border-radius:8px;"></audio>
          
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:1rem;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:0.75rem;color:var(--text-dim);">Playback Speed:</span>
              <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:0.72rem;" onclick="setAudioSpeed(0.8)">0.8x</button>
              <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:0.72rem;" onclick="setAudioSpeed(1.0)">1.0x</button>
              <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:0.72rem;" onclick="setAudioSpeed(1.25)">1.25x</button>
              <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:0.72rem;" onclick="setAudioSpeed(1.5)">1.5x</button>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn btn-primary btn-sm" onclick="downloadEvidenceAsset('${mediaSrc}', '${e.fileName || 'evidence_audio.mp3'}')">
                <i class="fa-solid fa-download"></i> Download Audio
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('attach-media-input').click()">
                <i class="fa-solid fa-arrows-rotate"></i> Replace
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  // 4. LIVE PDF / DOCUMENT VIEWER
  else if (isPdf && mediaSrc) {
    badgeLabel = 'Documentary Evidence';
    badgeIcon = 'fa-file-pdf';
    mediaBodyHtml = `
      <div style="background:#090e1a;padding:1rem;border-radius:10px;border:1px solid var(--border-medium);text-align:center;">
        <div style="border-radius:8px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.7);height:480px;background:#1e293b;">
          <iframe src="${mediaSrc}#toolbar=1" style="width:100%;height:100%;border:none;"></iframe>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:1rem;">
          <button type="button" class="btn btn-primary btn-sm" onclick="downloadEvidenceAsset('${mediaSrc}', '${e.fileName || 'evidence_document.pdf'}')">
            <i class="fa-solid fa-download"></i> Download PDF Document
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('attach-media-input').click()">
            <i class="fa-solid fa-arrows-rotate"></i> Replace Document
          </button>
        </div>
      </div>
    `;
  }
  // 5. DEMO SAMPLE MEDIA OR FILE NOT YET ATTACHED (e.g. Existing EVD-010 or demo records)
  else {
    let specificPlaceholder = '';

    if (isImage) {
      badgeLabel = 'Photographic Asset';
      badgeIcon = 'fa-image';
      specificPlaceholder = `
        <div style="padding:2.5rem 1.5rem;text-align:center;">
          <div style="width:68px;height:68px;border-radius:50%;background:rgba(59,130,246,0.1);color:var(--accent-blue);display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1rem;border:1px solid rgba(59,130,246,0.25);">
            <i class="fa-solid fa-camera"></i>
          </div>
          <h4 style="color:var(--text-main);font-size:1.1rem;margin-bottom:6px;">Photo Exhibit Registered: <span class="font-mono" style="color:var(--gold-primary);">${e.fileName || 'Photograph'}</span></h4>
          <p style="color:var(--text-dim);font-size:0.85rem;max-width:540px;margin:0 auto 1.25rem;">
            This evidence exhibit is categorized as a photographic asset. Attach or drop the source image file below to render the real photo with forensic zoom and inspection tools.
          </p>
        </div>
      `;
    } else if (isVideo) {
      badgeLabel = 'Video Evidence Record';
      badgeIcon = 'fa-video';
      specificPlaceholder = `
        <div style="padding:2.5rem 1.5rem;text-align:center;">
          <div style="width:68px;height:68px;border-radius:50%;background:rgba(239,68,68,0.1);color:#f87171;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1rem;border:1px solid rgba(239,68,68,0.25);">
            <i class="fa-solid fa-film"></i>
          </div>
          <h4 style="color:var(--text-main);font-size:1.1rem;margin-bottom:6px;">Video / Surveillance Feed: <span class="font-mono" style="color:var(--gold-primary);">${e.fileName || 'Recording.mp4'}</span></h4>
          <p style="color:var(--text-dim);font-size:0.85rem;max-width:540px;margin:0 auto 1.25rem;">
            Digital video recording logged in CEMS evidence vault. Upload or drop the video media file to activate inline evidentiary playback.
          </p>
        </div>
      `;
    } else if (isAudio) {
      badgeLabel = 'Audio Recording';
      badgeIcon = 'fa-waveform-lines';
      specificPlaceholder = `
        <div style="padding:2.5rem 1.5rem;text-align:center;">
          <div style="width:68px;height:68px;border-radius:50%;background:rgba(245,158,11,0.1);color:var(--gold-primary);display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1rem;border:1px solid var(--gold-border);">
            <i class="fa-solid fa-volume-high"></i>
          </div>
          <h4 style="color:var(--text-main);font-size:1.1rem;margin-bottom:6px;">Audio Recording Exhibit: <span class="font-mono" style="color:var(--gold-primary);">${e.fileName || 'Audio.mp3'}</span></h4>
          <p style="color:var(--text-dim);font-size:0.85rem;max-width:540px;margin:0 auto 1.25rem;">
            Digital audio recording logged in CEMS evidence vault. Attach or drop the audio file below to activate the forensic audio console.
          </p>
        </div>
      `;
    } else {
      badgeLabel = 'Vault Digital Artifact';
      badgeIcon = 'fa-hard-drive';
      specificPlaceholder = `
        <div style="padding:2.5rem 1.5rem;text-align:center;">
          <div style="width:68px;height:68px;border-radius:50%;background:rgba(16,185,129,0.1);color:var(--status-active-text);display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1rem;border:1px solid rgba(16,185,129,0.25);">
            <i class="fa-solid fa-file-shield"></i>
          </div>
          <h4 style="color:var(--text-main);font-size:1.1rem;margin-bottom:6px;">Digital Ingestion Artifact: <span class="font-mono" style="color:var(--gold-primary);">${e.fileName || 'Asset'}</span></h4>
          <p style="color:var(--text-dim);font-size:0.85rem;max-width:540px;margin:0 auto 1.25rem;">
            Sealed forensic binary asset registered with SHA-256 integrity signature in CEMS repository.
          </p>
        </div>
      `;
    }

    mediaBodyHtml = `
      <div style="background:var(--bg-primary);border:1px dashed var(--border-medium);border-radius:10px;overflow:hidden;position:relative;" id="details-media-dropzone">
        ${specificPlaceholder}

        <div style="padding:1.25rem;border-top:1px solid var(--border-subtle);background:rgba(15,23,42,0.6);display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
          <input type="file" id="attach-media-input" style="display:none;" />
          <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('attach-media-input').click()">
            <i class="fa-solid fa-cloud-arrow-up"></i> Attach / Upload File for Instant Preview
          </button>
          <span style="font-size:0.75rem;color:var(--text-dim);">or drag &amp; drop source file here</span>
        </div>
      </div>
    `;
  }

  // Render Full Card
  card.innerHTML = `
    <input type="file" id="attach-media-input" style="display:none;" />
    <div class="cems-card-header">
      <div class="card-title-wrap">
        <h3><i class="fa-solid ${badgeIcon}" style="color:var(--gold-primary);"></i> Evidentiary Media &amp; Digital Asset Viewer</h3>
        <p>Interactive forensic asset inspection, verification and media playback</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="badge badge-active font-mono" style="font-size:0.75rem;">
          <i class="fa-solid fa-fingerprint"></i> ${badgeLabel}
        </span>
      </div>
    </div>
    <div class="cems-card-body" style="padding:1.25rem;">
      ${mediaBodyHtml}
    </div>
  `;

  // Bind attach / replace file listener
  initAttachFileInput(e);
}

/**
 * Handle attaching / replacing evidence media file directly on the details page
 */
function initAttachFileInput(e) {
  const fileInput = document.getElementById('attach-media-input');
  const dropzone = document.getElementById('details-media-dropzone');

  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      if (fileInput.files.length) {
        await handleAttachedFile(fileInput.files[0], e);
      }
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (ev) => {
        ev.preventDefault();
        dropzone.style.borderColor = 'var(--gold-primary)';
        dropzone.style.backgroundColor = 'rgba(245,158,11,0.05)';
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (ev) => {
        ev.preventDefault();
        dropzone.style.borderColor = 'var(--border-medium)';
        dropzone.style.backgroundColor = 'transparent';
      });
    });

    dropzone.addEventListener('drop', async (ev) => {
      if (ev.dataTransfer.files.length) {
        await handleAttachedFile(ev.dataTransfer.files[0], e);
      }
    });
  }
}

async function handleAttachedFile(file, evidenceRecord) {
  try {
    Utils.showToast('Ingesting evidentiary media file...', 'info');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      const computedSha = await Utils.computeSHA256(file);
      const isMatch = computedSha === (evidenceRecord.originalHash || evidenceRecord.hashValue);

      // Save to High-Capacity IndexedDB Vault
      if (window.MediaStorage) {
        await MediaStorage.saveMedia(evidenceRecord.evidenceId, {
          dataUrl: dataUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: Utils.formatFileSize(file.size),
          attachedAt: new Date().toISOString()
        });
      }

      // Update current in-memory evidence
      evidenceRecord.fileDataUrl = dataUrl;
      evidenceRecord.fileName = file.name;
      evidenceRecord.fileSize = Utils.formatFileSize(file.size);
      evidenceRecord.fileType = file.type;

      // Update local storage record if small enough
      if (dataUrl.length < 2 * 1024 * 1024) {
        StorageManager.updateItem(StorageKeys.EVIDENCE, evidenceRecord.evidenceId, {
          fileDataUrl: dataUrl,
          fileName: file.name,
          fileSize: Utils.formatFileSize(file.size),
          fileType: file.type
        });
      }

      // Re-render
      await renderEvidenceMedia(evidenceRecord);
      renderEvidenceMetadata(evidenceRecord);

      if (isMatch) {
        Utils.showToast('Media attached! Cryptographic hash matches registered evidence checksum.', 'success');
      } else {
        Utils.showToast('Media attached successfully! Live preview active.', 'success');
      }
    };
    reader.readAsDataURL(file);

  } catch (err) {
    console.error('Error attaching file:', err);
    Utils.showToast('Failed to attach media: ' + err.message, 'error');
  }
}

/**
 * Audio Speed Adjuster
 */
function setAudioSpeed(speed) {
  const audio = document.getElementById('evidence-display-audio');
  if (audio) {
    audio.playbackRate = speed;
    Utils.showToast(`Playback speed set to ${speed}x`, 'info');
  }
}

/**
 * Universal Asset Download Helper
 */
function downloadEvidenceAsset(dataUrl, filename) {
  if (!dataUrl) {
    Utils.showToast('Asset binary unavailable for download', 'error');
    return;
  }
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || 'evidence_asset';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  Utils.showToast(`Downloading evidentiary asset "${filename}"`, 'success');
}

/**
 * Lightbox Modal Controller for High-Resolution Forensic Image Inspection
 */
function initLightboxControls() {
  const modal = document.getElementById('media-lightbox-modal');
  if (!modal) return;

  const btnIn = document.getElementById('lightbox-zoom-in');
  const btnOut = document.getElementById('lightbox-zoom-out');
  const btnReset = document.getElementById('lightbox-zoom-reset');

  if (btnIn) {
    btnIn.addEventListener('click', () => {
      currentLightboxZoom = Math.min(currentLightboxZoom + 0.3, 4.0);
      applyLightboxZoom();
    });
  }

  if (btnOut) {
    btnOut.addEventListener('click', () => {
      currentLightboxZoom = Math.max(currentLightboxZoom - 0.3, 0.4);
      applyLightboxZoom();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      currentLightboxZoom = 1.0;
      applyLightboxZoom();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeMediaLightbox();
    }
  });
}

function openMediaLightbox(src, title, type = 'image') {
  const modal = document.getElementById('media-lightbox-modal');
  const body = document.getElementById('lightbox-content-body');
  const titleEl = document.getElementById('lightbox-title');
  const subtitleEl = document.getElementById('lightbox-subtitle');
  const downloadBtn = document.getElementById('lightbox-download');

  if (!modal || !body) return;

  currentLightboxZoom = 1.0;
  if (titleEl) titleEl.textContent = title || 'Forensic Evidentiary Asset Inspector';
  if (subtitleEl) subtitleEl.textContent = `EXHIBIT: ${currentEvidence?.evidenceId || 'EVD'} • SHA-256 CHECKED`;
  if (downloadBtn) {
    downloadBtn.onclick = (e) => {
      e.preventDefault();
      downloadEvidenceAsset(src, currentEvidence?.fileName || 'evidence_photo.png');
    };
  }

  body.innerHTML = `
    <img id="lightbox-inspect-img" src="${src}" alt="Forensic Inspection View" style="max-width:100%;max-height:72vh;border-radius:6px;transition:transform 0.15s ease;transform:scale(1);box-shadow:0 12px 40px rgba(0,0,0,0.9);" />
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function applyLightboxZoom() {
  const img = document.getElementById('lightbox-inspect-img');
  if (img) {
    img.style.transform = `scale(${currentLightboxZoom})`;
  }
}

function closeMediaLightbox() {
  const modal = document.getElementById('media-lightbox-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

window.openMediaLightbox = openMediaLightbox;
window.closeMediaLightbox = closeMediaLightbox;
window.downloadEvidenceAsset = downloadEvidenceAsset;
window.setAudioSpeed = setAudioSpeed;

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
