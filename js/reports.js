/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * reports.js - Judicial Report Generation, window.print() Engine & CSV Exporter
 */

let currentReportData = null;

document.addEventListener('DOMContentLoaded', () => {
  initReports();
});

function initReports() {
  const select = document.getElementById('report-type-select');
  const generateBtn = document.getElementById('btn-generate-report');
  const printBtn = document.getElementById('btn-print-report');
  const exportBtn = document.getElementById('btn-export-csv');

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const type = select?.value || 'CaseSummary';
      generateReport(type);
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      if (!currentReportData || !currentReportData.data.length) {
        Utils.showToast('Please generate a report first before printing', 'warning');
        return;
      }
      window.print();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (!currentReportData || !currentReportData.data.length) {
        Utils.showToast('Please generate a report first before exporting', 'warning');
        return;
      }
      const filename = `CEMS_${currentReportData.type}_${new Date().toISOString().split('T')[0]}`;
      Utils.exportToCSV(filename, currentReportData.data);
    });
  }

  // Generate initial default report
  generateReport('CaseSummary');
}

async function generateReport(type) {
  const container = document.getElementById('report-preview-container');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 3rem; text-align: center; color: var(--gold-primary);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 12px;"></i>
      <h4>Compiling Certified Court Report...</h4>
    </div>
  `;

  try {
    currentReportData = await api.getReports(type);
    renderReportView(currentReportData);
    Utils.showToast(`${currentReportData.title} compiled with ${currentReportData.data.length} records`, 'success');
  } catch (err) {
    console.error('Error compiling report:', err);
    container.innerHTML = `<div style="color:var(--status-danger-text);padding:2rem;">Failed to compile report: ${err.message}</div>`;
  }
}

function renderReportView(report) {
  const container = document.getElementById('report-preview-container');
  if (!container) return;

  if (!report.data || !report.data.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-file-invoice"></i></div>
        <h4>No records available for this report type</h4>
      </div>
    `;
    return;
  }

  const columns = Object.keys(report.data[0]);

  container.innerHTML = `
    <!-- Print-Only Court Header -->
    <div class="print-header" style="display:none;">
      <h2>In the High Court of Judicature</h2>
      <p>CENTRAL EVIDENCE & DOCKET MANAGEMENT REPOSITORY</p>
      <div style="font-size:10pt;font-weight:bold;margin-top:6px;">${report.title.toUpperCase()}</div>
      <div style="font-size:8pt;color:#666;">Generated on ${Utils.formatDate(report.generatedAt)} • CEMS Academic/Demo Prototype</div>
    </div>

    <!-- On-Screen Report Card Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:1rem;border-bottom:1px solid var(--border-subtle);margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
      <div>
        <div style="font-size:0.75rem;font-weight:700;color:var(--gold-primary);text-transform:uppercase;letter-spacing:0.08em;">
          Official Docket Compilation
        </div>
        <h3 style="font-size:1.3rem;font-weight:800;color:var(--text-main);margin-top:2px;">
          ${report.title}
        </h3>
        <div style="font-size:0.8rem;color:var(--text-dim);margin-top:2px;">
          Certified records extracted at: ${new Date(report.generatedAt).toLocaleString()}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="badge badge-gold">${report.data.length} Records</span>
        <span class="demo-pill">Demo Mode</span>
      </div>
    </div>

    <!-- Report Table -->
    <div class="cems-table-responsive">
      <table class="cems-table">
        <thead>
          <tr>
            ${columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${report.data.map(row => `
            <tr>
              ${columns.map(col => {
                const val = row[col];
                let formatted = val !== null && val !== undefined ? val : '—';
                if (col.toLowerCase().includes('hash')) {
                  formatted = `<span class="hash-pill">${Utils.truncateHash(val, 8, 6)}</span>`;
                } else if (col.toLowerCase().includes('status') || col.toLowerCase().includes('verification')) {
                  formatted = Utils.renderStatusBadge(val);
                } else if (col.toLowerCase().includes('priority')) {
                  formatted = Utils.renderPriorityBadge(val);
                }
                return `<td>${formatted}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Print Signatures Block -->
    <div class="print-signatures" style="display:none;">
      <div class="sig-block">
        <strong>Prepared by:</strong><br>
        Evidence Officer / Custodian<br>
        Date: __________________
      </div>
      <div class="sig-block">
        <strong>Certified & Attested:</strong><br>
        Registrar / Judicial Officer<br>
        Seal & Signature
      </div>
    </div>
  `;
}
