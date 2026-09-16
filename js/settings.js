/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * settings.js - Preferences, Theme Engine, System Diagnostics & Demo Data Factory Reset
 */

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initSettingsListeners();
});

function loadSettings() {
  const settings = StorageManager.getData(StorageKeys.SETTINGS) || {};

  // Theme Select
  const themeRadios = document.querySelectorAll('input[name="theme-choice"]');
  themeRadios.forEach(radio => {
    if (radio.value === (settings.theme || 'dark')) {
      radio.checked = true;
    }
  });

  // Compact Mode
  const compactCheck = document.getElementById('setting-compact-mode');
  if (compactCheck) compactCheck.checked = !!settings.compactMode;

  // Alerts & Notifications
  const alertsCheck = document.getElementById('setting-custody-alerts');
  const emailsCheck = document.getElementById('setting-email-notifs');
  if (alertsCheck) alertsCheck.checked = settings.custodyAlerts !== false;
  if (emailsCheck) emailsCheck.checked = settings.emailNotifications !== false;

  // Default Court
  const courtInput = document.getElementById('setting-default-court');
  if (courtInput && settings.defaultCourt) courtInput.value = settings.defaultCourt;

  // Storage Diagnostics
  renderStorageStats();
}

function renderStorageStats() {
  const statsContainer = document.getElementById('storage-diagnostics-container');
  if (!statsContainer) return;

  let totalBytes = 0;
  let keyCounts = {};

  Object.values(StorageKeys).forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw) {
      totalBytes += raw.length * 2; // approx 2 bytes per char
      try {
        const parsed = JSON.parse(raw);
        keyCounts[key] = Array.isArray(parsed) ? parsed.length : 1;
      } catch (e) {
        keyCounts[key] = 1;
      }
    } else {
      keyCounts[key] = 0;
    }
  });

  statsContainer.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:1rem;">
      <div style="background:var(--bg-primary);padding:1rem;border-radius:8px;border:1px solid var(--border-subtle);">
        <div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;">Storage Used</div>
        <div style="font-size:1.3rem;font-weight:700;color:var(--gold-primary);margin-top:2px;">
          ${(totalBytes / 1024).toFixed(2)} KB
        </div>
        <div style="font-size:0.72rem;color:var(--text-dim);margin-top:2px;">Browser LocalStorage quota: ~5 MB</div>
      </div>
      <div style="background:var(--bg-primary);padding:1rem;border-radius:8px;border:1px solid var(--border-subtle);">
        <div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;">Active Records</div>
        <div style="font-size:1.3rem;font-weight:700;color:var(--accent-blue);margin-top:2px;">
          ${(keyCounts[StorageKeys.CASES] || 0) + (keyCounts[StorageKeys.EVIDENCE] || 0) + (keyCounts[StorageKeys.CUSTODY] || 0)}
        </div>
        <div style="font-size:0.72rem;color:var(--text-dim);margin-top:2px;">Cases, Evidence & Custody Logs</div>
      </div>
      <div style="background:var(--bg-primary);padding:1rem;border-radius:8px;border:1px solid var(--border-subtle);">
        <div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;">Architecture</div>
        <div style="font-size:1.3rem;font-weight:700;color:var(--status-active-text);margin-top:2px;">
          REST Ready
        </div>
        <div style="font-size:0.72rem;color:var(--text-dim);margin-top:2px;">Decoupled api.js Client Layer</div>
      </div>
    </div>
  `;
}

function initSettingsListeners() {
  // Theme Toggle listener
  const themeRadios = document.querySelectorAll('input[name="theme-choice"]');
  themeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const chosen = e.target.value;
      if (chosen === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      saveSettingKey('theme', chosen);
      Utils.showToast(`Theme changed to ${chosen} mode`, 'info');
    });
  });

  // Compact Mode Toggle
  const compactCheck = document.getElementById('setting-compact-mode');
  if (compactCheck) {
    compactCheck.addEventListener('change', (e) => {
      document.body.classList.toggle('compact-mode', e.target.checked);
      saveSettingKey('compactMode', e.target.checked);
      Utils.showToast(`Compact density ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  // Alerts Toggle
  const alertsCheck = document.getElementById('setting-custody-alerts');
  if (alertsCheck) {
    alertsCheck.addEventListener('change', (e) => {
      saveSettingKey('custodyAlerts', e.target.checked);
      Utils.showToast(`Custody anomaly alerts ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });
  }

  // Email Alerts Toggle
  const emailsCheck = document.getElementById('setting-email-notifs');
  if (emailsCheck) {
    emailsCheck.addEventListener('change', (e) => {
      saveSettingKey('emailNotifications', e.target.checked);
      Utils.showToast(`Notification digests updated`, 'info');
    });
  }

  // Reset to Factory Demo Seed
  const resetBtn = document.getElementById('btn-reset-demo-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      Utils.confirmModal(
        'Reset Demonstration Data',
        'This will clear all local changes and re-seed the authentic baseline legal mock dataset (cases, evidence hashes, custody events, hearings). Proceed?',
        () => {
          StorageManager.initDemoData(true);
          Utils.showToast('Demo environment restored to baseline dataset', 'success');
          setTimeout(() => window.location.reload(), 800);
        },
        'Reset Demo Data',
        true
      );
    });
  }

  // Export JSON Backup
  const exportJsonBtn = document.getElementById('btn-export-backup-json');
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      const backup = {};
      Object.values(StorageKeys).forEach(k => {
        backup[k] = StorageManager.getData(k);
      });
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `CEMS_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      Utils.showToast('Exported complete demonstration JSON database', 'success');
    });
  }

  // Import JSON Backup
  const importFileInput = document.getElementById('import-json-file-input');
  if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          Object.keys(parsed).forEach(k => {
            StorageManager.saveData(k, parsed[k]);
          });
          Utils.showToast('Database successfully imported from JSON backup', 'success');
          setTimeout(() => window.location.reload(), 800);
        } catch (err) {
          Utils.showToast('Invalid JSON file format: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });
  }
}

function saveSettingKey(key, value) {
  const current = StorageManager.getData(StorageKeys.SETTINGS) || {};
  current[key] = value;
  StorageManager.saveData(StorageKeys.SETTINGS, current);
}
