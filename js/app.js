/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * app.js - Global Application Shell, Responsive Sidebar, Clock, Notifications & Global Search
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Preferences (Theme, Compact Mode)
  initPreferences();

  // Initialize Responsive Navigation & Sidebar
  initSidebar();

  // Highlight Active Page Link
  highlightActiveNav();

  // Update Dynamic Nav Counter Badges
  updateNavCounters();

  // Initialize Live Legal Time Clock
  initLiveClock();

  // Initialize Notifications Dropdown
  initNotificationsDropdown();

  // Initialize Global Search Modal & Shortcut (Ctrl/Cmd + K)
  initGlobalSearch();

  // Initialize Live Backend & Database Status Indicator
  initBackendStatusIndicator();
});

/**
 * Apply stored theme and layout preferences
 */
function initPreferences() {
  const settings = StorageManager.getData(StorageKeys.SETTINGS) || {};
  if (settings.theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  if (settings.compactMode) {
    document.body.classList.add('compact-mode');
  } else {
    document.body.classList.remove('compact-mode');
  }
}

/**
 * Setup Sidebar toggles for Desktop and Mobile
 */
function initSidebar() {
  const sidebar = document.querySelector('.cems-sidebar');
  const toggleBtn = document.querySelector('.btn-sidebar-toggle');
  if (!sidebar) return;

  // Create mobile overlay backdrop if not present
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  // Create mobile close button inside sidebar header if not present
  const brand = sidebar.querySelector('.sidebar-brand');
  if (brand && !brand.querySelector('.btn-sidebar-close')) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-sidebar-close';
    closeBtn.setAttribute('aria-label', 'Close sidebar navigation');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeBtn.addEventListener('click', closeMobileSidebar);
    brand.appendChild(closeBtn);
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('active');
    document.body.classList.remove('sidebar-mobile-open');
  }

  function openMobileSidebar() {
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('active');
    document.body.classList.add('sidebar-mobile-open');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        // Mobile / tablet drawer mode
        const isOpen = sidebar.classList.contains('mobile-open');
        if (isOpen) {
          closeMobileSidebar();
        } else {
          openMobileSidebar();
        }
      } else {
        // Desktop collapse mode
        document.body.classList.toggle('sidebar-collapsed');
      }
    });
  }

  // Tap backdrop to close
  backdrop.addEventListener('click', closeMobileSidebar);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
      closeMobileSidebar();
    }
  });

  // Close mobile drawer when clicking any navigation link
  sidebar.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        closeMobileSidebar();
      }
    });
  });
}

/**
 * Detect current pathname and apply .active class to nav item
 */
function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
  const links = document.querySelectorAll('.sidebar-nav .nav-link');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'dashboard.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Update real counts on navigation pill badges
 */
async function updateNavCounters() {
  const cases = StorageManager.getData(StorageKeys.CASES) || [];
  const evidence = StorageManager.getData(StorageKeys.EVIDENCE) || [];
  const hearings = StorageManager.getData(StorageKeys.HEARINGS) || [];
  const submissions = StorageManager.getData(StorageKeys.SUBMISSIONS) || [];

  const caseBadge = document.querySelector('[data-nav-count="cases"]');
  const evidenceBadge = document.querySelector('[data-nav-count="evidence"]');
  const hearingBadge = document.querySelector('[data-nav-count="hearings"]');
  const submissionBadge = document.querySelector('[data-nav-count="submissions"]');

  if (caseBadge) caseBadge.textContent = cases.length;
  if (evidenceBadge) evidenceBadge.textContent = evidence.length;
  if (hearingBadge) hearingBadge.textContent = hearings.filter(h => h.status === 'Scheduled').length;
  if (submissionBadge) submissionBadge.textContent = submissions.length;
}

/**
 * Real-time clock in top header
 */
function initLiveClock() {
  const clockEl = document.querySelector('.header-clock span');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    clockEl.textContent = `${dateStr} • ${timeStr}`;
  }

  update();
  setInterval(update, 1000);
}

/**
 * Notifications dropdown menu & clear actions
 */
function initNotificationsDropdown() {
  const notifBtn = document.querySelector('#notif-toggle-btn');
  const dropdown = document.querySelector('#notifications-dropdown');
  if (!notifBtn || !dropdown) return;

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== notifBtn) {
      dropdown.classList.remove('active');
    }
  });

  // Render notifications
  renderNotifications();

  // Clear / mark all read button
  const markReadBtn = dropdown.querySelector('#btn-mark-all-read');
  if (markReadBtn) {
    markReadBtn.addEventListener('click', () => {
      const list = StorageManager.getData(StorageKeys.NOTIFICATIONS) || [];
      const updated = list.map(n => ({ ...n, unread: false }));
      StorageManager.saveData(StorageKeys.NOTIFICATIONS, updated);
      renderNotifications();
      Utils.showToast('All notifications marked as read', 'info');
    });
  }
}

function renderNotifications() {
  const dropdown = document.querySelector('#notifications-dropdown');
  if (!dropdown) return;

  const listEl = dropdown.querySelector('.notification-list');
  const dot = document.querySelector('#notif-unread-dot');
  const list = StorageManager.getData(StorageKeys.NOTIFICATIONS) || [];

  const unreadCount = list.filter(n => n.unread).length;
  if (dot) {
    dot.style.display = unreadCount > 0 ? 'block' : 'none';
  }

  if (!list.length) {
    listEl.innerHTML = `
      <div style="padding: 2rem 1rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
        <i class="fa-solid fa-bell-slash" style="font-size: 1.5rem; margin-bottom: 8px; display:block;"></i>
        No notifications
      </div>
    `;
    return;
  }

  listEl.innerHTML = list.map(n => {
    let icon = 'fa-info';
    let iconClass = 'info';
    if (n.type === 'danger') { icon = 'fa-triangle-exclamation'; iconClass = 'warning'; }
    else if (n.type === 'warning') { icon = 'fa-clock'; iconClass = 'warning'; }
    else if (n.type === 'success') { icon = 'fa-check'; iconClass = 'success'; }

    return `
      <div class="notification-item ${n.unread ? 'unread' : ''}">
        <div class="notification-icon ${iconClass}">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 4px;">${n.message}</p>
          <div class="notification-time">${n.time}</div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Global Omnibar Search (Ctrl+K / Cmd+K)
 */
function initGlobalSearch() {
  let modal = document.querySelector('#global-search-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-search-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-container modal-lg" style="max-height: 80vh;">
        <div class="modal-header" style="border-bottom:none; padding-bottom: 0.5rem;">
          <div class="input-icon-wrap" style="width: 100%;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 1.1rem; color: var(--gold-primary);"></i>
            <input type="text" id="global-search-input" class="form-control" style="font-size: 1rem; padding: 0.85rem 1rem 0.85rem 40px; border-radius: 8px;" placeholder="Search Cases, Evidence, Documents, Judges, Officers..." autocomplete="off">
          </div>
          <button class="modal-close" id="global-search-close">&times;</button>
        </div>
        <div class="modal-body" style="padding-top: 0.5rem;">
          <div id="global-search-results" style="display:flex;flex-direction:column;gap:8px;">
            <div style="padding: 2rem 1rem; text-align: center; color: var(--text-dim);">
              <i class="fa-solid fa-keyboard" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
              <p>Type keywords to perform an immediate search across all registered records.</p>
              <div style="font-size: 0.75rem; margin-top: 8px; color: var(--text-dim);">
                Examples: <code>Apex</code>, <code>SWIFT</code>, <code>CCTV</code>, <code>Sarah Jenkins</code>, <code>CEMS-2026-001</code>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="font-size: 0.78rem; color: var(--text-dim); justify-content: space-between;">
          <div><kbd style="background:var(--bg-primary);padding:2px 6px;border-radius:4px;">ESC</kbd> to close</div>
          <div>CEMS Global Entity Registry</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const searchInput = modal.querySelector('#global-search-input');
  const resultsContainer = modal.querySelector('#global-search-results');
  const closeBtn = modal.querySelector('#global-search-close');
  const triggers = document.querySelectorAll('.global-search-trigger');

  function openSearch() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput.focus(), 100);
  }

  function closeSearch() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  triggers.forEach(t => t.addEventListener('click', openSearch));
  closeBtn.addEventListener('click', closeSearch);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSearch();
  });

  // Keyboard shortcut Ctrl+K or Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modal.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch();
      }
    } else if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeSearch();
    }
  });

  // Live search debounced
  let debounceTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        resultsContainer.innerHTML = `
          <div style="padding: 2rem 1rem; text-align: center; color: var(--text-dim);">
            <i class="fa-solid fa-keyboard" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
            <p>Type keywords to perform an immediate search across all registered records.</p>
          </div>
        `;
        return;
      }

      performGlobalSearch(q, resultsContainer);
    }, 150);
  });
}

function performGlobalSearch(query, container) {
  const cases = StorageManager.getData(StorageKeys.CASES) || [];
  const evidence = StorageManager.getData(StorageKeys.EVIDENCE) || [];
  const documents = StorageManager.getData(StorageKeys.DOCUMENTS) || [];
  const hearings = StorageManager.getData(StorageKeys.HEARINGS) || [];

  const matchedCases = cases.filter(c => 
    c.caseId.toLowerCase().includes(query) ||
    c.caseTitle.toLowerCase().includes(query) ||
    c.courtName.toLowerCase().includes(query) ||
    c.judgeName.toLowerCase().includes(query) ||
    c.petitioner.toLowerCase().includes(query) ||
    c.respondent.toLowerCase().includes(query)
  );

  const matchedEvidence = evidence.filter(e =>
    e.evidenceId.toLowerCase().includes(query) ||
    e.caseId.toLowerCase().includes(query) ||
    e.evidenceName.toLowerCase().includes(query) ||
    e.evidenceType.toLowerCase().includes(query) ||
    (e.fileName && e.fileName.toLowerCase().includes(query)) ||
    (e.collectedBy && e.collectedBy.toLowerCase().includes(query))
  );

  const matchedDocs = documents.filter(d =>
    d.id.toLowerCase().includes(query) ||
    d.documentName.toLowerCase().includes(query) ||
    d.documentType.toLowerCase().includes(query) ||
    d.caseId.toLowerCase().includes(query)
  );

  const matchedHearings = hearings.filter(h =>
    h.id.toLowerCase().includes(query) ||
    h.caseId.toLowerCase().includes(query) ||
    h.court.toLowerCase().includes(query) ||
    h.purpose.toLowerCase().includes(query)
  );

  const total = matchedCases.length + matchedEvidence.length + matchedDocs.length + matchedHearings.length;

  if (total === 0) {
    container.innerHTML = `
      <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-dim);">
        <i class="fa-solid fa-circle-xmark" style="font-size: 2rem; margin-bottom: 10px; display: block; color: var(--text-dim);"></i>
        <h4>No matching legal records found</h4>
        <p style="font-size: 0.85rem;">Try refining your query or search by specific ID (e.g., EVD-001, CEMS-2026-001).</p>
      </div>
    `;
    return;
  }

  let html = '';

  if (matchedCases.length) {
    html += `<div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--gold-primary); letter-spacing: 0.08em; margin: 6px 0;">Cases (${matchedCases.length})</div>`;
    html += matchedCases.slice(0, 4).map(c => `
      <a href="case-details.html?id=${c.caseId}" class="cems-card" style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;text-decoration:none;border-radius:8px;">
        <div>
          <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">
            <span style="color:var(--gold-primary);">${c.caseId}</span> • ${c.caseTitle}
          </div>
          <div style="font-size: 0.76rem; color: var(--text-dim); margin-top: 2px;">
            ${c.courtName} | Judge: ${c.judgeName}
          </div>
        </div>
        <div>${Utils.renderStatusBadge(c.status)}</div>
      </a>
    `).join('');
  }

  if (matchedEvidence.length) {
    html += `<div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--accent-blue); letter-spacing: 0.08em; margin: 12px 0 6px;">Evidence (${matchedEvidence.length})</div>`;
    html += matchedEvidence.slice(0, 4).map(e => `
      <a href="evidence-details.html?id=${e.evidenceId}" class="cems-card" style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;text-decoration:none;border-radius:8px;">
        <div>
          <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">
            <span style="color:var(--accent-blue);">${e.evidenceId}</span> • ${e.evidenceName}
          </div>
          <div style="font-size: 0.76rem; color: var(--text-dim); margin-top: 2px;">
            Case: ${e.caseId} | Type: ${e.evidenceType} | File: ${e.fileName || 'N/A'}
          </div>
        </div>
        <div>${Utils.renderStatusBadge(e.courtStatus)}</div>
      </a>
    `).join('');
  }

  if (matchedDocs.length) {
    html += `<div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.08em; margin: 12px 0 6px;">Documents (${matchedDocs.length})</div>`;
    html += matchedDocs.slice(0, 3).map(d => `
      <a href="documents.html" class="cems-card" style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;text-decoration:none;border-radius:8px;">
        <div>
          <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">${d.documentName}</div>
          <div style="font-size: 0.76rem; color: var(--text-dim); margin-top: 2px;">
            Case: ${d.caseId} | Type: ${d.documentType} | Version: ${d.version}
          </div>
        </div>
        <div>${Utils.renderStatusBadge(d.status)}</div>
      </a>
    `).join('');
  }

  if (matchedHearings.length) {
    html += `<div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--gold-primary); letter-spacing: 0.08em; margin: 12px 0 6px;">Hearings (${matchedHearings.length})</div>`;
    html += matchedHearings.slice(0, 3).map(h => `
      <a href="hearings.html" class="cems-card" style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;text-decoration:none;border-radius:8px;">
        <div>
          <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">${h.hearingType} — Case ${h.caseId}</div>
          <div style="font-size: 0.76rem; color: var(--text-dim); margin-top: 2px;">
            ${h.court} | ${h.hearingDate} at ${h.hearingTime}
          </div>
        </div>
        <div>${Utils.renderStatusBadge(h.status)}</div>
      </a>
    `).join('');
  }

  container.innerHTML = html;
}

/**
 * Live Backend & MySQL Database Connection Status Indicator
 */
function initBackendStatusIndicator() {
  const headerRight = document.querySelector('.header-right');
  if (!headerRight) return;

  let badge = document.querySelector('.backend-status-pill');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'backend-status-pill status-demo';
    badge.innerHTML = '<span class="status-dot"></span><span class="status-text">Detecting...</span>';
    headerRight.insertBefore(badge, headerRight.firstChild);
  }

  function render(isOnline) {
    if (isOnline) {
      badge.className = 'backend-status-pill status-online';
      badge.innerHTML = '<span class="status-dot"></span><span class="status-text">MySQL Online</span>';
      badge.setAttribute('title', 'Connected to Flask REST API & MySQL Database (cems_db)');
    } else {
      badge.className = 'backend-status-pill status-demo';
      badge.innerHTML = '<span class="status-dot"></span><span class="status-text">Demo Mode</span>';
      badge.setAttribute('title', 'Running in Standalone LocalStorage Demo Mode (Offline)');
    }
  }

  window.addEventListener('cems:backend-status', (e) => {
    render(e.detail.isOnline);
  });

  if (window.api && window.api.checkBackendHealth) {
    window.api.checkBackendHealth().then(isOnline => render(isOnline));
  }
}
