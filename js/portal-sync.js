/**
 * TourismHub - Public Portal & Admin Control Real-Time Synchronization Engine
 * Bridges index.html, attractions.html, capacity.html, notifications.html, scanner.html with admin.html
 */

(function() {
  'use strict';

  function initPortalSync() {
    if (!window.TourismHubStore) {
      console.warn('TourismHubStore not detected. Synchronization disabled.');
      return;
    }

    // --- 1. Notification Badge Counter Update ---
    function updateNotifBadges() {
      const announcements = TourismHubStore.getAnnouncements();
      const badgeCount = announcements ? announcements.length : 0;
      document.querySelectorAll('.badge-count, .sidebar-badge').forEach(badge => {
        badge.textContent = badgeCount;
      });
      document.querySelectorAll('.sidebar-item-badge-dot').forEach(dot => {
        dot.style.display = badgeCount > 0 ? 'inline-block' : 'none';
      });
    }

    // --- 2. Attractions & Events Page (attractions.html) ---
    function syncAttractionsPage() {
      const grid = document.getElementById('portalCardsGrid');
      if (!grid) return;

      const catalog = TourismHubStore.getCatalog();
      const capacityData = TourismHubStore.getCapacityData();

      // Update Top Metrics
      const totalAttrEl = document.querySelector('.portal-stat-card:nth-child(1) .portal-stat-value');
      const totalEventsEl = document.querySelector('.portal-stat-card:nth-child(2) .portal-stat-value');
      const totalCapacityEl = document.querySelector('.portal-stat-card:nth-child(3) .portal-stat-value');
      const totalVisitorsEl = document.querySelector('.portal-stat-card:nth-child(4) .portal-stat-value');

      const eventsCount = catalog.filter(a => a.type === 'festival' || a.type === 'event').length;
      let totalCapacitySum = 0;
      let totalBookedSum = 0;

      Object.values(capacityData).forEach(slots => {
        if (Array.isArray(slots)) {
          slots.forEach(s => {
            totalCapacitySum += (s.max || 0);
            totalBookedSum += (s.booked || 0);
          });
        }
      });

      if (totalAttrEl) totalAttrEl.textContent = catalog.length;
      if (totalEventsEl) totalEventsEl.textContent = eventsCount;
      if (totalCapacityEl) totalCapacityEl.textContent = totalCapacitySum > 0 ? totalCapacitySum.toLocaleString() : '1,240';
      if (totalVisitorsEl) totalVisitorsEl.textContent = totalBookedSum > 0 ? totalBookedSum.toLocaleString() : '840';

      // Render Catalog Grid
      grid.innerHTML = catalog.map(item => {
        const badgeClass = item.type === 'festival' || item.type === 'event' ? 'event' : (item.type === 'amenity' ? 'amenity' : 'attraction');
        const badgeLabel = item.badge || (item.type === 'festival' ? 'Event' : 'Attraction');
        
        // Compute capacity from slots if available
        let capText = `${item.capacityPerSlot || 100} slots`;
        if (capacityData[item.id] && capacityData[item.id].length > 0) {
          const firstSlot = capacityData[item.id][0];
          capText = `${firstSlot.booked} / ${firstSlot.max}`;
        }

        const fallbackImg = item.image || 'assets/hero-banner.jpg';
        const locationStr = item.location || 'Resort Grounds';
        const hoursStr = item.operatingHours || '08:00 AM – 08:00 PM';

        return `
          <article class="portal-item-card" data-id="${item.id}" data-type="${item.type || 'attraction'}" data-area="${item.location ? item.location.toLowerCase() : 'all'}">
            <div class="portal-item-media">
              <img src="${fallbackImg}" alt="${item.title}" loading="lazy" onerror="this.src='assets/hero-banner.jpg'">
              <span class="portal-badge-tag ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="portal-item-body">
              <h3 class="portal-item-title">${item.title}</h3>
              <p class="portal-item-desc">${item.description || 'Experience world-class resort amenities and sights.'}</p>
              <div class="portal-item-meta-list">
                <div class="portal-item-meta-row">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
                  <span>${locationStr}</span>
                </div>
                <div class="portal-item-meta-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>${hoursStr}</span>
                </div>
                <div class="portal-item-meta-row">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  <span>Capacity: ${capText}</span>
                </div>
              </div>
            </div>
            <div class="portal-item-footer">
              <button class="portal-view-details-btn" onclick="openDetailsModal('${item.title.replace(/'/g, "\\'")}', '${locationStr.replace(/'/g, "\\'")}', '${hoursStr}', '${capText}', '${fallbackImg}')">View Details &gt;</button>
            </div>
          </article>
        `;
      }).join('');

      // Render Upcoming Events aside list dynamically
      const eventsListContainer = document.querySelector('.upcoming-events-list');
      if (eventsListContainer) {
        const eventItems = catalog.filter(a => a.type === 'festival' || a.type === 'event' || a.category === 'Festival');
        if (eventItems.length > 0) {
          eventsListContainer.innerHTML = eventItems.slice(0, 5).map(ev => `
            <div class="upcoming-event-item">
              <img src="${ev.image || 'assets/pahiyas-festival.jpg'}" alt="${ev.title}" class="upcoming-event-img">
              <div class="upcoming-event-details">
                <span class="upcoming-event-name">${ev.title}</span>
                <span class="upcoming-event-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${ev.operatingHours || 'Scheduled Event'}
                </span>
                <span class="upcoming-event-loc">${ev.location || 'Main Grounds'}</span>
                <span class="upcoming-event-badge">Event</span>
              </div>
            </div>
          `).join('');
        }
      }
    }

    // --- 3. Capacity & Schedule Page (capacity.html) ---
    function syncCapacityPage() {
      const tbody = document.getElementById('capacityTableBody');
      if (!tbody) return;

      const catalog = TourismHubStore.getCatalog();
      const capacityData = TourismHubStore.getCapacityData();

      tbody.innerHTML = catalog.map(item => {
        const slots = capacityData[item.id] || [];
        let cap = item.capacityPerSlot || 100;
        let booked = 0;

        if (slots.length > 0) {
          cap = slots.reduce((acc, s) => acc + (s.max || 0), 0);
          booked = slots.reduce((acc, s) => acc + (s.booked || 0), 0);
        }

        const available = Math.max(0, cap - booked);
        const isFull = available === 0 || (booked >= cap);
        const statusClass = isFull ? 'status-full' : 'status-normal';
        const statusLabel = isFull ? 'Full' : 'Normal';
        const isEvent = item.type === 'festival' || item.type === 'event';
        const typeBadge = isEvent ? 'purple' : 'blue';
        const typeLabel = isEvent ? 'Event' : 'Attraction';

        return `
          <tr data-type="${item.type || 'attraction'}">
            <td>
              <div class="attraction-cell-content">
                <img src="${item.image || 'assets/hero-banner.jpg'}" alt="${item.title}" class="attraction-cell-thumb" onerror="this.src='assets/hero-banner.jpg'">
                <div class="attraction-cell-info">
                  <span class="attraction-cell-title">${item.title}</span>
                  <div class="attraction-cell-meta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
                    <span>${item.location || 'Resort Grounds'}</span>
                  </div>
                  <div class="attraction-cell-meta" style="color: #94a3b8;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${item.operatingHours || '08:00 AM – 08:00 PM'}</span>
                  </div>
                </div>
              </div>
            </td>
            <td><span class="portal-pill-badge ${typeBadge}">${typeLabel}</span></td>
            <td><strong>${cap}</strong></td>
            <td>${booked}</td>
            <td><span class="${available > 0 ? 'avail-count-green' : 'avail-count-red'}">${available}</span></td>
            <td><span class="portal-pill-badge ${statusClass}">${statusLabel}</span></td>
            <td><button class="table-action-btn" onclick="openCapacityDetails('${item.title.replace(/'/g, "\\'")}', ${cap}, ${booked}, ${available}, '${statusLabel}')">View</button></td>
          </tr>
        `;
      }).join('');
    }

    // --- 4. Announcements & Notifications Page (notifications.html) ---
    function syncNotificationsPage() {
      const tbody = document.getElementById('notifsTableBody');
      if (!tbody) return;

      const announcements = TourismHubStore.getAnnouncements();

      tbody.innerHTML = announcements.map(ann => {
        const type = (ann.type || 'announcement').toLowerCase();
        let pillClass = 'blue';
        let iconClass = 'blue';
        let typeLabel = 'Announcement';

        if (type === 'weather' || type === 'alert' || ann.priority === 'urgent') {
          pillClass = 'pink';
          iconClass = 'yellow';
          typeLabel = 'Alert';
        } else if (type === 'event' || ann.category === 'Event') {
          pillClass = 'purple';
          iconClass = 'gold';
          typeLabel = 'Event';
        }

        const dateStr = ann.timestamp || 'Just now';

        return `
          <tr data-type="${typeLabel.toLowerCase()}">
            <td>
              <div class="notif-title-cell">
                <div class="notif-icon-circle ${iconClass}">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <div class="notif-text-group">
                  <span class="notif-heading">${ann.title}</span>
                  <span class="notif-subline">${ann.text || ''}</span>
                </div>
              </div>
            </td>
            <td><span class="portal-pill-badge ${pillClass}">${typeLabel}</span></td>
            <td>${dateStr}</td>
            <td><span class="portal-pill-badge green">Sent</span></td>
            <td style="text-align: right;">
              <button class="action-arrow-btn" style="margin-left: auto;" onclick="openAnnouncementDetail('${ann.title.replace(/'/g, "\\'")}', '${(ann.text || '').replace(/'/g, "\\'")}', '${typeLabel}', '${dateStr}', '${(ann.target || 'All Visitors').replace(/'/g, "\\'")}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // --- 5. QR Scanner Page (scanner.html) ---
    function syncScannerPage() {
      const tbody = document.getElementById('scansTableBody');
      if (!tbody) return;

      const logs = TourismHubStore.getLogs();

      tbody.innerHTML = logs.slice(0, 15).map(log => {
        const isValid = (log.result || '').includes('Approved') || (log.result || '').includes('Valid');
        const statusBadge = isValid ? '<span class="valid-dot-pill">Valid</span>' : '<span class="invalid-dot-pill">Invalid</span>';

        return `
          <tr>
            <td>${log.time || '10:00 AM'}</td>
            <td><strong>${log.visitor || 'Tourist Guest'}</strong></td>
            <td>${log.attraction || 'Attraction Entry'}</td>
            <td>${statusBadge}</td>
            <td style="text-align: right;">
              <button class="action-arrow-btn" style="margin-left: auto;" onclick="showScanReceipt('${(log.visitor || 'Tourist Guest').replace(/'/g, "\\'")}', '${(log.attraction || 'Attraction Entry').replace(/'/g, "\\'")}', '${log.pass || 'PASS-000'}', '${log.time || '10:00 AM'}', '${isValid ? 'Valid' : 'Invalid'}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // --- 6. Universal Public Portal Modals (Analytics, Settings, Pass Bookings) ---
    window.openAnalyticsModal = function() {
      let modal = document.getElementById('analyticsModal');
      if (!modal) {
        const catalog = TourismHubStore.getCatalog();
        const logs = TourismHubStore.getLogs();
        const passes = TourismHubStore.getPasses();
        const totalLogs = logs.length > 0 ? logs.length * 14 : 1240;

        const modalHtml = `
          <div class="modal-overlay active" id="analyticsModal" role="dialog" aria-modal="true" style="display: flex;">
            <div class="modal-window" style="max-width: 540px; background: #ffffff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); width: 90%; margin: auto;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0;">Visitor Traffic & Live Analytics</h3>
                <button onclick="document.getElementById('analyticsModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.25rem;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
                  <span style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Today's Visitors</span>
                  <div style="font-size: 1.6rem; font-weight: 800; color: #0284c7; margin-top: 0.25rem;">${totalLogs.toLocaleString()}</div>
                  <span style="font-size: 0.75rem; color: #10b981; font-weight: 600;">+14% vs yesterday</span>
                </div>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
                  <span style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Active Passes</span>
                  <div style="font-size: 1.6rem; font-weight: 800; color: #10b981; margin-top: 0.25rem;">${passes.length}</div>
                  <span style="font-size: 0.75rem; color: #64748b;">99.8% Turnstile Rate</span>
                </div>
              </div>
              <h4 style="font-size: 0.9rem; font-weight: 700; color: #334155; margin-bottom: 0.75rem;">Hourly Occupancy Curve</h4>
              <div style="display: flex; align-items: flex-end; gap: 0.5rem; height: 110px; padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 1.25rem;">
                <div style="flex: 1; height: 35%; background: #93c5fd; border-radius: 4px;" title="9 AM: 35%"></div>
                <div style="flex: 1; height: 60%; background: #60a5fa; border-radius: 4px;" title="11 AM: 60%"></div>
                <div style="flex: 1; height: 95%; background: #0284c7; border-radius: 4px;" title="1 PM: 95% Peak"></div>
                <div style="flex: 1; height: 80%; background: #38bdf8; border-radius: 4px;" title="3 PM: 80%"></div>
                <div style="flex: 1; height: 45%; background: #93c5fd; border-radius: 4px;" title="5 PM: 45%"></div>
              </div>
              <button onclick="document.getElementById('analyticsModal').remove()" style="width: 100%; padding: 0.75rem; background: #0284c7; color: #ffffff; font-weight: 700; border-radius: 8px; border: none; cursor: pointer;">Close Analytics</button>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
      } else {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
    };

    window.openSettingsModal = function() {
      let modal = document.getElementById('settingsModal');
      if (!modal) {
        const modalHtml = `
          <div class="modal-overlay active" id="settingsModal" role="dialog" aria-modal="true" style="display: flex;">
            <div class="modal-window" style="max-width: 480px; background: #ffffff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); width: 90%; margin: auto;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0;">Portal Preferences & Settings</h3>
                <button onclick="document.getElementById('settingsModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
              </div>
              <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                  <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">Display Currency</label>
                  <select id="settingCurrency" style="width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px;">
                    <option value="PHP">Philippine Peso (₱ / PHP)</option>
                    <option value="USD" selected>US Dollar ($ / USD)</option>
                    <option value="SGD">Singapore Dollar (S$ / SGD)</option>
                    <option value="EUR">Euro (€ / EUR)</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">Audio Chimes on Pass Scan</label>
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: #475569; cursor: pointer;">
                    <input type="checkbox" id="settingSound" checked>
                    <span>Play acoustic confirmation chime on turnstile entry</span>
                  </label>
                </div>
                <div>
                  <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">Real-Time Refresh Frequency</label>
                  <span style="font-size: 0.84rem; color: #10b981; font-weight: 600;">✓ Instantaneous multi-tab cloud sync enabled</span>
                </div>
              </div>
              <button onclick="document.getElementById('settingsModal').remove(); if(window.showPortalToast) showPortalToast('Preferences saved successfully!');" style="width: 100%; padding: 0.75rem; background: #10b981; color: #ffffff; font-weight: 700; border-radius: 8px; border: none; cursor: pointer;">Save Preferences</button>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
      } else {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
    };

    // --- 7. Announcement Detail Modal ---
    window.openAnnouncementDetail = function(title, text, type, time, target) {
      let modal = document.getElementById('announcementDetailModal');
      const badgeClass = (type || '').toLowerCase() === 'alert' ? 'pink' : ((type || '').toLowerCase() === 'event' ? 'purple' : 'blue');
      const modalContent = `
        <div class="modal-overlay active" id="announcementDetailModal" role="dialog" aria-modal="true" style="display: flex;">
          <div class="modal-dialog" style="max-width: 500px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
              <span class="portal-pill-badge ${badgeClass}">${type || 'Announcement'}</span>
              <button onclick="document.getElementById('announcementDetailModal').remove()" class="modal-close">&times;</button>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; line-height: 1.3;">${title}</h3>
            <div style="display: flex; gap: 1rem; font-size: 0.82rem; color: #64748b; margin-bottom: 1.25rem;">
              <span>Dispatched: ${time || 'Today'}</span>
              <span>•</span>
              <span>Audience: <strong>${target || 'All Visitors'}</strong></span>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; color: #334155; line-height: 1.6; font-size: 0.92rem; margin-bottom: 1.5rem;">
              ${text || 'No additional details provided for this bulletin.'}
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <button onclick="document.getElementById('announcementDetailModal').remove(); if(window.showPortalToast) showPortalToast('Advisory acknowledged');" style="flex: 1; padding: 0.75rem; background: #0284c7; color: #ffffff; font-weight: 700; border-radius: 8px; border: none; cursor: pointer;">
                Acknowledge Notice
              </button>
            </div>
          </div>
        </div>
      `;
      if (modal) modal.remove();
      document.body.insertAdjacentHTML('beforeend', modalContent);
    };

    // --- 8. Universal Public Portal Toast Helper ---
    window.showPortalToast = function(message, type = 'success') {
      let toast = document.getElementById('portalToastNotification');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'portalToastNotification';
        toast.className = 'portal-toast';
        document.body.appendChild(toast);
      }
      toast.className = `portal-toast ${type} active`;
      toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${message}</span>
      `;
      clearTimeout(window._portalToastTimer);
      window._portalToastTimer = setTimeout(() => {
        toast.classList.remove('active');
      }, 3500);
    };

    // --- 9. Role-Based Feature Visibility (Hide Admin Features from Public Portal) ---
    function checkAdminFeaturesVisibility() {
      const adminAuth = (window.TourismHubStore && typeof TourismHubStore.getAdminAuth === 'function')
        ? TourismHubStore.getAdminAuth()
        : null;
      const isAdminLoggedIn = !!(adminAuth && adminAuth.roleKey);

      // Toggle all admin-only feature elements across portal subpages
      document.querySelectorAll('.admin-only-feature').forEach(el => {
        el.style.display = isAdminLoggedIn ? '' : 'none';
      });

      // Update header profile widget if logged in as admin
      document.querySelectorAll('.portal-user-profile').forEach(widget => {
        if (isAdminLoggedIn) {
          const nameEl = widget.querySelector('.portal-user-name');
          const roleEl = widget.querySelector('.portal-user-role');
          const imgEl = widget.querySelector('.portal-avatar-img');
          if (nameEl) nameEl.textContent = adminAuth.name || 'Operator';
          if (roleEl) roleEl.textContent = adminAuth.role || 'Admin Clearance';
          if (imgEl && adminAuth.avatar) imgEl.src = adminAuth.avatar;
          widget.onclick = function() { location.href = 'admin.html'; };
          widget.title = 'Switch to Admin Dashboard';
        }
      });
    }

    // Master render caller
    function refreshCurrentPage() {
      checkAdminFeaturesVisibility();
      updateNotifBadges();
      syncAttractionsPage();
      syncCapacityPage();
      syncNotificationsPage();
      syncScannerPage();
    }

    // Initial sync
    refreshCurrentPage();

    // Listen for cross-tab and cross-page real-time sync from admin control
    TourismHubStore.onSync((key) => {
      refreshCurrentPage();
    });
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortalSync);
  } else {
    initPortalSync();
  }
})();
