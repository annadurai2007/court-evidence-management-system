/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * utils.js - Global Utilities, Cryptographic SHA-256, UI Helpers, Toasts & Modals
 */

const Utils = {
  /**
   * Compute real cryptographic SHA-256 hash using the Web Crypto API
   * Accepts ArrayBuffer, Blob/File, or String
   * Returns a 64-character lowercase hexadecimal string
   */
  async computeSHA256(input) {
    let buffer;
    if (input instanceof ArrayBuffer) {
      buffer = input;
    } else if (input instanceof Blob) {
      buffer = await input.arrayBuffer();
    } else if (typeof input === 'string') {
      const encoder = new TextEncoder();
      buffer = encoder.encode(input).buffer;
    } else {
      throw new Error('Unsupported input type for SHA-256 computation');
    }

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Format file size into human readable string (Bytes, KB, MB, GB)
   */
  formatFileSize(bytes) {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * Truncate cryptographic hash for clean UI display with tooltip copy
   */
  truncateHash(hash, lead = 10, trail = 8) {
    if (!hash) return '—';
    if (hash.length <= lead + trail) return hash;
    return `${hash.substring(0, lead)}...${hash.substring(hash.length - trail)}`;
  },

  /**
   * Format date into clean localized string
   */
  formatDate(dateStr) {
    if (!dateStr || dateStr === '—') return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Copy text to clipboard and trigger feedback toast
   */
  async copyToClipboard(text, label = 'Content') {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(`${label} copied to clipboard`, 'info', 'Copied');
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast(`${label} copied to clipboard`, 'info', 'Copied');
    }
  },

  /**
   * Show toast notification
   * Types: 'success', 'error', 'warning', 'info'
   */
  showToast(message, type = 'info', title = null) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    let defaultTitle = 'Notice';

    if (type === 'success') {
      iconClass = 'fa-circle-check';
      defaultTitle = 'Success';
    } else if (type === 'error') {
      iconClass = 'fa-triangle-exclamation';
      defaultTitle = 'Error';
    } else if (type === 'warning') {
      iconClass = 'fa-triangle-exclamation';
      defaultTitle = 'Warning';
    }

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${title || defaultTitle}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 250);
      }
    }, 4500);
  },

  /**
   * Open modal dialog by element ID
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Close modal dialog by element ID
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Generic confirmation dialog
   */
  confirmModal(title, message, onConfirm, confirmText = 'Confirm', isDanger = false) {
    let modal = document.getElementById('cems-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cems-confirm-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-container" style="max-width: 460px;">
          <div class="modal-header">
            <h3 id="confirm-modal-title" style="display:flex;align-items:center;gap:8px;">
              <i class="fa-solid fa-triangle-exclamation" style="color:var(--gold-primary);"></i>
              <span>Confirm Action</span>
            </h3>
            <button class="modal-close" id="confirm-modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-message" style="color:var(--text-muted);font-size:0.92rem;line-height:1.6;"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="confirm-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="confirm-modal-action">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const titleEl = modal.querySelector('#confirm-modal-title span');
    const msgEl = modal.querySelector('#confirm-modal-message');
    const actionBtn = modal.querySelector('#confirm-modal-action');
    const cancelBtn = modal.querySelector('#confirm-modal-cancel');
    const closeBtn = modal.querySelector('#confirm-modal-close');

    titleEl.textContent = title;
    msgEl.textContent = message;
    actionBtn.textContent = confirmText;
    actionBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';

    const handleClose = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    const handleAction = () => {
      handleClose();
      if (typeof onConfirm === 'function') onConfirm();
    };

    // Rebind clean listeners
    actionBtn.onclick = handleAction;
    cancelBtn.onclick = handleClose;
    closeBtn.onclick = handleClose;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  /**
   * Generate and download CSV file from data rows
   */
  exportToCSV(filename, rows) {
    if (!rows || !rows.length) {
      this.showToast('No data available to export', 'warning');
      return;
    }

    const keys = Object.keys(rows[0]);
    const csvContent = [
      keys.join(','),
      ...rows.map(row =>
        keys.map(k => {
          let val = row[k] === null || row[k] === undefined ? '' : String(row[k]);
          val = val.replace(/"/g, '""');
          if (val.search(/("|,|\n)/g) >= 0) {
            val = `"${val}"`;
          }
          return val;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast(`Exported ${rows.length} records to ${filename}`, 'success', 'Export Complete');
  },

  /**
   * Log action to central audit trail in StorageManager
   */
  logActivity(action, module, referenceId = '—', status = 'Success', details = '') {
    const session = StorageManager.getData(StorageKeys.AUTH);
    const user = session ? session.name : 'System Officer';

    const now = new Date();
    const formattedTime = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-US', { hour12: true })}`;

    const record = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      timestamp: formattedTime,
      user: user,
      action: action,
      module: module,
      referenceId: referenceId,
      status: status,
      details: details || `${action} performed on ${referenceId} in module ${module}.`
    };

    StorageManager.addData(StorageKeys.ACTIVITY, record);
    return record;
  },

  /**
   * Status badge HTML renderer with distinct LegalTech styling
   */
  renderStatusBadge(status) {
    if (!status) return '—';
    const s = status.toLowerCase();
    let cls = 'badge-active';
    let icon = 'fa-circle-check';

    if (s.includes('admit')) {
      cls = 'badge-admitted';
      icon = 'fa-gavel';
    } else if (s.includes('verif')) {
      cls = 'badge-verified';
      icon = 'fa-shield-halved';
    } else if (s.includes('register')) {
      cls = 'badge-registered';
      icon = 'fa-fingerprint';
    } else if (s.includes('reject') || s.includes('mismatch') || s.includes('critical') || s.includes('cancel')) {
      cls = 'badge-rejected';
      icon = 'fa-circle-xmark';
    } else if (s.includes('pend') || s.includes('review') || s.includes('schedul') || s.includes('attention')) {
      cls = 'badge-under-review';
      icon = 'fa-magnifying-glass';
    } else if (s.includes('submit') || s.includes('investig') || s.includes('high')) {
      cls = 'badge-submitted';
      icon = 'fa-building-columns';
    } else if (s.includes('archive') || s.includes('close') || s.includes('low') || s.includes('return')) {
      cls = 'badge-archived';
      icon = 'fa-box-archive';
    }

    return `<span class="badge ${cls}"><i class="fa-solid ${icon}"></i> ${status}</span>`;
  },

  /**
   * Priority badge HTML renderer
   */
  renderPriorityBadge(priority) {
    if (!priority) return '—';
    const p = priority.toLowerCase();
    let cls = 'badge-low';
    if (p === 'critical') cls = 'badge-rejected';
    else if (p === 'high') cls = 'badge-submitted';
    else if (p === 'medium') cls = 'badge-under-review';
    return `<span class="badge ${cls}">${priority}</span>`;
  },

  /**
   * Smooth number counter animation for dashboard KPIs
   */
  animateCounter(element, target, duration = 450) {
    if (!element) return;
    const endValue = typeof target === 'number' ? target : parseInt(target, 10);
    if (isNaN(endValue)) {
      element.textContent = target;
      return;
    }

    const startValue = 0;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const current = Math.round(startValue + (endValue - startValue) * (1 - Math.pow(1 - progress, 3)));
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = endValue;
      }
    }

    requestAnimationFrame(step);
  }
};

window.Utils = Utils;
