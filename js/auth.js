/**
 * COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 * auth.js - Authentication State, Route Protection & User Profile Binding
 */

const Auth = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const session = StorageManager.getItem(StorageKeys.SESSION);
    return !!session;
  },

  /**
   * Get current authenticated user session
   */
  getCurrentUser() {
    return StorageManager.getItem(StorageKeys.SESSION);
  },

  /**
   * Login function (Phase 2 requirement)
   */
  async login(email, password, rememberMe = false) {
    try {
      const result = await api.login(email, password);
      if (result && result.success) {
        if (rememberMe) {
          localStorage.setItem('cems_remember_email', email);
        } else {
          localStorage.removeItem('cems_remember_email');
        }
        Utils.showToast('Authentication successful. Redirecting to judicial dashboard...', 'success', 'Access Granted');
        
        // Determine redirect target based on current location
        const inPagesDir = window.location.pathname.includes('/pages/');
        const targetUrl = inPagesDir ? 'dashboard.html' : 'pages/dashboard.html';
        
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 650);
        return true;
      }
    } catch (err) {
      Utils.showToast(err.message || 'Invalid judicial credentials provided', 'error', 'Authentication Failed');
      return false;
    }
  },

  /**
   * Logout function (Phase 2 requirement)
   */
  async logout() {
    Utils.confirmModal(
      'Sign Out of CEMS',
      'Are you sure you want to end your current session? You will be redirected to the secure portal login.',
      async () => {
        await api.logout();
        const inPagesDir = window.location.pathname.includes('/pages/');
        window.location.href = inPagesDir ? '../index.html' : 'index.html';
      },
      'Sign Out',
      true
    );
  },

  /**
   * Route protection check
   */
  checkSession() {
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || 
                        path.endsWith('/') || 
                        path === '' ||
                        path.endsWith('Court Evidence Managemnt system') ||
                        path.endsWith('Court Evidence Managemnt system/');
    
    const session = this.getCurrentUser();

    if (!session && !isLoginPage) {
      // User not logged in, redirect to login
      const inPagesDir = path.includes('/pages/');
      window.location.href = inPagesDir ? '../index.html' : 'index.html';
      return null;
    }

    if (session && isLoginPage) {
      // User already logged in, redirect to dashboard
      window.location.href = 'pages/dashboard.html';
      return session;
    }

    // If logged in on protected page, update UI user meta
    if (session) {
      this.populateUserMeta(session);
    }

    return session;
  },

  /**
   * Bind current user profile data to the sidebar / header
   */
  populateUserMeta(session) {
    document.addEventListener('DOMContentLoaded', () => {
      const nameEl = document.querySelector('.user-name');
      const roleEl = document.querySelector('.user-role');
      const avatarEl = document.querySelector('.user-avatar');

      if (nameEl) nameEl.textContent = session.name || 'System Officer';
      if (roleEl) roleEl.textContent = session.role || 'Court Officer';
      if (avatarEl && session.name) {
        const initials = session.name.split(' ').map(n => n[0]).slice(0, 2).join('');
        avatarEl.textContent = initials || 'CO';
      }

      // Logout buttons
      document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
      });
    });
  }
};

// Global exports for requirements
window.Auth = Auth;
window.login = (e, p, r) => Auth.login(e, p, r);
window.logout = () => Auth.logout();
window.isAuthenticated = () => Auth.isAuthenticated();
window.getCurrentUser = () => Auth.getCurrentUser();

// Auto-run session check
Auth.checkSession();
