/**
 * TourismHub - Public Tourist Portal Authentication Logic (login.js)
 * Handles client sign-in, account creation, quick-demo logins, and session redirection.
 */

// Global Helpers (available immediately)
window.switchTab = function(mode) {
  const tabSignIn = document.getElementById('tabSignIn');
  const tabRegister = document.getElementById('tabRegister');
  const formSignIn = document.getElementById('formSignIn');
  const formRegister = document.getElementById('formRegister');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');

  clearAlerts();

  if (mode === 'register') {
    tabSignIn?.classList.remove('active');
    tabRegister?.classList.add('active');
    formSignIn?.classList.remove('active');
    formRegister?.classList.add('active');
    if (formTitle) formTitle.textContent = 'Create Tourist Account';
    if (formSubtitle) formSubtitle.textContent = 'Register for digital fast-track entry and live attraction reservations.';
  } else {
    tabRegister?.classList.remove('active');
    tabSignIn?.classList.add('active');
    formRegister?.classList.remove('active');
    formSignIn?.classList.add('active');
    if (formTitle) formTitle.textContent = 'Welcome Back';
    if (formSubtitle) formSubtitle.textContent = 'Sign in to access your digital Tourist Passes and booked schedules.';
  }
};

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

window.quickFillUnified = function(email, pwd) {
  const emailInput = document.getElementById('signInEmail');
  const pwdInput = document.getElementById('signInPassword');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = pwd;
  window.switchTab('signin');
  submitUnifiedLogin(email, pwd);
};

window.quickFillClient = window.quickFillUnified;

function clearAlerts() {
  const alertBox = document.getElementById('formAlert');
  if (alertBox) {
    alertBox.className = 'form-alert';
    alertBox.style.display = 'none';
  }
}

function showNotice(msg, type = 'error') {
  const alertBox = document.getElementById('formAlert');
  const alertText = document.getElementById('formAlertText');
  if (alertBox && alertText) {
    alertText.textContent = msg;
    alertBox.className = `form-alert visible ${type}`;
    alertBox.style.display = 'flex';
  }
}
window.showNotice = showNotice;

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
  return params.get('redirect') || 'index.html';
}

function submitUnifiedLogin(email, password) {
  const btn = document.getElementById('btnSignInSubmit');
  clearAlerts();
  setLoading(btn, true);

  setTimeout(() => {
    setLoading(btn, false);
    if (!window.TourismHubStore) {
      showNotice('Authentication system is initializing. Please retry in a moment.', 'error');
      return;
    }

    const cleanEmail = (email || '').toLowerCase().trim();

    // 1. Check if user credentials match an Admin / Operator
    const adminUsers = TourismHubStore.getAdminUsers() || [];
    const isAdminAccount = adminUsers.some(u => (u.email || '').toLowerCase().trim() === cleanEmail);

    if (isAdminAccount) {
      const res = TourismHubStore.adminLogin(email, password);
      if (res.success) {
        showNotice(`Operator clearance verified! Welcome, ${res.user.name}. Entering Admin Portal...`, 'success');
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 600);
      } else {
        showNotice(res.message, 'error');
      }
      return;
    }

    // 2. Otherwise authenticate against registered Tourist / Client accounts
    const res = TourismHubStore.clientLogin(email, password);
    if (res.success) {
      showNotice(`Welcome back, ${res.user.name}! Entering Tourist Portal...`, 'success');
      setTimeout(() => {
        window.location.href = getReturnUrl();
      }, 600);
    } else {
      showNotice(res.message, 'error');
    }
  }, 400);
}

function submitClientRegister(name, email, password, country, phone) {
  const btn = document.getElementById('btnRegisterSubmit');
  clearAlerts();
  setLoading(btn, true);

  setTimeout(() => {
    setLoading(btn, false);
    if (!window.TourismHubStore || typeof TourismHubStore.clientRegister !== 'function') {
      showNotice('Registration system is initializing. Please retry in a moment.', 'error');
      return;
    }

    const res = TourismHubStore.clientRegister(name, email, password, country, phone);
    if (res.success) {
      showNotice(`Account registered! Welcome, ${res.user.name}. Redirecting to Tourist Portal...`, 'success');
      setTimeout(() => {
        window.location.href = getReturnUrl();
      }, 700);
    } else {
      showNotice(res.message, 'error');
    }
  }, 450);
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const formSignIn = document.getElementById('formSignIn');
  const formRegister = document.getElementById('formRegister');
  const activeBar = document.getElementById('activeSessionBar');

  // Display active session notification if an Admin or Tourist is already logged in
  if (window.TourismHubStore && activeBar) {
    const adminAuth = TourismHubStore.getAdminAuth ? TourismHubStore.getAdminAuth() : null;
    const clientAuth = TourismHubStore.getClientAuth ? TourismHubStore.getClientAuth() : null;

    if (adminAuth) {
      activeBar.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: #f0f9ff; border: 1.5px solid #7dd3fc; border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <img src="${adminAuth.avatar || 'assets/hero-banner.jpg'}" alt="${adminAuth.name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #0284c7;">
            <div style="font-size: 0.82rem; color: #0369a1; line-height: 1.3;">
              <strong>${adminAuth.name}</strong> <span style="font-size: 0.7rem; background: #0284c7; color: #fff; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; margin-left: 0.3rem;">ADMIN CLEARANCE</span><br>
              <span style="font-size: 0.74rem; color: #0284c7;">${adminAuth.role || 'Operator'} • ${adminAuth.email}</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <a href="admin.html" style="font-size: 0.74rem; padding: 0.4rem 0.75rem; background: #0284c7; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700;">Admin Portal</a>
            <button type="button" onclick="TourismHubStore.adminLogout(); location.reload();" style="font-size: 0.74rem; padding: 0.4rem 0.65rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign Out</button>
          </div>
        </div>
      `;
    } else if (clientAuth) {
      activeBar.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <img src="${clientAuth.avatar || 'assets/hero-banner.jpg'}" alt="${clientAuth.name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #10b981;">
            <div style="font-size: 0.82rem; color: #166534; line-height: 1.3;">
              <strong>${clientAuth.name}</strong> <span style="font-size: 0.7rem; background: #10b981; color: #fff; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; margin-left: 0.3rem;">TOURIST ACCOUNT</span><br>
              <span style="font-size: 0.74rem; color: #15803d;">${clientAuth.email}</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <a href="index.html" style="font-size: 0.74rem; padding: 0.4rem 0.75rem; background: #10b981; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700;">Tourist Portal</a>
            <button type="button" onclick="TourismHubStore.clientLogout(); location.reload();" style="font-size: 0.74rem; padding: 0.4rem 0.65rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign Out</button>
          </div>
        </div>
      `;
    }
  }

  // Attach submit listeners
  if (formSignIn) {
    formSignIn.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signInEmail')?.value;
      const pwd = document.getElementById('signInPassword')?.value;
      submitUnifiedLogin(email, pwd);
    });
  }

  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName')?.value;
      const email = document.getElementById('regEmail')?.value;
      const country = document.getElementById('regCountry')?.value;
      const phone = document.getElementById('regPhone')?.value;
      const pwd = document.getElementById('regPassword')?.value;
      submitClientRegister(name, email, pwd, country, phone);
    });
  }
});

