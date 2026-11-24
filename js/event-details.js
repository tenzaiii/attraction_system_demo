(function () {
  function esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function getRequestedEventId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || '';
  }

  function formatDate(ev) {
    if (ev.date) {
      const d = new Date(ev.date + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      return ev.date;
    }
    return 'Scheduled Event';
  }

  function renderEventDetails() {
    const container = document.getElementById('eventDetailContainer');
    if (!container) return;

    const events = (window.TourismHubStore && typeof TourismHubStore.getEvents === 'function')
      ? TourismHubStore.getEvents()
      : [];
    const catalog = (window.TourismHubStore && typeof TourismHubStore.getCatalog === 'function')
      ? TourismHubStore.getCatalog()
      : [];

    const reqId = getRequestedEventId();
    const ev = events.find(e => String(e.id) === String(reqId)) || events[0];

    if (!ev) {
      container.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 2.5rem; text-align: center;">
          <h2 style="margin: 0 0 0.5rem; color: var(--text-main);">Event Not Found</h2>
          <p style="margin: 0 0 1.25rem; color: var(--text-muted);">The event you're looking for may have ended or been removed.</p>
          <a href="events-catalog.html" class="btn-primary-blue" style="text-decoration: none;">Browse All Events</a>
        </div>
      `;
      return;
    }

    document.title = `${ev.title || 'Event Details'} — TourismHub Portal`;

    const parentAttr = catalog.find(a => a.id === ev.parentAttractionId) || null;
    const banner = (ev.images && ev.images[0]) || ev.image || (parentAttr && parentAttr.image) || 'images/hero_bg.png';
    const venueName = ev.attractionTitle || (parentAttr && (parentAttr.title || parentAttr.name)) || ev.location || 'Featured Venue';
    const locationStr = ev.location || (parentAttr && parentAttr.location) || 'Philippines';
    const admission = ev.admission || 'Free Entry';
    const cap = Number(ev.capacityPerSlot) || 100;
    const booked = Number(ev.bookedCount) || 0;
    const remaining = Math.max(0, cap - booked);
    const fillPct = Math.min(100, Math.round((booked / Math.max(1, cap)) * 100));
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName + ' ' + locationStr)}`;

    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; overflow: hidden;">
        <div style="position: relative; height: 320px; background: #0f172a;">
          <img src="${banner}" alt="${esc(ev.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/hero_bg.png'">
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.82), rgba(15,23,42,0.12));"></div>
          <div style="position: absolute; bottom: 1.5rem; left: 1.5rem; right: 1.5rem; color: #ffffff;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
              <span style="background: #0284c7; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.7rem; border-radius: 999px;">${esc(formatDate(ev))}</span>
              <span style="background: #10b981; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.7rem; border-radius: 999px;">${esc(admission)}</span>
            </div>
            <h1 style="margin: 0; font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; line-height: 1.2;">${esc(ev.title)}</h1>
            <p style="margin: 0.35rem 0 0; font-size: 0.9rem; opacity: 0.92;">${esc(venueName)} &bull; ${esc(ev.operatingHours || 'All Day')}</p>
          </div>
        </div>

        <div style="padding: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          <div>
            <h2 style="margin: 0 0 0.6rem; font-size: 1.05rem; font-weight: 800; color: var(--text-main);">About This Event</h2>
            <p style="margin: 0 0 1.25rem; font-size: 0.92rem; line-height: 1.6; color: var(--text-muted);">
              ${esc(ev.description || 'Experience this scheduled event with live visitor capacity tracking and digital QR pass access.')}
            </p>

            <div style="background: var(--bg-page); border: 1px solid var(--border); border-radius: 12px; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem;">
                <span>Live Slot Availability</span>
                <span>${remaining} of ${cap} slots available</span>
              </div>
              <div style="height: 8px; background: var(--border); border-radius: 999px; overflow: hidden;">
                <div style="height: 100%; width: ${fillPct}%; background: #0284c7; border-radius: 999px;"></div>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="background: var(--bg-page); border: 1px solid var(--border); border-radius: 12px; padding: 1rem;">
              <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">Host Venue</div>
              <div style="font-size: 1rem; font-weight: 800; color: var(--text-main);">${esc(venueName)}</div>
              <div style="font-size: 0.84rem; color: var(--text-muted); margin: 0.2rem 0 0.85rem;">${esc(locationStr)}</div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${parentAttr ? `<a href="attraction-details.html?id=${encodeURIComponent(parentAttr.id)}" class="btn-outline-sm" style="text-decoration: none;">View Venue Details</a>` : ''}
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline-sm" style="text-decoration: none;">Get Directions &nearr;</a>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.6rem;">
              <button type="button" class="btn-primary-blue" style="width: 100%; justify-content: center;" onclick="window.handleBookEventPass('${esc(ev.parentAttractionId || ev.id)}')">
                Book Event Pass
              </button>
              <div style="display: flex; gap: 0.6rem;">
                ${ev.parentAttractionId ? `<button type="button" class="btn-outline-sm" style="flex: 1; justify-content: center;" onclick="window.handleAddEventItinerary('${esc(ev.parentAttractionId)}', '${esc(ev.title)}')">+ Add to Itinerary</button>` : ''}
                <button type="button" class="btn-outline-sm" style="flex: 1; justify-content: center;" onclick="window.handleShareEvent()">Share Event</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Related events
    const related = events.filter(item => String(item.id) !== String(ev.id)).slice(0, 3);
    const relSec = document.getElementById('relatedEventsSection');
    const relGrid = document.getElementById('relatedEventsGrid');
    if (relSec && relGrid && related.length) {
      relSec.style.display = 'block';
      relGrid.innerHTML = related.map(item => {
        const img = (item.images && item.images[0]) || item.image || 'images/hero_bg.png';
        return `
          <article class="attraction-card">
            <a href="event-details.html?id=${encodeURIComponent(item.id)}" style="text-decoration: none; color: inherit;">
              <div class="card-image-wrap">
                <img src="${img}" alt="${esc(item.title)}" class="card-img" onerror="this.src='images/hero_bg.png'">
                <span class="card-badge">${esc(item.date || item.operatingHours || 'Event')}</span>
              </div>
              <div class="card-body">
                <h3 class="card-title">${esc(item.title)}</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.25rem 0 0;">${esc(item.attractionTitle || item.location || 'Featured Venue')}</p>
              </div>
            </a>
          </article>
        `;
      }).join('');
    }
  }

  window.handleBookEventPass = function (targetAttractionId) {
    const isLoggedIn = Boolean(localStorage.getItem('tourismhub_temp_session') || localStorage.getItem('tourismhub_user'));
    if (!isLoggedIn) {
      const returnUrl = encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
      window.location.href = `login.html?redirect=${returnUrl}`;
      return;
    }
    window.location.href = `attraction-details.html?id=${encodeURIComponent(targetAttractionId)}`;
  };

  window.handleAddEventItinerary = function (attractionId, title) {
    if (window.TourismHubStore && typeof TourismHubStore.addToItinerary === 'function') {
      TourismHubStore.addToItinerary(attractionId);
      if (window.showPortalToast) {
        showPortalToast(`Added "${title}" host venue to My Itinerary!`);
      }
    }
  };

  window.handleShareEvent = function () {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (window.showPortalToast) showPortalToast('Event link copied to clipboard!');
      }).catch(() => {});
    }
  };

  function init() {
    renderEventDetails();
    if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
      TourismHubStore.onSync(renderEventDetails);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
