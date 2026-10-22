/**
 * TourismHub - Operator Admin Authentication Logic (admin-login.js)
 * High-security authentication gate, operator clearance verification,
 * 1-click demo logins, and operator session redirection.
 */

// Global Helpers (available immediately)
window.togglePassword = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPwd = input.type === 'password';
  input.type = isPwd ? 'text' : 'password';

  if (btn) {
    btn.innerHTML = isPwd
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
};

window.quickFillAdmin = function(email, pwd) {
  const emailInput = document.getElementById('adminEmail');
  const pwdInput = document.getElementById('adminPassword');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = pwd;
  submitAdminLogin(email, pwd);
};

function clearAlerts() {
  const alertBox = document.getElementById('adminAlert');
  if (alertBox) {
    alertBox.className = 'terminal-alert';
    alertBox.style.display = 'none';
  }
}

function showNotice(msg, type = 'error') {
  const alertBox = document.getElementById('adminAlert');
  const alertText = document.getElementById('adminAlertText');
  if (alertBox && alertText) {
    alertText.textContent = msg;
    alertBox.className = `terminal-alert visible ${type}`;
    alertBox.style.display = 'flex';
  }
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.classList.add('loading');
  } else {
    btn.classList.remove('loading');
  }
}

function getReturnUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || 'admin.html';
}

function submitAdminLogin(email, password) {
  const submitBtn = document.getElementById('btnAdminSubmit');
  clearAlerts();
  setLoading(submitBtn, true);

  setTimeout(() => {
    setLoading(submitBtn, false);
    if (!window.TourismHubStore || typeof TourismHubStore.adminLogin !== 'function') {
      showNotice('Clearance database is initializing. Please retry.', 'error');
      return;
    }

    const res = TourismHubStore.adminLogin(email, password);
    if (res.success) {
      showNotice(`Clearance Verified: ${res.user.name} (${res.user.role}). Entering console...`, 'success');
      setTimeout(() => {
        window.location.href = getReturnUrl();
      }, 650);
    } else {
      showNotice(res.message, 'error');
    }
  }, 450);
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminLoginForm');
  const emailInput = document.getElementById('adminEmail');
  const pwdInput = document.getElementById('adminPassword');

  // Display active session banner if already authenticated (WITHOUT force-redirecting)
  if (window.TourismHubStore && typeof TourismHubStore.getAdminAuth === 'function') {
    const current = TourismHubStore.getAdminAuth();
    if (current) {
      const activeBar = document.getElementById('activeAdminSessionBar');
      if (activeBar) {
        activeBar.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: rgba(56, 189, 248, 0.12); border: 1.5px solid rgba(56, 189, 248, 0.35); border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <img src="${current.avatar || 'assets/hero-banner.jpg'}" alt="${current.name}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1.5px solid #38bdf8;">
              <div style="font-size: 0.82rem; color: #e0f2fe; line-height: 1.3;">
                <strong>Active: ${current.name}</strong><br>
                <span style="font-size: 0.72rem; color: #38bdf8;">${current.role}</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <a href="admin.html" style="font-size: 0.74rem; padding: 0.35rem 0.65rem; background: #0284c7; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">Console</a>
              <button type="button" onclick="TourismHubStore.adminLogout(); location.reload();" style="font-size: 0.74rem; padding: 0.35rem 0.65rem; background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid #ef4444; border-radius: 6px; cursor: pointer; font-weight: 600;">Lock & Exit</button>
            </div>
          </div>
        `;
      }
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput?.value;
      const pwd = pwdInput?.value;
      submitAdminLogin(email, pwd);
    });
  }
});
