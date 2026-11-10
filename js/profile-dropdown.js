(function (window) {
  'use strict';

  // Apply saved dark mode theme immediately upon script evaluation
  try {
    const savedTheme = localStorage.getItem('tourismhub_theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}

  function getActiveUser() {
    if (!window.TourismHubStore) return { user: null, isAdmin: false, isTourist: false };
    const clientAuth = TourismHubStore.getClientAuth ? TourismHubStore.getClientAuth() : null;
    const adminAuth = TourismHubStore.getAdminAuth ? TourismHubStore.getAdminAuth() : null;
    const user = adminAuth || clientAuth;
    return {
      user: user,
      isAdmin: Boolean(adminAuth && adminAuth.roleKey),
      isTourist: Boolean(clientAuth && clientAuth.email)
    };
  }

  // Central UI state updater for topbar theme buttons
  function updateThemeButtonIcons(isDark) {
    document.querySelectorAll('.theme-btn-sun').forEach(el => {
      el.style.display = isDark ? 'block' : 'none';
    });
    document.querySelectorAll('.theme-btn-moon').forEach(el => {
      el.style.display = isDark ? 'none' : 'block';
    });
    const titleText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    document.querySelectorAll('.topbar-theme-toggle-btn').forEach(btn => {
      btn.setAttribute('title', titleText);
      btn.setAttribute('aria-label', titleText);
    });
  }

  // Dark mode toggle handler
  window.toggleThemeFromDropdown = function (isDark) {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('tourismhub_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('tourismhub_theme', 'light');
    }
    // Sync any theme toggle checkboxes on current page
    const pageToggles = document.querySelectorAll('#themeToggle, .theme-toggle-input');
    pageToggles.forEach(t => { t.checked = isDark; });

    // Sync all topbar buttons icons & titles
    updateThemeButtonIcons(isDark);
  };

  // Toggle helper for topbar button
  window.toggleGlobalTheme = function () {
    const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
    window.toggleThemeFromDropdown(!isCurrentlyDark);
  };

  // Sign out helper
  window.handleSignOut = function () {
    if (window.TourismHubStore) {
      if (typeof TourismHubStore.clientLogout === 'function') TourismHubStore.clientLogout();
      if (typeof TourismHubStore.adminLogout === 'function') TourismHubStore.adminLogout();
    }
    if (typeof showToast === 'function') {
      showToast('Signed out successfully. Returning to sign-in portal...');
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 350);
  };

  // Close all open profile dropdowns
  function closeAllDropdowns() {
    document.querySelectorAll('.user-profile-dropdown.active').forEach(dd => {
      dd.classList.remove('active');
    });
  }

  // Render or update dropdown markup inside the container
  function getOrCreateDropdown(wrapperEl) {
    let dropdown = wrapperEl.querySelector('.user-profile-dropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'user-profile-dropdown';
      wrapperEl.appendChild(dropdown);
    }
    return dropdown;
  }

  function renderDropdownContent(dropdown) {
    const auth = getActiveUser();
    const user = auth.user;
    const isAdmin = auth.isAdmin;
    const isTourist = auth.isTourist;

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    // Get count of passes and favorites
    let passCount = 0;
    let favCount = 0;
    if (window.TourismHubStore) {
      if (typeof TourismHubStore.getPasses === 'function') {
        passCount = (TourismHubStore.getPasses() || []).length;
      }
      if (typeof TourismHubStore.getFavorites === 'function') {
        favCount = (TourismHubStore.getFavorites() || []).length;
      }
    }

    if (user) {
      const avatarUrl = (window.TourismHubStore && TourismHubStore.getUserAvatar)
        ? TourismHubStore.getUserAvatar(user)
        : (user.avatar || '');
      const name = user.name || (isAdmin ? 'Operator' : 'Tourist');
      const email = user.email || '';
      const badge = isAdmin ? (user.role || 'Admin Clearance') : (user.badge || 'Verified Tourist');

      dropdown.innerHTML = `
        <div class="dropdown-header">
          <img src="${avatarUrl}" alt="${name}" class="dropdown-avatar">
          <div class="dropdown-user-info">
            <div class="dropdown-user-name">${name}</div>
            <div class="dropdown-user-email">${email}</div>
            <span class="dropdown-badge" style="${isAdmin ? 'background: #0284c7;' : 'background: #10b981;'}">${badge}</span>
          </div>
        </div>

        <div style="padding: 0.85rem;">
          ${isAdmin ? `
            <a href="admin.html" class="dropdown-action-btn" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; font-weight: 800; margin-bottom: 0.5rem; text-decoration: none;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
              <span>Admin Operator Dashboard</span>
            </a>
          ` : ''}

          <a href="profile.html#passes" class="dropdown-action-btn" style="text-decoration: none;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/></svg>
            <span style="flex: 1; text-align: left;">My Digital QR Passes</span>
            <span class="dropdown-tab-pill" style="background: #e0f2fe; color: #0284c7; font-weight: 700;">${passCount}</span>
          </a>

          <a href="profile.html#favorites" class="dropdown-action-btn" style="text-decoration: none;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span style="flex: 1; text-align: left;">Saved Favorites</span>
            <span class="dropdown-tab-pill" style="background: #fee2e2; color: #ef4444; font-weight: 700;">${favCount}</span>
          </a>

          <a href="profile.html#settings" class="dropdown-action-btn" style="text-decoration: none;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span style="flex: 1; text-align: left;">Account & Settings</span>
          </a>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.75rem; background: var(--bg-subtle, #f8fafc); border-radius: 8px; margin-top: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; font-weight: 600; color: var(--text-main, #0f172a);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              <span>Dark Mode</span>
            </div>
            <label class="switch-ui" style="position: relative; display: inline-block; width: 40px; height: 22px;">
              <input type="checkbox" ${isDarkMode ? 'checked' : ''} onchange="toggleThemeFromDropdown(this.checked)" style="opacity: 0; width: 0; height: 0;">
              <span class="switch-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isDarkMode ? '#0284c7' : '#cbd5e1'}; transition: 0.3s; border-radius: 34px;"></span>
            </label>
          </div>
        </div>

        <div class="dropdown-footer">
          <button type="button" class="dropdown-logout-btn" onclick="handleSignOut()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sign Out</span>
          </button>
        </div>
      `;
    } else {
      // Guest Visitor Dropdown
      const guestAvatar = (window.TourismHubStore && TourismHubStore.generateInitialsAvatar)
        ? TourismHubStore.generateInitialsAvatar('Guest Visitor')
        : '';
      dropdown.innerHTML = `
        <div class="dropdown-header">
          <img src="${guestAvatar}" alt="Guest" class="dropdown-avatar">
          <div class="dropdown-user-info">
            <div class="dropdown-user-name">Welcome, Visitor</div>
            <div class="dropdown-user-email">Guest Session</div>
            <span class="dropdown-badge" style="background: #64748b;">Not Signed In</span>
          </div>
        </div>

        <div style="padding: 0.85rem;">
          <a href="login.html" class="dropdown-action-btn" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border: none; font-weight: 800; margin-bottom: 0.5rem; text-decoration: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>Sign In / Create Account</span>
          </a>

          <a href="attractions.html" class="dropdown-action-btn" style="text-decoration: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <span>Browse Attractions & Events</span>
          </a>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.75rem; background: var(--bg-subtle, #f8fafc); border-radius: 8px; margin-top: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; font-weight: 600; color: var(--text-main, #0f172a);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              <span>Dark Mode</span>
            </div>
            <label class="switch-ui" style="position: relative; display: inline-block; width: 40px; height: 22px;">
              <input type="checkbox" ${isDarkMode ? 'checked' : ''} onchange="toggleThemeFromDropdown(this.checked)" style="opacity: 0; width: 0; height: 0;">
              <span class="switch-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isDarkMode ? '#0284c7' : '#cbd5e1'}; transition: 0.3s; border-radius: 34px;"></span>
            </label>
          </div>
        </div>
      `;
    }
  }

  // Universal handler: navigate directly to dedicated Profile Page (or Login if guest)
  window.navigateToProfilePage = function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const auth = getActiveUser();
    if (auth && auth.user) {
      window.location.href = 'profile.html';
    } else {
      window.location.href = 'login.html';
    }
  };

  // Universal handler: backward compatibility alias
  window.toggleProfileDropdown = function (event) {
    window.navigateToProfilePage(event);
  };

  // Wire profile triggers and outside click handler on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Direct clicks on user profile widget, avatar, meta, and name to profile.html
    document.querySelectorAll('.portal-user-profile, #userProfileBtn, .portal-user-name, .portal-user-meta').forEach(widget => {
      widget.removeAttribute('onclick');
      widget.style.cursor = 'pointer';

      widget.addEventListener('click', function (e) {
        window.navigateToProfilePage(e);
      });
    });

    // 2. Initialize topbar theme toggle icons to match current state
    const isDarkCurrent = document.documentElement.getAttribute('data-theme') === 'dark';
    updateThemeButtonIcons(isDarkCurrent);
  });

})(window);