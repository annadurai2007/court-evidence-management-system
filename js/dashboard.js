/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * dashboard.js - Executive Dashboard Controller, Statistics & Dynamic Chart.js Analytics
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const [cases, evidence, hearings, submissions, activity] = await Promise.all([
      api.getCases(),
      api.getEvidence(),
      api.getHearings(),
      api.getSubmissions(),
      api.getActivityLogs()
    ]);

    // 1. Calculate & Render Top Statistics
    renderTopStats(cases, evidence);

    // 2. Render Secondary Mini Cards
    renderSecondaryStats(hearings, evidence, submissions);

    // 3. Render Court System Status Widget
    renderCourtStatusWidget();

    // 4. Render Chart.js Analytics
    initDashboardCharts(cases, evidence, hearings);

    // 5. Render Recent Cases Table
    renderRecentCases(cases);

    // 6. Render Recent Evidence Table
    renderRecentEvidence(evidence);

    // 7. Render Recent Activity Stream
    renderRecentActivity(activity);

  } catch (err) {
    console.error('Error loading dashboard metrics:', err);
    Utils.showToast('Failed to load dashboard data', 'error');
  }
}

/**
 * Top 6 KPI Metric Counters
 */
function renderTopStats(cases, evidence) {
  const totalCases = cases.length;
  const totalEvidence = evidence.length;
  const pendingVerification = evidence.filter(e => e.verificationStatus === 'MISMATCH' || e.courtStatus === 'Under Review').length;
  const courtSubmitted = evidence.filter(e => e.courtStatus === 'Submitted').length;
  const admittedEvidence = evidence.filter(e => e.courtStatus === 'Admitted').length;
  const rejectedEvidence = evidence.filter(e => e.courtStatus === 'Rejected' || e.verificationStatus === 'MISMATCH').length;

  animateCounter('stat-total-cases', totalCases);
  animateCounter('stat-total-evidence', totalEvidence);
  animateCounter('stat-pending-verification', pendingVerification);
  animateCounter('stat-court-submitted', courtSubmitted);
  animateCounter('stat-admitted-evidence', admittedEvidence);
  animateCounter('stat-rejected-evidence', rejectedEvidence);
}

function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  let current = 0;
  const step = Math.max(1, Math.floor(targetValue / 20));
  const timer = setInterval(() => {
    current += step;
    if (current >= targetValue) {
      el.textContent = targetValue;
      clearInterval(timer);
    } else {
      el.textContent = current;
    }
  }, 25);
}

/**
 * 4 Secondary KPI Cards
 */
function renderSecondaryStats(hearings, evidence, submissions) {
  const upcomingHearings = hearings.filter(h => h.status === 'Scheduled').length;
  const awaitingReview = evidence.filter(e => e.courtStatus === 'Under Review').length;
  const recentSubs = submissions.length;
  const custodyAlerts = evidence.filter(e => e.verificationStatus === 'MISMATCH').length;

  const hEl = document.getElementById('sec-upcoming-hearings');
  const rEl = document.getElementById('sec-awaiting-review');
  const sEl = document.getElementById('sec-recent-submissions');
  const cEl = document.getElementById('sec-custody-alerts');

  if (hEl) hEl.textContent = `${upcomingHearings} Scheduled`;
  if (rEl) rEl.textContent = `${awaitingReview} Records`;
  if (sEl) sEl.textContent = `${recentSubs} Transferred`;
  if (cEl) cEl.textContent = `${custodyAlerts} Flagged`;
}

/**
 * Court System Status Widget (Demo UI Indicators)
 */
function renderCourtStatusWidget() {
  const statusContainer = document.getElementById('court-status-panel');
  if (!statusContainer) return;

  const modules = [
    { name: 'Case Management', meta: 'Bench Active', status: 'Operational', cls: 'badge-operational' },
    { name: 'Evidence Registry', meta: 'Vault Intact', status: 'Operational', cls: 'badge-operational' },
    { name: 'Verification Engine', meta: 'SHA-256 Crypto', status: 'Operational', cls: 'badge-operational' },
    { name: 'Court Submission', meta: 'Judicial Gateway', status: 'Pending Review', cls: 'badge-attention' },
    { name: 'Hearing Schedule', meta: 'Dockets Synced', status: 'Operational', cls: 'badge-operational' },
    { name: 'Audit Log', meta: 'Tamper Resistant', status: 'Operational', cls: 'badge-operational' }
  ];

  statusContainer.innerHTML = modules.map(m => `
    <div class="status-module-item">
      <div class="module-info">
        <span class="module-name">${m.name}</span>
        <span class="module-meta">${m.meta}</span>
      </div>
      <span class="badge ${m.cls}">
        <span class="badge-dot"></span> ${m.status}
      </span>
    </div>
  `).join('');
}

/**
 * 4 Charts using Chart.js via CDN
 */
function initDashboardCharts(cases, evidence, hearings) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js CDN not loaded yet');
    return;
  }

  // Chart Global Styling for Legal Theme
  Chart.defaults.color = '#94A3B8';
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.font.size = 11;

  // 1. Evidence Status Chart (Doughnut)
  const ctxStatus = document.getElementById('chart-evidence-status');
  if (ctxStatus) {
    const statusCounts = {
      'Admitted': evidence.filter(e => e.courtStatus === 'Admitted').length,
      'Submitted': evidence.filter(e => e.courtStatus === 'Submitted').length,
      'Under Review': evidence.filter(e => e.courtStatus === 'Under Review').length,
      'Registered': evidence.filter(e => e.courtStatus === 'Registered').length,
      'Rejected': evidence.filter(e => e.courtStatus === 'Rejected').length
    };

    new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#10B981', '#38BDF8', '#F59E0B', '#64748B', '#EF4444'],
          borderColor: '#131E35',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } }
        },
        cutout: '70%'
      }
    });
  }

  // 2. Cases by Type (Bar Chart)
  const ctxCases = document.getElementById('chart-cases-type');
  if (ctxCases) {
    const typeCounts = {};
    cases.forEach(c => {
      typeCounts[c.caseType] = (typeCounts[c.caseType] || 0) + 1;
    });

    new Chart(ctxCases, {
      type: 'bar',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          label: 'Active Cases',
          data: Object.values(typeCounts),
          backgroundColor: 'rgba(245, 158, 11, 0.75)',
          borderRadius: 6,
          borderColor: '#F59E0B',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 3. Evidence Submitted by Month (Line Chart)
  const ctxMonthly = document.getElementById('chart-evidence-monthly');
  if (ctxMonthly) {
    new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep 2026'],
        datasets: [{
          label: 'Evidence Ingestion Volume',
          data: [12, 19, 14, 25, 22, 31],
          borderColor: '#38BDF8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#38BDF8',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 4. Hearing Statistics (Polar Area)
  const ctxHearings = document.getElementById('chart-hearing-stats');
  if (ctxHearings) {
    new Chart(ctxHearings, {
      type: 'polarArea',
      data: {
        labels: ['Trial', 'Preliminary', 'Evidence Hearing', 'Final Hearing', 'Bail Hearing'],
        datasets: [{
          data: [4, 7, 6, 2, 3],
          backgroundColor: [
            'rgba(245, 158, 11, 0.65)',
            'rgba(56, 189, 248, 0.65)',
            'rgba(16, 185, 129, 0.65)',
            'rgba(168, 85, 247, 0.65)',
            'rgba(239, 68, 68, 0.65)'
          ],
          borderColor: '#131E35'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } } },
        scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } } }
      }
    });
  }
}

/**
 * Render Recent Cases Table
 */
function renderRecentCases(cases) {
  const tbody = document.getElementById('dashboard-recent-cases-tbody');
  if (!tbody) return;

  const recent = cases.slice(0, 5);
  tbody.innerHTML = recent.map(c => `
    <tr>
      <td data-label="Case ID">
        <a href="case-details.html?id=${c.caseId}" style="font-weight:700;font-family:var(--font-mono);color:var(--gold-primary);">
          ${c.caseId}
        </a>
      </td>
      <td data-label="Case Title">
        <div style="font-weight:600;color:var(--text-main);">${c.caseTitle}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);">${c.caseNumber}</div>
      </td>
      <td data-label="Court">${c.courtName}</td>
      <td data-label="Type"><span class="badge badge-gold">${c.caseType}</span></td>
      <td data-label="Status">${Utils.renderStatusBadge(c.status)}</td>
      <td data-label="Hearing">${c.nextHearingDate || '—'}</td>
      <td data-label="Actions">
        <a href="case-details.html?id=${c.caseId}" class="btn btn-secondary btn-sm" title="View Profile">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </td>
    </tr>
  `).join('');
}

/**
 * Render Recent Evidence Table
 */
function renderRecentEvidence(evidence) {
  const tbody = document.getElementById('dashboard-recent-evidence-tbody');
  if (!tbody) return;

  const recent = evidence.slice(0, 5);
  tbody.innerHTML = recent.map(e => `
    <tr>
      <td data-label="Evidence ID">
        <a href="evidence-details.html?id=${e.evidenceId}" style="font-weight:700;font-family:var(--font-mono);color:var(--accent-blue);">
          ${e.evidenceId}
        </a>
      </td>
      <td data-label="Case ID">
        <a href="case-details.html?id=${e.caseId}" style="color:var(--text-muted);font-size:0.8rem;font-family:var(--font-mono);">
          ${e.caseId}
        </a>
      </td>
      <td data-label="Evidence Name">
        <div style="font-weight:600;color:var(--text-main);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.evidenceName}</div>
        <div style="font-size:0.75rem;color:var(--text-dim);">${e.fileName || 'Physical Record'}</div>
      </td>
      <td data-label="Type"><span class="badge" style="background:var(--bg-primary);">${e.evidenceType}</span></td>
      <td data-label="Integrity">
        <span class="badge ${e.verificationStatus === 'VERIFIED' ? 'badge-verified' : 'badge-mismatch'}">
          <i class="fa-solid ${e.verificationStatus === 'VERIFIED' ? 'fa-shield-halved' : 'fa-triangle-exclamation'}"></i>
          ${e.verificationStatus}
        </span>
      </td>
      <td data-label="Court Status">${Utils.renderStatusBadge(e.courtStatus)}</td>
      <td data-label="Actions">
        <a href="evidence-details.html?id=${e.evidenceId}" class="btn btn-secondary btn-sm" title="Inspect">
          <i class="fa-solid fa-microscope"></i>
        </a>
      </td>
    </tr>
  `).join('');
}

/**
 * Render Live Activity Stream
 */
function renderRecentActivity(activity) {
  const listEl = document.getElementById('dashboard-activity-list');
  if (!listEl) return;

  const recent = activity.slice(0, 6);
  listEl.innerHTML = recent.map(a => {
    let icon = 'fa-clock-rotate-left';
    if (a.action.includes('Evidence')) icon = 'fa-box-archive';
    else if (a.action.includes('Hearing')) icon = 'fa-gavel';
    else if (a.action.includes('Verified')) icon = 'fa-shield-halved';
    else if (a.action.includes('Case')) icon = 'fa-folder-closed';
    else if (a.action.includes('Document')) icon = 'fa-file-lines';

    return `
      <div class="feed-item">
        <div class="feed-icon-wrap">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div class="feed-content">
          <div class="feed-text">
            <strong>${a.user}</strong> performed <em>${a.action}</em> on <strong>${a.referenceId}</strong>
          </div>
          <div class="feed-time">${a.timestamp} • ${a.module}</div>
        </div>
      </div>
    `;
  }).join('');
}
