/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * documents.js - Judicial Document Repository, Demo File Ingestion & Preview Modal
 */

let allDocs = [];
let allCases = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadDocumentsData();
  initDocumentListeners();
});

async function loadDocumentsData() {
  try {
    [allDocs, allCases] = await Promise.all([
      api.getDocuments(),
      api.getCases()
    ]);

    populateCaseFilter();
    renderDocumentsTable();

  } catch (err) {
    console.error('Error loading documents:', err);
    Utils.showToast('Failed to load document records', 'error');
  }
}

function populateCaseFilter() {
  const caseSelect = document.getElementById('filter-doc-case');
  if (!caseSelect) return;

  caseSelect.innerHTML = `
    <option value="All">All Associated Cases</option>
    ${allCases.map(c => `<option value="${c.caseId}">${c.caseId} — ${c.caseTitle}</option>`).join('')}
  `;
}

function renderDocumentsTable() {
  const tbody = document.getElementById('documents-table-tbody');
  const countEl = document.getElementById('documents-count-label');
  const search = (document.getElementById('documents-search-input')?.value || '').trim().toLowerCase();
  const caseFilter = document.getElementById('filter-doc-case')?.value || 'All';
  const typeFilter = document.getElementById('filter-doc-type')?.value || 'All';

  const filtered = allDocs.filter(d => {
    const matchesSearch = !search ||
      d.id.toLowerCase().includes(search) ||
      d.caseId.toLowerCase().includes(search) ||
      d.documentName.toLowerCase().includes(search) ||
      d.documentType.toLowerCase().includes(search) ||
      d.uploadedBy.toLowerCase().includes(search);

    const matchesCase = (caseFilter === 'All' || d.caseId === caseFilter);
    const matchesType = (typeFilter === 'All' || d.documentType === typeFilter);

    return matchesSearch && matchesCase && matchesType;
  });

  if (countEl) countEl.textContent = `Showing ${filtered.length} legal documents`;
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 3rem 1rem;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-file-circle-xmark"></i></div>
            <h4>No documents match the active filter</h4>
            <p>Upload a new case order or report using the ingestion button above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(d => `
    <tr>
      <td data-label="Document ID">
        <span style="font-family:var(--font-mono);font-weight:700;color:var(--text-main);">${d.id}</span>
      </td>
      <td data-label="Case ID">
        <a href="case-details.html?id=${d.caseId}" style="font-family:var(--font-mono);font-weight:700;color:var(--gold-primary);">
          ${d.caseId}
        </a>
      </td>
      <td data-label="Document Name">
        <div style="font-weight:600;color:var(--text-main);">${d.documentName}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);">${d.fileSize || '3.2 MB'} • PDF Document</div>
      </td>
      <td data-label="Type"><span class="badge badge-gold">${d.documentType}</span></td>
      <td data-label="Version"><span class="badge" style="background:var(--bg-primary);">${d.version || 'v1.0'}</span></td>
      <td data-label="Uploaded By">
        <div style="font-size:0.82rem;">${d.uploadedBy}</div>
        <div style="font-size:0.72rem;color:var(--text-dim);">${Utils.formatDate(d.date)}</div>
      </td>
      <td data-label="Status">${Utils.renderStatusBadge(d.status)}</td>
      <td data-label="Actions">
        <div class="table-row-actions">
          <button class="btn btn-secondary btn-sm" onclick="openDocumentPreview('${d.id}')" title="Preview Document">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="demoDownloadDoc('${d.documentName}')" title="Download Local File">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function initDocumentListeners() {
  const searchInput = document.getElementById('documents-search-input');
  const caseFilter = document.getElementById('filter-doc-case');
  const typeFilter = document.getElementById('filter-doc-type');

  if (searchInput) searchInput.addEventListener('input', renderDocumentsTable);
  if (caseFilter) caseFilter.addEventListener('change', renderDocumentsTable);
  if (typeFilter) typeFilter.addEventListener('change', renderDocumentsTable);

  const form = document.getElementById('upload-doc-form');
  if (form) form.addEventListener('submit', handleUploadDocument);

  // Local demo file picker
  const fileInput = document.getElementById('doc-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        const file = fileInput.files[0];
        document.getElementById('doc-name-input').value = file.name;
        document.getElementById('doc-size-input').value = Utils.formatFileSize(file.size);
      }
    });
  }
}

window.openUploadDocModal = function() {
  const form = document.getElementById('upload-doc-form');
  if (form) form.reset();

  const caseSelect = document.getElementById('doc-case-select');
  if (caseSelect) {
    caseSelect.innerHTML = allCases.map(c => `
      <option value="${c.caseId}">${c.caseId} — ${c.caseTitle}</option>
    `).join('');
  }

  document.getElementById('doc-date-input').value = new Date().toISOString().split('T')[0];
  Utils.openModal('upload-doc-modal');
};

async function handleUploadDocument(e) {
  e.preventDefault();

  const docName = document.getElementById('doc-name-input').value.trim();
  if (!docName) {
    Utils.showToast('Please provide a document title', 'error');
    return;
  }

  const payload = {
    caseId: document.getElementById('doc-case-select').value,
    documentName: docName,
    documentType: document.getElementById('doc-type-select').value,
    uploadedBy: document.getElementById('doc-uploader-input').value.trim() || 'Court Officer',
    date: document.getElementById('doc-date-input').value,
    version: document.getElementById('doc-version-input').value.trim() || 'v1.0',
    fileSize: document.getElementById('doc-size-input').value || '1.8 MB',
    status: 'Verified'
  };

  try {
    await api.createDocument(payload);
    Utils.showToast(`Document "${docName}" successfully ingested into case docket`, 'success');
    Utils.closeModal('upload-doc-modal');
    await loadDocumentsData();
  } catch (err) {
    Utils.showToast('Error uploading document: ' + err.message, 'error');
  }
}

/**
 * Open Simulated Judicial Document Viewer
 */
window.openDocumentPreview = function(docId) {
  const doc = allDocs.find(d => d.id === docId);
  if (!doc) return;

  const container = document.getElementById('doc-preview-content');
  if (container) {
    container.innerHTML = `
      <div style="background:#FFFFFF;color:#0F172A;padding:2.5rem 2rem;border-radius:6px;box-shadow:var(--shadow-lg);font-family:Georgia, serif;line-height:1.7;">
        <div style="text-align:center;border-bottom:2px solid #0F172A;padding-bottom:1rem;margin-bottom:1.5rem;">
          <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;color:#64748B;">In the High Court of Judicature</div>
          <h2 style="font-size:1.4rem;text-transform:uppercase;margin:6px 0;letter-spacing:0.04em;">Official Judicial Record</h2>
          <div style="font-size:0.82rem;font-family:monospace;color:#334155;">CASE REFERENCE: ${doc.caseId} • DOC REF: ${doc.id}</div>
        </div>

        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:1.5rem;font-family:sans-serif;background:#F8FAFC;padding:0.75rem;border-radius:4px;border:1px solid #E2E8F0;">
          <div><strong>Document Type:</strong> ${doc.documentType}</div>
          <div><strong>Filing Version:</strong> ${doc.version}</div>
          <div><strong>Attestation Date:</strong> ${Utils.formatDate(doc.date)}</div>
        </div>

        <h3 style="font-size:1.15rem;margin-bottom:1rem;text-align:center;text-decoration:underline;">
          ${doc.documentName}
        </h3>

        <p style="font-size:0.95rem;margin-bottom:1rem;text-indent:2rem;">
          BE IT KNOWN that on this day, the undersigned officer attested that the attached digital and physical evidence inventories corresponding to Case Number <strong>${doc.caseId}</strong> have been cataloged in accordance with statutory rules of criminal and civil evidence procedure.
        </p>

        <p style="font-size:0.95rem;margin-bottom:1.5rem;text-indent:2rem;">
          The cryptographic SHA-256 signatures, chain-of-custody ledgers, and forensic write-block verification logs have been examined and recorded into the primary court docket. No unauthorized modification or sequence breach was detected prior to this deposition.
        </p>

        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:3rem;padding-top:1rem;border-top:1px dashed #CBD5E1;font-family:sans-serif;font-size:0.85rem;">
          <div>
            <div style="width:140px;height:40px;border-bottom:1px solid #000;margin-bottom:4px;"></div>
            <div><strong>Filed By:</strong> ${doc.uploadedBy}</div>
            <div style="color:#64748B;font-size:0.75rem;">Evidence & Records Custodian</div>
          </div>
          <div style="text-align:right;">
            <div style="display:inline-block;border:2px solid #D97706;color:#D97706;padding:4px 10px;border-radius:4px;font-weight:bold;font-size:0.8rem;text-transform:uppercase;">
              CEMS VERIFIED
            </div>
            <div style="font-size:0.72rem;color:#64748B;margin-top:4px;">Demo Judicial Seal</div>
          </div>
        </div>
      </div>
    `;
  }

  Utils.openModal('doc-preview-modal');
};

window.demoDownloadDoc = function(name) {
  Utils.showToast(`Initiating local download for: ${name}`, 'info', 'File Download');
};
