(function () {
  let activeFilter = 'all';
  let activeSort = 'soonest';
  let searchQuery = '';

  function esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function getAllEvents() {
    if (window.TourismHubStore && typeof TourismHubStore.getEvents === 'function') {
      return TourismHubStore.getEvents();
    }
    return [];
  }

  function formatEventDate(ev) {
    if (ev.date) {
      const d = new Date(ev.date + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return ev.date;
    }
    return ev.operatingHours || 'Scheduled Event';
  }

  function filterAndSortEvents(events) {
    const q = searchQuery.trim().toLowerCase();
    const todayIso = new Date().toISOString().slice(0, 10);

    let list = events.filter(ev => {
      if (q) {
        const hay = `${ev.title || ''} ${ev.attractionTitle || ''} ${ev.location || ''} ${ev.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeFilter === 'free') {
        const adm = String(ev.admission || 'Free').toLowerCase();
        if (!adm.includes('free') && adm !== '0' && adm !== '₱0') return false;
      } else if (activeFilter === 'upcoming') {
        if (ev.date && ev.date < todayIso) return false;
      }
      return true;
    });

    if (activeSort === 'soonest') {
      list.sort((a, b) => String(a.date || '9999-99-99').localeCompare(String(b.date || '9999-99-99')));
    } else if (activeSort === 'capacity') {
      list.sort((a, b) => (Number(b.capacityPerSlot) || 0) - (Number(a.capacityPerSlot) || 0));
    } else {
      list.reverse();
    }
    return list;
  }

  function renderEventsCatalog() {
    const grid = document.getElementById('eventsCatalogGrid');
    const countEl = document.getElementById('eventsCatalogCount');
    if (!grid) return;

    const events = filterAndSortEvents(getAllEvents());
    if (countEl) {
      countEl.textContent = `Showing ${events.length} event${events.length === 1 ? '' : 's'}`;
    }

    if (!events.length) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;">
          <h3 style="margin: 0 0 0.5rem; color: var(--text-main);">No events found</h3>
          <p style="margin: 0 0 1rem; color: var(--text-muted); font-size: 0.9rem;">Try adjusting your search or filter criteria.</p>
          <button type="button" class="btn-outline-sm" onclick="window.resetEventsCatalogFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = events.map(ev => {
      const thumb = (ev.images && ev.images[0]) || ev.image || 'images/hero_bg.png';
      const dateStr = formatEventDate(ev);
      const timeStr = ev.operatingHours || 'All Day';
      const venue = ev.attractionTitle || ev.location || 'Featured Venue';
      const admission = ev.admission || 'Free Entry';
      const cap = Number(ev.capacityPerSlot) || 100;
      const booked = Number(ev.bookedCount) || 0;
      const fillPct = Math.min(100, Math.round((booked / Math.max(1, cap)) * 100));

      return `
        <article class="attraction-card" style="display: flex; flex-direction: column;">
          <a href="event-details.html?id=${encodeURIComponent(ev.id)}" style="text-decoration: none; color: inherit; display: block;">
            <div class="card-image-wrap">
              <img src="${thumb}" alt="${esc(ev.title)}" class="card-img" onerror="this.src='images/hero_bg.png'">
              <span class="card-badge">${esc(dateStr)}</span>
            </div>
          </a>
          <div class="card-body" style="display: flex; flex-direction: column; flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary, #0284c7);">${esc(venue)}</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #10b981;">${esc(admission)}</span>
            </div>
            <h3 class="card-title" style="margin-bottom: 0.35rem;">
              <a href="event-details.html?id=${encodeURIComponent(ev.id)}" style="text-decoration: none; color: inherit;">${esc(ev.title)}</a>
            </h3>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 0.75rem; line-height: 1.45; flex: 1;">
              ${esc((ev.description || 'Join this special scheduled tourism event.').slice(0, 110))}${(ev.description || '').length > 110 ? '...' : ''}
            </p>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.6rem;">
              <strong>Schedule:</strong> ${esc(timeStr)}
            </div>
            <div style="margin-bottom: 0.85rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: var(--text-muted); margin-bottom: 0.25rem;">
                <span>Capacity</span>
                <span>${Math.max(0, cap - booked)} / ${cap} slots left</span>
              </div>
              <div style="height: 6px; background: var(--border); border-radius: 999px; overflow: hidden;">
                <div style="height: 100%; width: ${fillPct}%; background: #0284c7; border-radius: 999px;"></div>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <a href="event-details.html?id=${encodeURIComponent(ev.id)}" class="btn-primary-blue" style="flex: 1; justify-content: center; text-decoration: none; font-size: 0.82rem; padding: 0.55rem 0.75rem;">
                View Details
              </a>
              ${ev.parentAttractionId ? `<button type="button" class="btn-outline-sm" onclick="window.addEventVenueToItinerary('${esc(ev.parentAttractionId)}', '${esc(ev.title)}')" title="Add host venue to My Itinerary">+ Itinerary</button>` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function initEventsSearchInput() {
    const input = document.getElementById('eventsSearchInput');
    if (!input) return;
    input.addEventListener('input', () => {
      searchQuery = input.value;
      renderEventsCatalog();
    });
  }

  window.resetEventsCatalogFilters = function () {
    activeFilter = 'all';
    activeSort = 'soonest';
    searchQuery = '';
    const input = document.getElementById('eventsSearchInput');
    if (input) input.value = '';
    const sortEl = document.getElementById('eventsSortSelect');
    if (sortEl) sortEl.value = 'soonest';
    document.querySelectorAll('#eventsFilterTabs .portal-filter-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.eventFilter === 'all');
    });
    renderEventsCatalog();
  };

  window.addEventVenueToItinerary = function (attractionId, eventTitle) {
    if (window.TourismHubStore && typeof TourismHubStore.addToItinerary === 'function') {
      TourismHubStore.addToItinerary(attractionId);
      if (window.showPortalToast) {
        showPortalToast(`Added "${eventTitle}" venue to My Itinerary!`);
      }
    }
  };

  function init() {
    document.querySelectorAll('#eventsFilterTabs .portal-filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#eventsFilterTabs .portal-filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.eventFilter || 'all';
        renderEventsCatalog();
      });
    });

    const sortEl = document.getElementById('eventsSortSelect');
    if (sortEl) {
      sortEl.addEventListener('change', () => {
        activeSort = sortEl.value;
        renderEventsCatalog();
      });
    }

    initEventsSearchInput();
    renderEventsCatalog();

    if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
      TourismHubStore.onSync(renderEventsCatalog);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
