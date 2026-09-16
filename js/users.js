/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * users.js - Judicial Officers & Authorized Personnel Directory (Demo Staff Directory)
 */

let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadUsersDirectory();
  initUsersListeners();
});

async function loadUsersDirectory() {
  try {
    allUsers = await api.getUsers();
    renderUsersGrid();
  } catch (err) {
    console.error('Error loading users:', err);
    Utils.showToast('Failed to load user records', 'error');
  }
}

function renderUsersGrid() {
  const container = document.getElementById('users-grid-container');
  const countEl = document.getElementById('users-count-label');
  const search = (document.getElementById('users-search-input')?.value || '').trim().toLowerCase();
  const roleFilter = document.getElementById('filter-user-role')?.value || 'All';

  const filtered = allUsers.filter(u => {
    const matchesSearch = !search ||
      u.userId.toLowerCase().includes(search) ||
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.department.toLowerCase().includes(search) ||
      u.role.toLowerCase().includes(search);

    const matchesRole = (roleFilter === 'All' || u.role === roleFilter);

    return matchesSearch && matchesRole;
  });

  if (countEl) countEl.textContent = `Showing ${filtered.length} authorized personnel`;
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem; text-align: center;" class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-user-slash"></i></div>
        <h4>No personnel found</h4>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(u => {
    const initials = u.name.split(' ').map(n => n[0]).slice(0, 2).join('');
    
    let roleBadgeClass = 'badge-gold';
    if (u.role === 'Court Officer') roleBadgeClass = 'badge-submitted';
    else if (u.role === 'Investigator') roleBadgeClass = 'badge-pending';
    else if (u.role === 'Evidence Officer') roleBadgeClass = 'badge-active';
    else if (u.role === 'Reviewer') roleBadgeClass = 'badge-gold';

    return `
      <div class="cems-card" style="padding:1.5rem;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
            <div class="user-avatar" style="width:48px;height:48px;font-size:1.1rem;">
              ${initials}
            </div>
            <span class="badge ${roleBadgeClass}">${u.role}</span>
          </div>

          <h3 style="font-size:1.15rem;font-weight:700;color:var(--text-main);">${u.name}</h3>
          <div style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-dim);margin-top:2px;">
            ID: ${u.userId}
          </div>

          <div style="margin:1rem 0;display:flex;flex-direction:column;gap:6px;font-size:0.84rem;">
            <div style="color:var(--text-muted);">
              <i class="fa-solid fa-building-columns" style="color:var(--gold-primary);width:18px;"></i>
              ${u.department}
            </div>
            <div style="color:var(--text-muted);">
              <i class="fa-solid fa-envelope" style="color:var(--accent-blue);width:18px;"></i>
              ${u.email}
            </div>
            <div style="color:var(--text-dim);font-size:0.75rem;margin-top:4px;">
              <i class="fa-solid fa-right-to-bracket" style="width:18px;"></i>
              Last Session: ${u.lastLogin || 'Active Today'}
            </div>
          </div>
        </div>

        <div style="border-top:1px solid var(--border-subtle);padding-top:1rem;display:flex;align-items:center;justify-content:space-between;">
          <span class="badge badge-active"><span class="badge-dot"></span> Authorized</span>
          <button class="btn btn-secondary btn-sm" onclick="openUserDetailsModal('${u.userId}')">
            <i class="fa-solid fa-id-card"></i> View Profile
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function initUsersListeners() {
  const searchInput = document.getElementById('users-search-input');
  const roleFilter = document.getElementById('filter-user-role');

  if (searchInput) searchInput.addEventListener('input', renderUsersGrid);
  if (roleFilter) roleFilter.addEventListener('change', renderUsersGrid);
}

window.openUserDetailsModal = function(userId) {
  const u = allUsers.find(item => item.userId === userId);
  if (!u) return;

  const content = document.getElementById('user-modal-content');
  if (content) {
    content.innerHTML = `
      <div style="text-align:center;margin-bottom:1.5rem;">
        <div class="user-avatar" style="width:64px;height:64px;font-size:1.5rem;margin:0 auto 10px;">
          ${u.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
        <h3 style="font-size:1.3rem;">${u.name}</h3>
        <span class="badge badge-gold" style="margin-top:6px;">${u.role}</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;font-size:0.88rem;background:var(--bg-primary);padding:1.25rem;border-radius:8px;border:1px solid var(--border-subtle);">
        <div><strong>User ID:</strong> <span class="font-mono">${u.userId}</span></div>
        <div><strong>Official Email:</strong> ${u.email}</div>
        <div><strong>Department:</strong> ${u.department}</div>
        <div><strong>Security Clearance:</strong> Level 4 (Judicial Record Custody)</div>
        <div><strong>Cryptographic Signatures:</strong> Authorized to seal & submit chain events</div>
        <div><strong>Last Verified Login:</strong> ${u.lastLogin}</div>
      </div>
    `;
  }

  Utils.openModal('user-modal');
};
