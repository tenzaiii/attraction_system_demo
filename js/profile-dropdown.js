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
    if (!window.TourismHubStore) return null;
    const clientAuth = TourismHubStore.getClientAuth ? TourismHubStore.getClientAuth() : null;
    const adminAuth = TourismHubStore.getAdminAuth ? TourismHubStore.getAdminAuth() : null;
    return adminAuth || clientAuth;
  }

  // Universal handler: navigates directly to profile.html tab
  window.toggleProfileDropdown = function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const user = getActiveUser();
    if (user) {
      window.location.href = 'profile.html';
    } else {
      window.location.href = 'login.html';
    }
  };

  // Sign out helper
  window.handleSignOut = function () {
    if (window.TourismHubStore) {
      TourismHubStore.clientLogout();
      TourismHubStore.adminLogout();
    }
    if (typeof showToast === 'function') {
      showToast('Signed out successfully. Returning to sign in gateway...');
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 350);
  };

  // Wire profile triggers on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('userProfileBtn');
    if (profileBtn) {
      profileBtn.onclick = function (e) {
        window.toggleProfileDropdown(e);
      };
    }

    document.querySelectorAll('.portal-user-profile').forEach(widget => {
      widget.onclick = function (e) {
        window.toggleProfileDropdown(e);
      };
    });
  });

})(window);
