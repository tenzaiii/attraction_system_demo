(function () {
  let activeStatusFilter = 'all';

  function esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function getActiveUser() {
    if (!window.TourismHubStore) return null;
    return (typeof TourismHubStore.getAdminAuth === 'function' && TourismHubStore.getAdminAuth()) ||
      (typeof TourismHubStore.getClientAuth === 'function' && TourismHubStore.getClientAuth()) ||
      null;
  }

  function renderMyPasses() {
    const grid = document.getElementById('myQrPassesGrid');
    const countAllEl = document.getElementById('countAllPasses');
    if (!grid) return;

    const user = getActiveUser();
    if (!user) {
      if (countAllEl) countAllEl.textContent = '0';
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border: 1px dashed var(--border); border-radius: 16px;">
          <h3 style="margin: 0 0 0.5rem; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Sign In to View Your QR Passes</h3>
          <p style="margin: 0 auto 1.25rem; max-width: 420px; font-size: 0.88rem; color: var(--text-muted);">Log in to your TourismHub account to access, enlarge, download, or manage your digital QR passes.</p>
          <a href="login.html?redirect=passes.html" class="btn-primary-blue" style="display: inline-flex; text-decoration: none; border-radius: 999px; padding: 0.65rem 1.4rem;">Sign In</a>
        </div>
      `;
      return;
    }

    const allPasses = (window.TourismHubStore && typeof TourismHubStore.getUserPasses === 'function')
      ? TourismHubStore.getUserPasses(user)
      : [];

    if (countAllEl) countAllEl.textContent = String(allPasses.length);

    const filtered = activeStatusFilter === 'all'
      ? allPasses
      : allPasses.filter(p => String(p.status || 'valid').toLowerCase() === activeStatusFilter);

    if (!filtered.length) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border: 1px dashed var(--border); border-radius: 16px;">
          <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 800; color: var(--text-main);">No QR Passes Found</h3>
          <p style="margin: 0 auto 1.25rem; max-width: 420px; font-size: 0.88rem; color: var(--text-muted);">Browse upcoming events or attractions to book a digital QR pass.</p>
          <a href="events-catalog.html" class="btn-primary-blue" style="display: inline-flex; text-decoration: none; border-radius: 999px; padding: 0.6rem 1.25rem;">Browse Upcoming Events</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const safeAttr = String(p.attraction || 'Event Pass').replace(/'/g, "\\'");
      const safeVisitor = String(p.visitorName || p.touristName || user.name || 'Tourist').replace(/'/g, "\\'");
      const status = String(p.status || 'valid').toLowerCase();
      const badgeClass = status === 'valid' ? 'green' : (status === 'checked_in' ? 'blue' : 'pink');
      const canCancel = status !== 'cancelled' && status !== 'checked_in';

      return `
        <div class="profile-pass-item" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem;">
            <div>
              <span class="portal-pill-badge blue">${esc(p.passType || 'Standard Tourist Pass')}</span>
              <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0.4rem 0 0;">${esc(p.attraction || 'Tourism Pass')}</h4>
            </div>
            <span class="portal-pill-badge ${badgeClass}">${esc(status.replace('_', ' ').toUpperCase())}</span>
          </div>

          <div style="display: flex; gap: 1rem; align-items: center; margin: 1rem 0; background: var(--bg-subtle, var(--bg-page)); padding: 0.85rem; border-radius: 10px;">
            <div onclick="window.openQrZoomModal('${esc(p.code)}', '${safeAttr}', '${safeVisitor}')" title="Click to enlarge QR Code" style="background: #ffffff; padding: 6px; border-radius: 8px; border: 1px solid var(--border); flex-shrink: 0; cursor: zoom-in;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=6&data=${encodeURIComponent(p.code)}" alt="QR Code ${esc(p.code)}" width="76" height="76" style="display: block;" />
            </div>
            <div style="font-size: 0.82rem; line-height: 1.5; color: var(--text-muted); min-width: 0;">
              <div>Code: <strong style="color: var(--primary, #0284c7);">${esc(p.code)}</strong></div>
              <div>Visitor: <strong style="color: var(--text-main);">${esc(p.visitorName || p.touristName || user.name)}</strong></div>
              <div>Date: <strong style="color: var(--text-main);">${esc(p.validDate || 'Today')}</strong></div>
              <div>Slot: <strong style="color: var(--text-main);">${esc(p.slot || 'Standard Access')}</strong></div>
              <div>Party: <strong style="color: var(--text-main);">${esc(p.partySize || 1)} Guest(s)</strong></div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: stretch; width: 100%; box-sizing: border-box;">
            <button type="button" onclick="window.openQrZoomModal('${esc(p.code)}', '${safeAttr}', '${safeVisitor}')" style="flex: 1; min-width: 0; padding: 0.55rem 0.65rem; background: var(--bg-page); border: 1px solid var(--border); border-radius: 8px; font-weight: 700; font-size: 0.8rem; color: var(--text-main); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; white-space: nowrap;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              <span>Zoom QR</span>
            </button>
            <button type="button" onclick="window.downloadPassQr('${esc(p.code)}', '${safeAttr}')" class="btn-primary-blue" style="flex: 1; min-width: 0; padding: 0.55rem 0.65rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; white-space: nowrap;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Download QR</span>
            </button>
            ${canCancel ? `<button type="button" onclick="window.cancelUserPass('${esc(p.code)}')" title="Cancel Pass" aria-label="Cancel Pass" style="flex: 0 0 38px; width: 38px; padding: 0; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; color: #ef4444; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.openQrZoomModal = function (code, attraction, visitor) {
    const modal = document.getElementById('qrZoomModal');
    if (!modal) return;
    document.getElementById('zoomModalTitle').textContent = attraction || 'Digital QR Pass';
    document.getElementById('zoomModalQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(code)}`;
    document.getElementById('zoomModalCode').textContent = code;
    document.getElementById('zoomModalVisitor').textContent = visitor ? `Guest: ${visitor}` : '';
    modal.classList.add('active');
    modal.style.display = 'flex';
  };

  window.closeQrZoomModal = function () {
    const modal = document.getElementById('qrZoomModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  };

  window.downloadPassQr = function (code, attraction) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=${encodeURIComponent(code)}`;
    fetch(qrUrl)
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${code}-${String(attraction || 'pass').replace(/[^a-z0-9]+/gi, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => window.open(qrUrl, '_blank'));
  };

  window.cancelUserPass = async function (code) {
    if (!window.TourismHubStore || typeof TourismHubStore.cancelPass !== 'function') return;
    const ok = window.TourismHubDialog
      ? await TourismHubDialog.confirm(`Are you sure you want to cancel pass ${code}?`, { title: 'Cancel Pass', confirmText: 'Cancel Pass', danger: true })
      : true;
    if (!ok) return;
    const res = TourismHubStore.cancelPass(code);
    if (res && res.success) {
      if (typeof window.showPortalToast === 'function') window.showPortalToast(`Pass ${code} has been cancelled.`);
      renderMyPasses();
    }
  };

  function init() {
    document.querySelectorAll('#passesStatusTabs .catalog-mode-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#passesStatusTabs .catalog-mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeStatusFilter = btn.dataset.passStatus || 'all';
        renderMyPasses();
      });
    });

    const modal = document.getElementById('qrZoomModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeQrZoomModal();
      });
    }

    renderMyPasses();
    window.addEventListener('supabaseSyncComplete', renderMyPasses);
    if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
      TourismHubStore.onSync(renderMyPasses);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
