// Tab Switcher
    function switchProfileTab(tab) {
      document.querySelectorAll('.profile-tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.profile-tab-pane').forEach(pane => pane.classList.remove('active'));

      if (tab === 'passes') {
        document.getElementById('tabBtnPasses')?.classList.add('active');
        document.getElementById('panePasses')?.classList.add('active');
      } else if (tab === 'favorites') {
        document.getElementById('tabBtnFavorites')?.classList.add('active');
        document.getElementById('paneFavorites')?.classList.add('active');
        renderProfileFavorites();
      } else if (tab === 'settings') {
        document.getElementById('tabBtnSettings')?.classList.add('active');
        document.getElementById('paneSettings')?.classList.add('active');
      } else if (tab === 'account') {
        document.getElementById('tabBtnAccount')?.classList.add('active');
        document.getElementById('paneAccount')?.classList.add('active');
      }
      const mobileSel = document.getElementById('profileMobileTabSelect');
      if (mobileSel && mobileSel.value !== tab) mobileSel.value = tab;
    }

    function renderProfileItinerary() {
      if (!window.TourismHubStore) return;
      const itinIds = (typeof TourismHubStore.getItinerary === 'function') ? TourismHubStore.getItinerary() : [];
      const countEl = document.getElementById('itinTabCount');
      if (countEl) countEl.textContent = itinIds.length;
      const listEl = document.getElementById('profileItineraryList');
      if (!listEl) return;

      if (itinIds.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 10px;">Your itinerary is empty. Browse attractions and click <strong>+ Itinerary</strong> to plan your trip!</div>';
        return;
      }

      const catalog = (typeof TourismHubStore.getCatalog === 'function') ? TourismHubStore.getCatalog() : [];
      listEl.innerHTML = itinIds.map((id, idx) => {
        const item = catalog.find(a => a.id === id);
        if (!item) return '';
        const img = item.image || 'assets/no-image.svg';
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.85rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card); flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 200px;">
              <span style="width: 26px; height: 26px; border-radius: 50%; background: var(--primary, #0284c7); color: #fff; font-size: 0.78rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${idx + 1}</span>
              <img src="${img}" alt="${item.title}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.src='assets/no-image.svg'" style="width: 54px; height: 42px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
              <div>
                <a href="attraction-details.html?id=${item.id}" style="font-weight: 700; color: var(--text-main); text-decoration: none; font-size: 0.92rem;">${item.title}</a>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${item.location || 'Manila'} &bull; ${item.operatingHours || 'Open Daily'}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <button type="button" class="btn-secondary btn-sm" onclick="TourismHubStore.moveItineraryItem('${item.id}', 'up'); renderProfileItinerary();" ${idx === 0 ? 'disabled' : ''} title="Move Up">&uarr;</button>
              <button type="button" class="btn-secondary btn-sm" onclick="TourismHubStore.moveItineraryItem('${item.id}', 'down'); renderProfileItinerary();" ${idx === itinIds.length - 1 ? 'disabled' : ''} title="Move Down">&darr;</button>
              <button type="button" class="btn-secondary btn-sm" onclick="TourismHubStore.removeFromItinerary('${item.id}'); renderProfileItinerary();" style="color: #ef4444;" title="Remove">&times;</button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Saved Favorites Tab
    function renderProfileFavorites() {
      if (!window.TourismHubStore) return;
      const favIds = (typeof TourismHubStore.getFavorites === 'function') ? TourismHubStore.getFavorites() : [];
      const favCountEl = document.getElementById('favTabCount');
      if (favCountEl) favCountEl.textContent = favIds.length;

      const listEl = document.getElementById('profileFavoritesList');
      if (!listEl) return;

      if (favIds.length === 0) {
        listEl.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius-lg);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.8" style="margin: 0 auto 0.75rem;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">No Saved Favorites Yet</h3>
            <p style="font-size: 0.88rem; color: var(--text-muted); max-width: 420px; margin: 0.5rem auto 1.25rem;">Browse our attractions catalog and tap the heart icon on any destination to save it here for quick access.</p>
            <a href="attractions.html" class="btn-primary-blue" style="display: inline-flex; text-decoration: none;">Explore Attractions</a>
          </div>
        `;
        return;
      }

      const catalog = TourismHubStore.getCatalog ? TourismHubStore.getCatalog() : [];
      const favItems = favIds.map(id => catalog.find(c => c.id === id)).filter(Boolean);

      listEl.innerHTML = favItems.map(item => {
        const fallbackImg = item.image || 'assets/no-image.svg';
        return `
          <div class="profile-pass-item" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="position: relative; border-radius: 8px; overflow: hidden; height: 160px; margin-bottom: 0.85rem;">
                <img src="${fallbackImg}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" referrerpolicy="no-referrer" onerror="this.src='assets/no-image.svg'">
                <span class="portal-pill-badge blue" style="position: absolute; top: 10px; left: 10px; backdrop-filter: blur(4px);">${item.category || item.badge || 'Attraction'}</span>
              </div>
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.35rem;">${item.title}</h4>
              <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
                <span>${item.location || 'Resort Grounds'}</span>
              </div>
              <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${item.description || 'Experience world-class resort amenities and sights.'}
              </p>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: auto; pt: 0.5rem; border-top: 1px solid var(--border);">
              <a href="index.html#featuredAttractions" class="btn-primary-blue" style="flex: 1; text-align: center; justify-content: center; text-decoration: none; font-size: 0.82rem; padding: 0.55rem;">
                Book Pass
              </a>
              <button type="button" onclick="removeProfileFavorite('${item.id}', '${item.title.replace(/'/g, "\\'")}')" style="padding: 0.55rem 0.75rem; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 8px; color: #ef4444; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;" title="Remove from favorites">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                <span>Remove</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Remove favorite helper
    window.removeProfileFavorite = function(id, title) {
      if (window.TourismHubStore && typeof TourismHubStore.removeFavorite === 'function') {
        TourismHubStore.removeFavorite(id);
        renderProfileFavorites();
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      }
    };

    // Dark Mode Controller
    function toggleDarkMode(isDark) {
      if (typeof window.toggleThemeFromDropdown === 'function') {
        window.toggleThemeFromDropdown(isDark);
      } else {
        if (isDark) {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('tourismhub_theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('tourismhub_theme', 'light');
        }
        document.querySelectorAll('#themeToggle, .theme-toggle-input').forEach(t => { t.checked = isDark; });
      }
    }

    function saveSetting(key, val) {
      localStorage.setItem('tourismhub_setting_' + key, val);
      TourismHubDialog.alert('Preference updated successfully!', { title: 'Settings Saved' });
    }

    const photoCropState = {
      image: null,
      zoom: 1,
      baseZoom: 1,
      offsetX: 0,
      offsetY: 0,
      dragX: 0,
      dragY: 0,
      dragOffsetX: 0,
      dragOffsetY: 0
    };

    function showProfilePhotoMessage(message, warning) {
      if (window.showPortalToast) {
        window.showPortalToast(message, warning ? 'warning' : 'success');
      } else {
        TourismHubDialog.alert(message, { title: warning ? 'Warning' : 'Notice' });
      }
    }

    function renderPhotoCropper() {
      const canvas = document.getElementById('cropperCanvas');
      if (!canvas || !photoCropState.image) return;

      const context = canvas.getContext('2d');
      const image = photoCropState.image;
      const width = image.width * photoCropState.zoom;
      const height = image.height * photoCropState.zoom;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        (canvas.width - width) / 2 + photoCropState.offsetX,
        (canvas.height - height) / 2 + photoCropState.offsetY,
        width,
        height
      );
    }

    function closePhotoCropper() {
      document.getElementById('photoCropModal').classList.remove('active');
      photoCropState.image = null;
    }
    window.closePhotoCropper = closePhotoCropper;

    function openPhotoCropper(file) {
      let imageUrl;
      try {
        imageUrl = URL.createObjectURL(file);
      } catch (error) {
        showProfilePhotoMessage('The selected photo could not be opened.', true);
        return;
      }

      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(imageUrl);
        const canvas = document.getElementById('cropperCanvas');
        photoCropState.image = image;
        photoCropState.baseZoom = Math.max(canvas.width / image.width, canvas.height / image.height);
        photoCropState.zoom = photoCropState.baseZoom;
        photoCropState.offsetX = 0;
        photoCropState.offsetY = 0;
        document.getElementById('cropperZoomSlider').value = '1';
        renderPhotoCropper();
        document.getElementById('photoCropModal').classList.add('active');
      };
      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        showProfilePhotoMessage('The selected file is not a readable image.', true);
      };
      image.src = imageUrl;
    }

    function initProfilePhotoUpload() {
      const input = document.getElementById('profilePhotoInput');
      const canvas = document.getElementById('cropperCanvas');
      const slider = document.getElementById('cropperZoomSlider');
      const applyButton = document.getElementById('cropperApplyBtn');
      if (!input || !canvas || !slider || !applyButton) return;

      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          showProfilePhotoMessage('Choose a PNG, JPEG, or WebP image.', true);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          showProfilePhotoMessage('The selected photo exceeds the 5 MB limit.', true);
          return;
        }
        openPhotoCropper(file);
      });

      slider.addEventListener('input', () => {
        if (!photoCropState.image) return;
        photoCropState.zoom = photoCropState.baseZoom * Number(slider.value);
        renderPhotoCropper();
      });

      canvas.addEventListener('pointerdown', event => {
        if (!photoCropState.image) return;
        photoCropState.dragX = event.clientX;
        photoCropState.dragY = event.clientY;
        photoCropState.dragOffsetX = photoCropState.offsetX;
        photoCropState.dragOffsetY = photoCropState.offsetY;
        canvas.setPointerCapture(event.pointerId);
      });
      canvas.addEventListener('pointermove', event => {
        if (!photoCropState.image || !canvas.hasPointerCapture(event.pointerId)) return;
        const bounds = canvas.getBoundingClientRect();
        photoCropState.offsetX = photoCropState.dragOffsetX +
          (event.clientX - photoCropState.dragX) * canvas.width / bounds.width;
        photoCropState.offsetY = photoCropState.dragOffsetY +
          (event.clientY - photoCropState.dragY) * canvas.height / bounds.height;
        renderPhotoCropper();
      });

      applyButton.addEventListener('click', async () => {
        if (!photoCropState.image) return;
        const output = document.createElement('canvas');
        output.width = 320;
        output.height = 320;
        const context = output.getContext('2d');
        const cropSize = 220;
        context.drawImage(
          canvas,
          (canvas.width - cropSize) / 2,
          (canvas.height - cropSize) / 2,
          cropSize,
          cropSize,
          0,
          0,
          output.width,
          output.height
        );

        const avatar = output.toDataURL('image/jpeg', 0.88);
        const result = await TourismHubStore.updateProfileAvatar(avatar);
        if (!result.success) {
          showProfilePhotoMessage(result.message || 'The profile photo could not be saved.', true);
          return;
        }

        document.getElementById('heroAvatar').src = avatar;
        document.getElementById('topAvatar').src = avatar;
        closePhotoCropper();
        showProfilePhotoMessage(result.message, !result.synced && Boolean(window.TourismHubSupabase && TourismHubSupabase.isReady()));
      });
    }

    window.resetToInitialsAvatar = async function () {
      if (!window.TourismHubStore || typeof TourismHubStore.generateInitialsAvatar !== 'function') return;
      const user = TourismHubStore.getAdminAuth() || TourismHubStore.getClientAuth();
      if (!user) return;

      const result = await TourismHubStore.updateProfileAvatar(TourismHubStore.generateInitialsAvatar(user.name));
      if (!result.success) {
        showProfilePhotoMessage(result.message || 'The profile photo could not be reset.', true);
        return;
      }
      document.getElementById('heroAvatar').src = result.avatar;
      document.getElementById('topAvatar').src = result.avatar;
      showProfilePhotoMessage(result.message, !result.synced && Boolean(window.TourismHubSupabase && TourismHubSupabase.isReady()));
    };

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closePhotoCropper();
    });

    // Populate Page with Active User Data
    document.addEventListener('DOMContentLoaded', () => {
      // Check saved theme
      const savedTheme = localStorage.getItem('tourismhub_theme');
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.checked = true;
      }

      if (!window.TourismHubStore) return;
      const client = TourismHubStore.getClientAuth ? TourismHubStore.getClientAuth() : null;
      const admin = TourismHubStore.getAdminAuth ? TourismHubStore.getAdminAuth() : null;
      const user = admin || client;

      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      // Populate Hero & Header
      const topUserNameEl = document.getElementById('topUserName');
      if (topUserNameEl) topUserNameEl.textContent = user.name || 'User';
      document.getElementById('heroName').textContent = user.name || 'User';
      document.getElementById('heroEmail').textContent = user.email || '';
      document.getElementById('heroCountry').textContent = user.country || 'Philippines';

      // Show Admin Dashboard buttons & sidebar link if operator
      const isAdminSession = Boolean(admin && admin.roleKey);
      document.querySelectorAll('.admin-only-feature').forEach(el => {
        if (isAdminSession) {
          el.style.display = (el.tagName === 'A' || el.tagName === 'BUTTON') ? 'inline-flex' : (el.tagName === 'LI' ? 'block' : '');
        } else {
          el.style.display = 'none';
        }
      });

      const avatar = typeof TourismHubStore.getUserAvatar === 'function'
        ? TourismHubStore.getUserAvatar(user)
        : (user.avatar || TourismHubStore.generateInitialsAvatar(user.name));
      document.getElementById('topAvatar').src = avatar;
      document.getElementById('heroAvatar').src = avatar;
      initProfilePhotoUpload();

      // Security Password Visibility Helper
      window.toggleSecurityPwd = function (inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        if (btn) {
          btn.innerHTML = show
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
      };

      // Change Password Form Handler
      const changePwdForm = document.getElementById('changePasswordForm');
      const pwdAlert = document.getElementById('passwordChangeAlert');
      if (changePwdForm) {
        changePwdForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const currentPwd = document.getElementById('currentPasswordInput')?.value || '';
          const newPwd = document.getElementById('newPasswordInput')?.value || '';
          const confirmPwd = document.getElementById('confirmPasswordInput')?.value || '';
          const submitBtn = document.getElementById('btnUpdatePassword');

          const showPwdAlert = (msg, isError) => {
            if (!pwdAlert) return;
            pwdAlert.textContent = msg;
            pwdAlert.className = 'security-alert ' + (isError ? 'error' : 'success');
          };

          if (newPwd.length < 6) {
            showPwdAlert('New password must be at least 6 characters long.', true);
            return;
          }
          if (newPwd !== confirmPwd) {
            showPwdAlert('New password and confirmation do not match.', true);
            return;
          }

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';
          }
          const result = await TourismHubStore.changePassword(currentPwd, newPwd);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Password';
          }

          if (result && result.success) {
            showPwdAlert(result.message || 'Password updated successfully!', false);
            changePwdForm.reset();
            if (window.showPortalToast) window.showPortalToast(result.message || 'Password updated!');
          } else {
            showPwdAlert((result && result.message) || 'Failed to update password.', true);
          }
        });
      }

      // Account Tab Details
      document.getElementById('accName').textContent = user.name || '';
      document.getElementById('accEmail').textContent = user.email || '';
      const accCityEl = document.getElementById('accCity');
      if (accCityEl) accCityEl.textContent = user.city || 'Manila';
      const heroCountryEl = document.getElementById('heroCountry');
      if (heroCountryEl) heroCountryEl.textContent = user.city || 'Manila';

      // Populate System Version in Settings Tab
      const versionBadgeEl = document.getElementById('settingsSystemVersionBadge');
      if (versionBadgeEl && typeof TourismHubStore.getSystemVersion === 'function') {
        const versionInfo = TourismHubStore.getSystemVersion();
        versionBadgeEl.textContent = versionInfo.fullLabel || 'v1.5.0 (Build 2026.11.15)';
      }

      // Initialize Favorites & Itinerary
      renderProfileFavorites();
      renderProfileItinerary();
      window.addEventListener('favoritesUpdated', renderProfileFavorites);

      // Handle URL hash tab routing (Account & Security is default front tab)
      const hash = window.location.hash.replace('#', '');
      if (hash === 'favorites') {
        switchProfileTab('favorites');
      } else if (hash === 'settings') {
        switchProfileTab('settings');
      } else if (hash === 'passes') {
        switchProfileTab('passes');
      } else {
        switchProfileTab('account');
      }

      function isOwnedProfilePass(code) {
        if (!window.TourismHubStore || typeof TourismHubStore.getUserPasses !== 'function') return false;
        const cleanCode = String(code || '').toUpperCase().trim();
        return TourismHubStore.getUserPasses(user).some(p => String(p.code || '').toUpperCase().trim() === cleanCode);
      }

      // QR Code Zoom & Download Helpers
      window.cancelProfilePass = async function (code) {
        if (!window.TourismHubStore || typeof TourismHubStore.cancelPass !== 'function') return;
        if (!(await TourismHubDialog.confirm(`Are you sure you want to cancel pass ${code}?`, { title: 'Cancel Pass', confirmText: 'Cancel Pass', danger: true }))) return;
        const res = TourismHubStore.cancelPass(code);
        if (res && res.success) {
          if (typeof window.showPortalToast === 'function') window.showPortalToast(`Pass ${code} has been cancelled.`);
          window.location.reload();
        }
      };

      window.openQrZoomModal = function (code, attraction, visitorName) {
        if (!isOwnedProfilePass(code)) {
          if (window.showPortalToast) showPortalToast('QR codes are only visible to the user who booked the pass.');
          return;
        }
        const modal = document.getElementById('qrZoomModal');
        const img = document.getElementById('zoomModalQrImg');
        const titleEl = document.getElementById('zoomModalTitle');
        const codeEl = document.getElementById('zoomModalCode');
        const visitorEl = document.getElementById('zoomModalVisitor');
        const dlBtn = document.getElementById('zoomDownloadBtn');

        if (!modal) return;
        if (titleEl) titleEl.textContent = attraction || 'Digital Pass QR Code';
        if (codeEl) codeEl.textContent = code;
        if (visitorEl) visitorEl.textContent = `Pass Holder: ${visitorName || 'Tourist Guest'}`;
        if (img) {
          img.src = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(code)}`;
        }
        if (dlBtn) {
          dlBtn.onclick = function () {
            window.downloadPassQr(code, attraction);
          };
        }
        modal.classList.add('active');
        modal.style.display = 'flex';
      };

      window.closeQrZoomModal = function () {
        const modal = document.getElementById('qrZoomModal');
        if (modal) {
          modal.classList.remove('active');
          modal.style.display = '';
        }
      };

      window.downloadPassQr = async function (code, attraction) {
        if (!isOwnedProfilePass(code)) {
          if (window.showPortalToast) showPortalToast('QR codes are only visible to the user who booked the pass.');
          return;
        }
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=16&data=${encodeURIComponent(code)}`;
        try {
          const response = await fetch(qrUrl);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `TourismHub-QR-${code}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
          if (window.showPortalToast) {
            showPortalToast(`Downloaded QR Pass: ${code}`);
          }
        } catch (err) {
          console.warn('Direct blob download fallback:', err);
          window.open(qrUrl, '_blank');
        }
      };

      // Compiled Passes (strictly scoped to the authenticated pass booker)
      function renderProfilePasses() {
        const passes = typeof TourismHubStore.getUserPasses === 'function'
          ? TourismHubStore.getUserPasses(user)
          : [];
        document.getElementById('passTabCount').textContent = passes.length;
        const listEl = document.getElementById('profilePassesList');

        if (passes.length === 0) {
          listEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius-lg);">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin: 0 auto 0.75rem; color: var(--text-muted);"><path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/></svg>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">No Digital Passes Issued Yet</h3>
              <p style="font-size: 0.88rem; color: var(--text-muted); max-width: 420px; margin: 0.5rem auto 1.25rem;">Explore our featured attractions and festivals to reserve your priority entry pass.</p>
              <a href="attractions.html" class="btn-primary-blue" style="display: inline-flex; text-decoration: none;">Browse Catalog</a>
            </div>
          `;
        } else {
          listEl.innerHTML = passes.map(p => {
            const safeAttr = (p.attraction || 'Attraction Pass').replace(/'/g, "\\'");
            const safeVisitor = (p.visitorName || p.touristName || user.name || 'Tourist').replace(/'/g, "\\'");
            return `
            <div class="profile-pass-item">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                  <span class="portal-pill-badge blue">${p.passType || 'Priority Pass'}</span>
                  <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 0.35rem;">${p.attraction || 'Attraction Pass'}</h4>
                </div>
                <span class="portal-pill-badge ${p.status === 'valid' ? 'green' : 'pink'}">${(p.status || 'valid').toUpperCase()}</span>
              </div>

              <div style="display: flex; gap: 1rem; align-items: center; margin: 1rem 0; background: var(--bg-subtle); padding: 0.85rem; border-radius: 8px;">
                <div onclick="openQrZoomModal('${p.code}', '${safeAttr}', '${safeVisitor}')" title="Click to enlarge QR Code" style="background: #ffffff; padding: 6px; border-radius: 6px; border: 1px solid var(--border); flex-shrink: 0; cursor: zoom-in; position: relative; transition: transform 0.18s ease;" onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform='scale(1)'">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=6&data=${encodeURIComponent(p.code)}" alt="QR Code ${p.code}" width="76" height="76" style="display: block;" />
                </div>
                <div style="font-size: 0.82rem; line-height: 1.5; color: var(--text-muted);">
                  <div>Code: <strong style="color: var(--primary);">${p.code}</strong></div>
                  <div>Visitor: <strong>${p.visitorName || p.touristName || user.name}</strong></div>
                  <div>Date: <strong>${p.validDate || 'Today'}</strong></div>
                  <div>Slot: <strong>${p.slot || 'Standard Access'}</strong></div>
                  <div>Party: <strong>${p.partySize || 1} Guest(s)</strong></div>
                </div>
              </div>

              <div style="display: flex; gap: 0.5rem; align-items: stretch; width: 100%; box-sizing: border-box;">
                <button type="button" onclick="openQrZoomModal('${p.code}', '${safeAttr}', '${safeVisitor}')" style="flex: 1; min-width: 0; padding: 0.55rem 0.65rem; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 8px; font-weight: 700; font-size: 0.8rem; color: var(--text-main); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; white-space: nowrap;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  <span>Zoom QR</span>
                </button>
                <button type="button" onclick="downloadPassQr('${p.code}', '${safeAttr}')" class="btn-primary-blue" style="flex: 1; min-width: 0; padding: 0.55rem 0.65rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; white-space: nowrap;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Download QR</span>
                </button>
                ${(p.status !== 'cancelled' && p.status !== 'checked_in') ? `<button type="button" onclick="cancelProfilePass('${p.code}')" title="Cancel Pass" aria-label="Cancel Pass" style="flex: 0 0 38px; width: 38px; padding: 0; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; color: #ef4444; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>` : ''}
              </div>
            </div>
          `;
          }).join('');
        }
      }
      renderProfilePasses();
      window.addEventListener('supabaseSyncComplete', renderProfilePasses);
      if (TourismHubStore.onSync) {
        TourismHubStore.onSync(() => renderProfilePasses());
      }
    });
