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
      const thumb = (ev.images && ev.images[0]) || ev.image || 'assets/no-image.svg';
      const dateStr = formatEventDate(ev);
      const timeStr = ev.operatingHours || 'All Day';
      const venue = ev.attractionTitle || ev.location || 'Featured Venue';
      const admission = ev.admission || 'Free Entry';
      const cap = Number(ev.capacityPerSlot) || 100;
      const booked = Number(ev.bookedCount) || 0;
      const fillPct = Math.min(100, Math.round((booked / Math.max(1, cap)) * 100));

      const evUrl = `event-details.html?id=${encodeURIComponent(ev.id)}`;
      return `
        <article class="event-catalog-banner" onclick="window.location.href='${evUrl}'" style="cursor: pointer;">
          <img src="${thumb}" alt="${esc(ev.title)}" class="event-catalog-banner-img" onerror="this.src='assets/no-image.svg'">
          <div class="event-catalog-banner-scrim"></div>
          <div class="event-catalog-banner-top">
            <span style="background: rgba(2, 132, 199, 0.92); color: #ffffff; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 999px; backdrop-filter: blur(6px);">${esc(dateStr)}</span>
            <span style="background: rgba(16, 185, 129, 0.92); color: #ffffff; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 999px; backdrop-filter: blur(6px);">${esc(admission)}</span>
          </div>
          <div class="event-catalog-banner-content">
            <div style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.25rem;">${esc(venue)} &bull; ${esc(timeStr)}</div>
            <h3 style="margin: 0 0 0.35rem; font-size: 1.2rem; font-weight: 800; line-height: 1.25; color: #ffffff;">${esc(ev.title)}</h3>
            <p style="margin: 0 0 0.85rem; font-size: 0.82rem; color: rgba(255, 255, 255, 0.86); line-height: 1.45;">
              ${esc((ev.description || 'Join this special scheduled tourism event.').slice(0, 105))}${(ev.description || '').length > 105 ? '...' : ''}
            </p>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <a href="${evUrl}" onclick="event.stopPropagation();" class="btn-primary-blue" style="text-decoration: none; font-size: 0.8rem; padding: 0.5rem 1rem; border-radius: 999px;">
                View Details
              </a>
              <button type="button" onclick="event.stopPropagation(); window.addEventVenueToItinerary('${esc(ev.id)}', '${esc(ev.title)}')" style="padding: 0.5rem 0.9rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.35); background: rgba(15,23,42,0.55); color: #ffffff; font-size: 0.8rem; font-weight: 700; cursor: pointer; backdrop-filter: blur(6px);">+ Itinerary</button>
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
