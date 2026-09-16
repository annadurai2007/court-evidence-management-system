/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * activity.js - Immutable Audit Activity Log, Filter Engine & CSV Exporter
 */

let allActivities = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadActivityLogs();
  initActivityListeners();
});

async function loadActivityLogs() {
  try {
    allActivities = await api.getActivityLogs();
    renderActivityTable();
  } catch (err) {
    console.error('Error loading activity logs:', err);
    Utils.showToast('Failed to load audit logs', 'error');
  }
}

function renderActivityTable() {
  const tbody = document.getElementById('activity-table-tbody');
  const countEl = document.getElementById('activity-count-label');
  const search = (document.getElementById('activity-search-input')?.value || '').trim().toLowerCase();
  const moduleFilter = document.getElementById('filter-activity-module')?.value || 'All';

  const filtered = allActivities.filter(a => {
    const matchesSearch = !search ||
      a.id.toLowerCase().includes(search) ||
      a.user.toLowerCase().includes(search) ||
      a.action.toLowerCase().includes(search) ||
      a.module.toLowerCase().includes(search) ||
      a.referenceId.toLowerCase().includes(search) ||
      (a.details && a.details.toLowerCase().includes(search));

    const matchesModule = (moduleFilter === 'All' || a.module === moduleFilter);

    return matchesSearch && matchesModule;
  });

  if (countEl) countEl.textContent = `Showing ${filtered.length} logged audit events`;
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 3rem 1rem;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <h4>No audit activity records found</h4>
            <p>Try refining your search keyword or reset module filters.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(a => {
    let statusBadge = `<span class="badge badge-active"><i class="fa-solid fa-check"></i> ${a.status}</span>`;
    if (a.status === 'Warning') {
      statusBadge = `<span class="badge badge-pending"><i class="fa-solid fa-triangle-exclamation"></i> Warning</span>`;
    } else if (a.status === 'Danger' || a.status === 'Error') {
      statusBadge = `<span class="badge badge-rejected"><i class="fa-solid fa-circle-xmark"></i> Breach</span>`;
    }

    return `
      <tr>
        <td data-label="Log ID">
          <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-dim);">${a.id}</span>
        </td>
        <td data-label="Timestamp">
          <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-main);">${a.timestamp}</div>
        </td>
        <td data-label="User">
          <div style="font-weight:600;color:var(--gold-primary);"><i class="fa-solid fa-user-shield" style="font-size:0.75rem;"></i> ${a.user}</div>
        </td>
        <td data-label="Action">
          <strong style="color:var(--text-main);">${a.action}</strong>
        </td>
        <td data-label="Module">
          <span class="badge" style="background:var(--bg-primary);border:1px solid var(--border-subtle);">${a.module}</span>
        </td>
        <td data-label="Reference ID">
          <span style="font-family:var(--font-mono);color:var(--accent-blue);font-weight:600;">${a.referenceId}</span>
        </td>
        <td data-label="Details" style="max-width:300px;">
          <div style="font-size:0.82rem;color:var(--text-muted);">${a.details || '—'}</div>
        </td>
        <td data-label="Status">${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

function initActivityListeners() {
  const searchInput = document.getElementById('activity-search-input');
  const moduleFilter = document.getElementById('filter-activity-module');
  const exportBtn = document.getElementById('btn-export-activity');
  const clearBtn = document.getElementById('btn-clear-activity');

  if (searchInput) searchInput.addEventListener('input', renderActivityTable);
  if (moduleFilter) moduleFilter.addEventListener('change', renderActivityTable);

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const rows = allActivities.map(a => ({
        'Activity ID': a.id,
        'Timestamp': a.timestamp,
        'User': a.user,
        'Action': a.action,
        'Module': a.module,
        'Reference ID': a.referenceId,
        'Status': a.status,
        'Details': a.details
      }));
      Utils.exportToCSV(`CEMS_Audit_Log_${new Date().toISOString().split('T')[0]}`, rows);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      Utils.confirmModal(
        'Clear Audit Trail Records',
        'Are you sure you want to purge demonstration activity logs? This is for demo reset purposes only.',
        () => {
          StorageManager.saveData(StorageKeys.ACTIVITY, []);
          allActivities = [];
          renderActivityTable();
          Utils.showToast('Demo audit log cleared', 'info');
        },
        'Clear Logs',
        true
      );
    });
  }
}
