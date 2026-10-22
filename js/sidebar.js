/**
 * TourismHub - Universal Side Navigation & Interactivity
 * Handles responsive sidebar open, close on page selection, and page synchronization.
 */

(function() {
  'use strict';

  function initSidebar() {
    const sideNav = document.getElementById('sideNav');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu-link');

    if (!sideNav) return;

    // Guard against multiple initializations
    if (sideNav.dataset.sidebarInitialized === 'true') return;
    sideNav.dataset.sidebarInitialized = 'true';

    function openSidebar() {
      sideNav.classList.add('active');
      if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
      document.body.style.overflow = window.innerWidth < 1024 ? 'hidden' : '';
    }

    function closeSidebar() {
      sideNav.classList.remove('active');
      if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Expose globally
    window.openSidebar = openSidebar;
    window.closeSidebar = closeSidebar;

    // Toggle button on header (Hamburger icon)
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (sideNav.classList.contains('active')) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
    }

    // Backdrop click closes sidebar
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', (e) => {
        e.preventDefault();
        closeSidebar();
      });
    }

    // Close button / Collapse button inside sidebar header
    const closeTrigger = sidebarCloseBtn || sidebarCollapseBtn;
    if (closeTrigger) {
      closeTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeSidebar();
      });
    }

    // Auto-close sidebar on ANY link selection
    sidebarLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Close sidebar immediately when a page or action is selected
        closeSidebar();

        // Highlight active link if staying on same page
        const href = link.getAttribute('href');
        if (href && (href.startsWith('#') || href.startsWith('javascript:'))) {
          sidebarLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sideNav.classList.contains('active')) {
        closeSidebar();
      }
    });

    // Highlight active link based on current page URL
    const currentPath = window.location.pathname.toLowerCase();
    sidebarLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href && href !== '#' && href !== 'javascript:void(0)') {
        if (currentPath.endsWith(href) || (currentPath.endsWith('/') && href === 'index.html')) {
          sidebarLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });

    // Modal helpers for standalone pages
    window.openPortalModal = function(modalId) {
      closeSidebar();
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add('active');
    };

    window.closePortalModal = function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
})();
