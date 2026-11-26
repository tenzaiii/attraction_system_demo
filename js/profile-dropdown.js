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
      document.documentElement.style.backgroundColor = '#0b1120';
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('tourismhub_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.colorScheme = 'light';
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

  function escapeHtml(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Close all open profile dropdowns
  function closeAllDropdowns() {
    document.querySelectorAll('.user-profile-dropdown.active').forEach(dd => {
      dd.classList.remove('active');
    });
  }

  // Close all open notifications popover dropdowns
  function closeAllNotifDropdowns() {
    document.querySelectorAll('.notif-dropdown-menu.active').forEach(menu => {
      menu.classList.remove('active');
    });
    document.querySelectorAll('.notif-dropdown-wrapper [aria-expanded="true"]').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function getCurrentProfileTab() {
    const path = (window.location.pathname || '').toLowerCase();
    const onProfilePage = path.endsWith('/profile.html') || path === 'profile.html';
    if (!onProfilePage) return 'account';

    const activeBtn = document.querySelector('.profile-tab-btn.active');
    if (activeBtn) {
      if (activeBtn.id === 'tabBtnFavorites') return 'favorites';
      if (activeBtn.id === 'tabBtnPasses') return 'passes';
      if (activeBtn.id === 'tabBtnSettings') return 'settings';
      if (activeBtn.id === 'tabBtnAccount') return 'account';
    }

    const hash = (window.location.hash || '').replace('#', '').toLowerCase();
    if (hash === 'favorites' || hash === 'passes' || hash === 'settings' || hash === 'account') {
      return hash;
    }
    return 'account';
  }

  window.navigateProfileSection = function (event, tabName) {
    const path = (window.location.pathname || '').toLowerCase();
    const onProfilePage = path.endsWith('/profile.html') || path === 'profile.html';
    closeAllDropdowns();

    if (onProfilePage && typeof window.switchProfileTab === 'function') {
      if (event) event.preventDefault();
      window.switchProfileTab(tabName);
      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(null, '', '#' + tabName);
      }
      return false;
    }
    return true;
  };

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
    const activeTab = getCurrentProfileTab();
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    // Get count of passes and favorites scoped to current user
    let passCount = 0;
    let favCount = 0;
    if (window.TourismHubStore) {
      if (typeof TourismHubStore.getUserPasses === 'function') {
        passCount = TourismHubStore.getUserPasses(user).length;
      }
      if (typeof TourismHubStore.getFavorites === 'function') {
        favCount = (TourismHubStore.getFavorites() || []).length;
      }
    }

    if (user) {
      let avatarUrl = (window.TourismHubStore && typeof TourismHubStore.getUserAvatar === 'function')
        ? TourismHubStore.getUserAvatar(user)
        : user.avatar;
      if (!avatarUrl || avatarUrl.includes('photo-1544005313') || avatarUrl.includes('photo-153571387')) {
        avatarUrl = window.TourismHubStore && typeof TourismHubStore.generateInitialsAvatar === 'function'
          ? TourismHubStore.generateInitialsAvatar(user.name)
          : (avatarUrl || 'assets/no-image.svg');
      }
      const name = user.name || (isAdmin ? 'Operator' : 'Tourist');
      const email = user.email || '';

      dropdown.innerHTML = `
        <div class="dropdown-header">
          <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" class="dropdown-avatar">
          <div class="dropdown-user-info">
            <div class="dropdown-user-name">${escapeHtml(name)}</div>
            <div class="dropdown-user-email">${escapeHtml(email)}</div>
          </div>
        </div>

        <nav class="dropdown-profile-nav" aria-label="Profile Sections">
          <a href="profile.html#account" class="dropdown-profile-item ${activeTab === 'account' ? 'active' : ''}" data-profile-tab="account" onclick="return navigateProfileSection(event, 'account')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
            <span>Account & Security</span>
          </a>

          <a href="profile.html#favorites" class="dropdown-profile-item ${activeTab === 'favorites' ? 'active' : ''}" data-profile-tab="favorites" onclick="return navigateProfileSection(event, 'favorites')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span>Saved Favorites (${favCount})</span>
          </a>

          <a href="profile.html#passes" class="dropdown-profile-item ${activeTab === 'passes' ? 'active' : ''}" data-profile-tab="passes" onclick="return navigateProfileSection(event, 'passes')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/></svg>
            <span>My QR Passes (${passCount})</span>
          </a>

          <a href="profile.html#settings" class="dropdown-profile-item ${activeTab === 'settings' ? 'active' : ''}" data-profile-tab="settings" onclick="return navigateProfileSection(event, 'settings')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>Settings & Preferences</span>
          </a>
        </nav>

        <div class="dropdown-footer">
          <button type="button" class="dropdown-logout-btn" onclick="handleSignOut()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sign Out</span>
          </button>
        </div>
      `;
    } else {
      // Guest Visitor Dropdown
      const guestAvatar = window.TourismHubStore && typeof TourismHubStore.generateInitialsAvatar === 'function'
        ? TourismHubStore.generateInitialsAvatar('Guest Visitor')
        : "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'128'%20height%3D'128'%20viewBox%3D'0%200%20128%20128'%3E%3Crect%20width%3D'128'%20height%3D'128'%20rx%3D'64'%20fill%3D'%230284c7'%2F%3E%3Ctext%20x%3D'64'%20y%3D'73'%20font-family%3D'sans-serif'%20font-size%3D'44'%20font-weight%3D'400'%20fill%3D'%23ffffff'%20text-anchor%3D'middle'%20dominant-baseline%3D'middle'%3EGV%3C%2Ftext%3E%3C%2Fsvg%3E";
      dropdown.innerHTML = `
        <div class="dropdown-header">
          <img src="${guestAvatar}" alt="Guest" class="dropdown-avatar">
          <div class="dropdown-user-info">
            <div class="dropdown-user-name">Welcome, Visitor</div>
            <div class="dropdown-user-email">Guest Session</div>
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

  // Helper: direct profile page navigation (used by explicit links)
  window.navigateToProfilePage = function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const auth = getActiveUser();
    if (auth.user) {
      window.location.href = 'profile.html';
    } else {
      window.location.href = 'login.html?redirect=profile.html';
    }
  };

  // Universal handler: clicking profile widget in navbar toggles the Profile dropdown menu
  window.toggleProfileDropdown = function (event, widgetEl) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const auth = getActiveUser();
    if (!auth.user) {
      window.location.href = 'login.html?redirect=profile.html';
      return false;
    }

    const targetWidget = widgetEl || document.querySelector('.portal-user-profile');
    const wrapper = targetWidget ? targetWidget.closest('.user-profile-wrapper') : document.querySelector('.user-profile-wrapper');
    if (!wrapper) return false;

    const dropdown = getOrCreateDropdown(wrapper);
    const willOpen = !dropdown.classList.contains('active');

    closeAllNotifDropdowns();
    closeAllDropdowns();

    if (willOpen) {
      renderDropdownContent(dropdown);
      dropdown.classList.add('active');
    }
    return false;
  };

  // Notifications popover helpers across all pages
  function getOrCreateNotifDropdown(wrapperEl) {
    let menu = wrapperEl.querySelector('.notif-dropdown-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'notif-dropdown-menu';
      menu.setAttribute('role', 'region');
      menu.setAttribute('aria-label', 'Recent Notifications');
      wrapperEl.appendChild(menu);
    }
    return menu;
  }

  function renderNotifDropdownContent(menuEl) {
    const announcements = (window.TourismHubStore && typeof TourismHubStore.getAnnouncements === 'function')
      ? (TourismHubStore.getAnnouncements() || [])
      : [];
    const recent = announcements.slice(0, 4);

    const listHtml = recent.length === 0
      ? `
        <div class="notif-dropdown-empty">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin: 0 auto 0.4rem; opacity: 0.6;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <div>No active alerts or announcements at this time.</div>
        </div>
      `
      : recent.map((a, idx) => {
          const isUrgent = a.priority === 'urgent' || a.type === 'alert';
          const isWeather = a.type === 'weather';
          const isEvent = a.type === 'event' || a.category === 'Event';
          const toneClass = isUrgent ? 'urgent' : isWeather ? 'weather' : isEvent ? 'event' : 'general';
          return `
            <button type="button" class="notif-dropdown-item ${toneClass}" data-notif-index="${idx}">
              <span class="notif-dropdown-icon ${toneClass}" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                </svg>
              </span>
              <span class="notif-dropdown-item-body">
                <span class="notif-dropdown-item-top">
                  <span class="notif-dropdown-item-title">${escapeHtml(a.title || 'Announcement')}</span>
                  <span class="notif-dropdown-item-time">${escapeHtml(a.timestamp || 'Recent')}</span>
                </span>
                <span class="notif-dropdown-item-text">${escapeHtml(a.text || '')}</span>
                <span class="notif-dropdown-item-target">Destination: ${escapeHtml(a.target || 'All Attractions')}</span>
              </span>
            </button>
          `;
        }).join('');

    menuEl.innerHTML = `
      <div class="notif-dropdown-header">
        <span class="notif-dropdown-title">Recent Notifications</span>
        <span class="notif-dropdown-count">${announcements.length} Total</span>
      </div>
      <div class="notif-dropdown-list">
        ${listHtml}
      </div>
      <div class="notif-dropdown-footer">
        <a href="notifications.html" class="notif-dropdown-see-all">
          <span>See More Notifications</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </a>
      </div>
    `;

    menuEl.querySelectorAll('.notif-dropdown-item').forEach(itemBtn => {
      itemBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(itemBtn.getAttribute('data-notif-index'), 10);
        const item = recent[idx];
        closeAllNotifDropdowns();
        if (item && typeof window.openAnnouncementDetail === 'function') {
          const t = (item.type || '').toLowerCase();
          const label = (t === 'alert' || t === 'weather' || item.priority === 'urgent') ? 'Alert' : (t === 'event' ? 'Event' : 'Announcement');
          window.openAnnouncementDetail(item.title || 'Announcement', item.text || '', label, item.timestamp || 'Recent', item.target || 'All Visitors');
        } else {
          window.location.href = 'notifications.html';
        }
      });
    });
  }

  window.toggleNotificationsDropdown = function (event, btnEl) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const targetBtn = btnEl || document.querySelector('.notif-dropdown-wrapper .portal-notif-btn, .notif-dropdown-wrapper .nav-icon-btn');
    if (!targetBtn) return false;
    const wrapper = targetBtn.closest('.notif-dropdown-wrapper');
    if (!wrapper) return false;

    const menu = getOrCreateNotifDropdown(wrapper);
    const willOpen = !menu.classList.contains('active');

    closeAllDropdowns();
    closeAllNotifDropdowns();

    if (willOpen) {
      renderNotifDropdownContent(menu);
      menu.classList.add('active');
      targetBtn.setAttribute('aria-expanded', 'true');
    } else {
      targetBtn.setAttribute('aria-expanded', 'false');
    }
    return false;
  };

  function wireNotificationDropdownButtons() {
    const notifButtons = document.querySelectorAll('.portal-notif-btn:not(.topbar-theme-toggle-btn), .nav-icon-btn[onclick*="openNotificationsModal"], .nav-icon-btn[aria-label="Notifications"]');
    notifButtons.forEach(btn => {
      if (btn.dataset.notifDropdownBound === 'true') return;
      btn.dataset.notifDropdownBound = 'true';
      btn.removeAttribute('onclick');
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');

      let wrapper = btn.closest('.notif-dropdown-wrapper');
      if (!wrapper && btn.parentNode) {
        wrapper = document.createElement('div');
        wrapper.className = 'notif-dropdown-wrapper';
        btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);
      }

      if (wrapper) {
        getOrCreateNotifDropdown(wrapper);
      }

      btn.addEventListener('click', (e) => window.toggleNotificationsDropdown(e, btn));
    });
  }

  function refreshActiveDropdowns() {
    document.querySelectorAll('.user-profile-dropdown.active').forEach(dd => {
      renderDropdownContent(dd);
    });
    document.querySelectorAll('.notif-dropdown-menu.active').forEach(menu => {
      renderNotifDropdownContent(menu);
    });
  }

  // Wire profile triggers, notification popovers, and outside click handlers on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Ensure position relative on wrappers and toggle profile dropdown on click
    document.querySelectorAll('.portal-user-profile').forEach(widget => {
      if (widget.dataset.profileDropdownBound === 'true') return;
      widget.dataset.profileDropdownBound = 'true';
      widget.removeAttribute('onclick');
      widget.style.cursor = 'pointer';

      let wrapper = widget.closest('.user-profile-wrapper');
      if (!wrapper && widget.parentNode) {
        wrapper = document.createElement('div');
        wrapper.className = 'user-profile-wrapper';
        widget.parentNode.insertBefore(wrapper, widget);
        wrapper.appendChild(widget);
      }
      if (wrapper) wrapper.style.position = 'relative';

      widget.addEventListener('click', (e) => window.toggleProfileDropdown(e, widget));
      widget.querySelectorAll('.portal-user-name, .portal-avatar-img').forEach(el => {
        el.style.cursor = 'pointer';
      });
    });

    // 2. Wire navbar notification bell buttons to anchored popover dropdown across all pages
    wireNotificationDropdownButtons();

    // 3. Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-profile-wrapper') && !e.target.closest('.portal-user-profile')) {
        closeAllDropdowns();
      }
      if (!e.target.closest('.notif-dropdown-wrapper')) {
        closeAllNotifDropdowns();
      }
    });

    // 4. Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllDropdowns();
        closeAllNotifDropdowns();
      }
    });

    // 5. Re-render active dropdowns when data changes
    window.addEventListener('favoritesUpdated', refreshActiveDropdowns);
    window.addEventListener('supabaseSyncComplete', refreshActiveDropdowns);
    if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
      TourismHubStore.onSync(() => {
        refreshActiveDropdowns();
      });
    }

    // 6. Initialize topbar theme toggle icons to match current state
    const isDarkCurrent = document.documentElement.getAttribute('data-theme') === 'dark';
    updateThemeButtonIcons(isDarkCurrent);
  });

})(window);