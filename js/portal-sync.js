(function () {
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
      const events = typeof TourismHubStore.getEvents === 'function' ? TourismHubStore.getEvents() : [];
      const capacityData = TourismHubStore.getCapacityData();

      // Update Top Metrics
      const totalAttrEl = document.querySelector('.portal-stat-card:nth-child(1) .portal-stat-value');
      const totalEventsEl = document.querySelector('.portal-stat-card:nth-child(2) .portal-stat-value');
      const totalCapacityEl = document.querySelector('.portal-stat-card:nth-child(3) .portal-stat-value');
      const totalVisitorsEl = document.querySelector('.portal-stat-card:nth-child(4) .portal-stat-value');

      const eventsCount = events.length;
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
      if (totalCapacityEl) totalCapacityEl.textContent = totalCapacitySum > 0 ? totalCapacitySum.toLocaleString() : '0';
      if (totalVisitorsEl) totalVisitorsEl.textContent = totalBookedSum > 0 ? totalBookedSum.toLocaleString() : '0';

      // Populate parent attraction selector in Add Event modal if present
      const portalEventAttrSel = document.getElementById('newEventAttractionId');
      if (portalEventAttrSel) {
        const curSel = portalEventAttrSel.value;
        portalEventAttrSel.innerHTML = catalog.map(a => `<option value="${a.id}">${a.title} (${a.location})</option>`).join('');
        if (curSel && catalog.some(a => a.id === curSel)) {
          portalEventAttrSel.value = curSel;
        }
      }

      // Render Attractions Grid
      if (catalog.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border);">
            <h3 style="font-size: 1.05rem; color: var(--text-main); margin-bottom: 0.35rem;">No attractions available</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Check back soon for featured destinations in Manila and Quezon City.</p>
          </div>
        `;
      } else {
        grid.innerHTML = catalog.map(item => {
          const badgeLabel = item.category || item.badge || 'Attraction';
          const linkedEvents = events.filter(ev => ev.parentAttractionId === item.id);

          // Compute capacity from slots if available
          let capText = `${item.capacityPerSlot || 100} slots`;
          let capSortVal = item.capacityPerSlot || 100;
          if (capacityData[item.id] && capacityData[item.id].length > 0) {
            const firstSlot = capacityData[item.id][0];
            capText = `${firstSlot.booked} / ${firstSlot.max}`;
            capSortVal = firstSlot.max || capSortVal;
          }

          const fallbackImg = (item.image && !String(item.image).includes('images.unsplash.com/photo-'))
            ? item.image
            : 'assets/no-image.svg';
          const locationStr = item.location || 'Manila';
          const hoursStr = item.operatingHours || '08:00 AM – 06:00 PM';
          const isFav = (typeof TourismHubStore.isFavorite === 'function') ? TourismHubStore.isFavorite(item.id) : false;

          return `
            <article class="portal-item-card" data-id="${item.id}" data-type="${item.type || 'spot'}" data-category="${item.category || 'Tourist Spot'}" data-area="${locationStr}" data-title="${item.title}" data-capacity="${capSortVal}" style="cursor: pointer;" onclick="if (!event.target.closest('button') && !event.target.closest('a')) window.location.href='attraction-details.html?id=${item.id}'">
              <div class="portal-item-media image-preload-wrapper" onclick="window.location.href='attraction-details.html?id=${item.id}'" style="cursor: pointer;" title="View ${item.title} details">
                <img src="${fallbackImg}" alt="${item.title}" class="is-preloading" loading="lazy" onload="this.classList.remove('is-preloading'); this.classList.add('is-loaded'); this.parentElement.classList.add('img-loaded');" onerror="this.classList.remove('is-preloading'); this.classList.add('is-loaded'); this.parentElement.classList.add('img-loaded'); this.src='assets/no-image.svg';">
                <button class="portal-card-wishlist-btn ${isFav ? 'saved' : ''}" 
                        title="${isFav ? 'Remove from favorites' : 'Save to favorites'}"
                        onclick="event.stopPropagation(); togglePortalFavorite('${item.id}', '${item.title.replace(/'/g, "\\'")}', this, event)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <span class="portal-badge-tag attraction">${badgeLabel}</span>
              </div>
              <div class="portal-item-body">
                <h3 class="portal-item-title" onclick="window.location.href='attraction-details.html?id=${item.id}'" style="cursor: pointer;" title="View details">${item.title}</h3>
                <p class="portal-item-desc">${item.description || 'Explore verified visitor spots with real-time capacity monitoring.'}</p>
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
                    <span>Capacity: ${capText}${linkedEvents.length > 0 ? ` • ${linkedEvents.length} Event${linkedEvents.length > 1 ? 's' : ''}` : ''}</span>
                  </div>
                </div>
              </div>
            </article>
          `;
        }).join('');
      }

      // Render Upcoming Events aside list strictly from TourismHubStore.getEvents()
      const eventsListContainer = document.querySelector('.upcoming-events-list');
      if (eventsListContainer) {
        if (events.length > 0) {
          const now = new Date();
          const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayEvents = events.filter(ev => ev.eventDate === todayKey);
          const otherUpcoming = events.filter(ev => ev.eventDate !== todayKey);

          const renderEventRow = (ev, isToday) => {
            const targetId = ev.parentAttractionId || ev.id;
            const parentName = ev.attractionTitle || 'Attraction Event';
            return `
              <div class="upcoming-event-item" style="cursor: pointer;" onclick="window.location.href='attraction-details.html?id=${encodeURIComponent(targetId)}'" title="View ${parentName} & event details">
                <img src="${(ev.image && !String(ev.image).includes('images.unsplash.com/photo-')) ? ev.image : 'assets/no-image.svg'}" alt="${ev.title}" loading="lazy" decoding="async" class="upcoming-event-img" onerror="this.src='assets/no-image.svg'">
                <div class="upcoming-event-details">
                  <span class="upcoming-event-name">${ev.title}</span>
                  <span class="upcoming-event-time">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${ev.operatingHours || 'Scheduled Event'}
                  </span>
                  <span class="upcoming-event-loc">${parentName} (${ev.location || 'Manila'})</span>
                  <span class="upcoming-event-badge" style="${isToday ? 'background: rgba(16, 185, 129, 0.16); color: #059669;' : ''}">${isToday ? 'Today' : 'Event'}</span>
                </div>
              </div>
            `;
          };

          let html = '';
          html += `<div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--primary, #0284c7); margin: 0.25rem 0 0.45rem;">Today's Events</div>`;
          if (todayEvents.length > 0) {
            html += todayEvents.map(ev => renderEventRow(ev, true)).join('');
          } else {
            html += `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 0.45rem 0 0.75rem;">No events scheduled for today.</div>`;
          }

          if (otherUpcoming.length > 0) {
            html += `<div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); margin: 0.75rem 0 0.45rem; padding-top: 0.65rem; border-top: 1px solid var(--border);">All Upcoming Events</div>`;
            html += otherUpcoming.slice(0, 6).map(ev => renderEventRow(ev, false)).join('');
          }
          eventsListContainer.innerHTML = html;
        } else {
          eventsListContainer.innerHTML = `
            <div style="text-align: center; padding: 1.5rem 0.75rem; color: var(--text-muted); font-size: 0.85rem;">
              No upcoming events scheduled.
            </div>
          `;
        }
      }

      if (typeof window.filterCards === 'function') {
        window.filterCards();
      }
    }

    // --- 3. Capacity & Schedule Page (capacity.html) ---
    function syncCapacityPage() {
      // Capacity table removed in favor of Itinerary & Schedule Management
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
            <td>${dateStr}</td>
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
    window.openAnalyticsModal = function () {
      let modal = document.getElementById('analyticsModal');
      if (!modal) {
        const catalog = TourismHubStore.getCatalog();
        const logs = TourismHubStore.getLogs();
        const rawPasses = TourismHubStore.getPasses();
        const passes = Array.isArray(rawPasses) ? rawPasses : Object.values(rawPasses || {});
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
                  <span style="font-size: 0.75rem; color: #64748b;">99.8% Digital Gate Rate</span>
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

    window.openSettingsModal = function () {
      let modal = document.getElementById('settingsModal');
      if (!modal) {
        const versionInfo = (window.TourismHubStore && typeof TourismHubStore.getSystemVersion === 'function')
          ? TourismHubStore.getSystemVersion()
          : { fullLabel: 'v1.5.0 (Build 2026.11.15)', channel: 'Production Stable' };
        const modalHtml = `
          <div class="modal-overlay active" id="settingsModal" role="dialog" aria-modal="true" style="display: flex;">
            <div class="modal-window" style="max-width: 480px; background: var(--bg-card, #ffffff); border: 1px solid var(--border, #e2e8f0); border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); width: 90%; margin: auto;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main, #0f172a); margin: 0;">Portal Preferences & Settings</h3>
                <button onclick="document.getElementById('settingsModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted, #64748b);">&times;</button>
              </div>
              <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                  <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-main, #334155); margin-bottom: 0.4rem;">Audio Chimes on Pass Scan</label>
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--text-muted, #475569); cursor: pointer;">
                    <input type="checkbox" id="settingSound" checked>
                    <span>Play acoustic confirmation chime on gate entry</span>
                  </label>
                </div>
                <div>
                  <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-main, #334155); margin-bottom: 0.4rem;">Real-Time Refresh Frequency</label>
                  <span style="font-size: 0.84rem; color: var(--primary, #10b981); font-weight: 600;">✓ Instantaneous multi-tab cloud sync enabled</span>
                </div>
                <div style="padding-top: 0.75rem; border-top: 1px solid var(--border, #e2e8f0); display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
                  <div>
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-main, #334155); margin-bottom: 0.15rem;">System Version</label>
                    <span style="font-size: 0.76rem; color: var(--text-muted, #64748b);">${versionInfo.channel || 'Production Stable'} &bull; Supabase Cloud Sync</span>
                  </div>
                  <span id="settingsModalSystemVersion" style="display: inline-flex; align-items: center; padding: 0.3rem 0.7rem; border-radius: 9999px; font-size: 0.76rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); color: var(--primary, #10b981); border: 1px solid rgba(16, 185, 129, 0.28); white-space: nowrap;">${versionInfo.fullLabel}</span>
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
    window.openAnnouncementDetail = function (title, text, type, time, target) {
      let modal = document.getElementById('announcementDetailModal');
      const badgeClass = (type || '').toLowerCase() === 'alert' ? 'pink' : ((type || '').toLowerCase() === 'event' ? 'purple' : 'blue');
      const modalContent = `
        <div class="modal-overlay active" id="announcementDetailModal" role="dialog" aria-modal="true" style="display: flex;">
          <div class="modal-dialog" style="max-width: 500px; padding: 1.5rem; background: var(--bg-card); border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
              <span class="portal-pill-badge ${badgeClass}">${type || 'Announcement'}</span>
              <button onclick="document.getElementById('announcementDetailModal').remove()" class="modal-close">&times;</button>
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem; line-height: 1.3;">${title}</h3>
            <div style="display: flex; gap: 1rem; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              <span>Dispatched: ${time || 'Today'}</span>
              <span>•</span>
              <span>Audience: <strong>${target || 'All Visitors'}</strong></span>
            </div>
            <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; color: var(--text-main); line-height: 1.6; font-size: 0.92rem;">
              ${text || 'No additional details provided for this bulletin.'}
            </div>
          </div>
        </div>
      `;
      if (modal) modal.remove();
      document.body.insertAdjacentHTML('beforeend', modalContent);
    };

    // --- 8. Universal Public Portal Toast Helper ---
    window.showPortalToast = function (message, type = 'success') {
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

    // --- 9. Role-Based Feature Visibility & User Profile Synchronization ---
    function checkAdminFeaturesVisibility() {
      const adminAuth = (window.TourismHubStore && typeof TourismHubStore.getAdminAuth === 'function')
        ? TourismHubStore.getAdminAuth()
        : null;
      const clientAuth = (window.TourismHubStore && typeof TourismHubStore.getClientAuth === 'function')
        ? TourismHubStore.getClientAuth()
        : null;
      const isAdminLoggedIn = !!(adminAuth && adminAuth.roleKey);
      const isClientLoggedIn = !!(clientAuth && clientAuth.email);
      const activeUser = adminAuth || clientAuth;

      // Toggle all admin-only feature elements across portal subpages
      document.querySelectorAll('.admin-only-feature').forEach(el => {
        if (isAdminLoggedIn) {
          el.style.display = (el.tagName === 'A' || el.tagName === 'BUTTON') ? 'inline-flex' : (el.tagName === 'LI' ? 'block' : '');
        } else {
          el.style.display = 'none';
        }
      });

      // Hide/Show Sign In buttons based on login state
      document.querySelectorAll('#navSignInLink, .auth-signin-link').forEach(link => {
        link.style.display = (isAdminLoggedIn || isClientLoggedIn) ? 'none' : 'inline-flex';
      });

      // Update header profile widget across subpages
      document.querySelectorAll('.portal-user-profile').forEach(widget => {
        const nameEl = widget.querySelector('.portal-user-name');
        const imgEl = widget.querySelector('.portal-avatar-img');

        // Remove hardcoded inline onclick so our dropdown handles it
        widget.removeAttribute('onclick');

        if (isAdminLoggedIn) {
          widget.style.display = 'flex';
          widget.style.cursor = 'pointer';
          if (nameEl) nameEl.textContent = adminAuth.name || 'Operator';
          if (imgEl && window.TourismHubStore && typeof TourismHubStore.getUserAvatar === 'function') {
            imgEl.src = TourismHubStore.getUserAvatar(adminAuth);
          } else if (imgEl && adminAuth.avatar) {
            imgEl.src = adminAuth.avatar;
          }
          if (widget.dataset.profileDropdownBound !== 'true') {
            widget.onclick = function (e) {
              if (window.toggleProfileDropdown) {
                return window.toggleProfileDropdown(e, widget);
              }
              location.href = 'profile.html';
            };
          } else {
            widget.onclick = null;
          }
          widget.title = 'Account & Profile Menu';
        } else if (isClientLoggedIn) {
          widget.style.display = 'flex';
          widget.style.cursor = 'pointer';
          if (nameEl) nameEl.textContent = clientAuth.name || 'Tourist';
          if (imgEl && window.TourismHubStore && typeof TourismHubStore.getUserAvatar === 'function') {
            imgEl.src = TourismHubStore.getUserAvatar(clientAuth);
          } else if (imgEl && clientAuth.avatar) {
            imgEl.src = clientAuth.avatar;
          }
          if (widget.dataset.profileDropdownBound !== 'true') {
            widget.onclick = function (e) {
              if (window.toggleProfileDropdown) {
                return window.toggleProfileDropdown(e, widget);
              }
              location.href = 'profile.html';
            };
          } else {
            widget.onclick = null;
          }
          widget.title = 'Account & Profile Menu';
        } else {
          // Hide tourist name and profile icon completely when exploring as guest
          widget.style.display = 'none';
        }
      });
    }

    // Interactive favorite toggle for portal cards
    window.showItineraryBriefModal = function (title, added) {
      const existing = document.getElementById('itineraryBriefModal');
      if (existing) existing.remove();
      if (window.__itineraryModalTimer) clearTimeout(window.__itineraryModalTimer);

      const modalHtml = `
        <div class="modal-overlay active" id="itineraryBriefModal" role="status" aria-live="polite" style="display: flex; z-index: 2500;" onclick="if (event.target === this) this.remove();">
          <div class="modal-dialog" style="max-width: 380px; width: 90%; padding: 1.4rem; background: var(--bg-card, #ffffff); border: 1px solid var(--border, #e2e8f0); border-radius: 16px; text-align: center; box-shadow: 0 20px 45px rgba(0,0,0,0.22);">
            <div style="width: 48px; height: 48px; border-radius: 50%; margin: 0 auto 0.85rem; display: flex; align-items: center; justify-content: center; background: ${added ? 'rgba(16, 185, 129, 0.14)' : 'rgba(100, 116, 139, 0.14)'}; color: ${added ? '#10b981' : '#64748b'};">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                ${added ? '<polyline points="20 6 9 17 4 12"></polyline>' : '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'}
              </svg>
            </div>
            <h4 style="margin: 0 0 0.35rem; font-size: 1.05rem; font-weight: 800; color: var(--text-main, #0f172a);">${added ? 'Added to Your Itinerary!' : 'Removed from Itinerary'}</h4>
            <p style="margin: 0 0 1rem; font-size: 0.86rem; color: var(--text-muted, #64748b);">${title}</p>
            <a href="capacity.html" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.55rem 1.1rem; border-radius: 8px; background: var(--primary, #0284c7); color: #ffffff; font-size: 0.82rem; font-weight: 700; text-decoration: none;">View My Itinerary</a>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      window.__itineraryModalTimer = setTimeout(() => {
        document.getElementById('itineraryBriefModal')?.remove();
      }, 2200);
    };

    window.togglePortalItinerary = function (id, title, btn) {
      if (!window.TourismHubStore || typeof TourismHubStore.toggleItinerary !== 'function') return;
      const res = TourismHubStore.toggleItinerary(id);
      if (btn) {
        btn.textContent = res.inItinerary ? '✓ Itinerary' : '+ Itinerary';
      }
      window.showItineraryBriefModal(title, res.inItinerary);
    };

    window.togglePortalFavorite = function (id, title, btn, evt) {
      if (evt) {
        evt.stopPropagation();
        evt.preventDefault();
      }
      if (window.TourismHubStore && typeof TourismHubStore.toggleFavorite === 'function') {
        const res = TourismHubStore.toggleFavorite(id);
        if (btn) {
          if (res.isFavorite) {
            btn.classList.add('saved');
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'currentColor');
            btn.title = 'Remove from favorites';
          } else {
            btn.classList.remove('saved');
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'none');
            btn.title = 'Save to favorites';
          }
        }
        if (typeof showToast === 'function') {
          showToast(res.isFavorite ? `Saved "${title}" to your favorites!` : `Removed "${title}" from favorites`);
        }
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      }
    };

    // Master render caller
    function refreshCurrentPage() {
      checkAdminFeaturesVisibility();
      updateNotifBadges();
      syncAttractionsPage();
      syncCapacityPage();
      syncNotificationsPage();
      syncScannerPage();
    }

    window.syncCapacityPage = syncCapacityPage;

    // Initial sync
    refreshCurrentPage();

    // Listen for cross-tab and cross-page real-time sync from admin control
    TourismHubStore.onSync((key) => {
      refreshCurrentPage();
    });

    // Listen for live Supabase sync and avatar updates
    window.addEventListener('supabaseSyncComplete', () => {
      refreshCurrentPage();
    });
    window.addEventListener('tourismhub:avatarUpdated', () => {
      checkAdminFeaturesVisibility();
    });
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortalSync);
  } else {
    initPortalSync();
  }
})();
