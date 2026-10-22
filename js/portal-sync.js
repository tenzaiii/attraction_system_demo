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
              <button class="action-arrow-btn" style="margin-left: auto;" onclick="alert('Notification Details:\\n\\n${ann.title}\\n${ann.text || ''}\\nTarget: ${ann.target || 'All Visitors'}')">
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

    // Master render caller
    function refreshCurrentPage() {
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
