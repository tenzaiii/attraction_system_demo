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
    const banner = (ev.images && ev.images[0]) || ev.image || (parentAttr && parentAttr.image) || 'assets/no-image.svg';

    // Apply full-page lightly blurred poster background
    const posterBg = document.getElementById('eventDetailsPosterBg');
    if (posterBg) {
      posterBg.style.backgroundImage = `url('${banner.replace(/'/g, "\\'")}')`;
      document.body.classList.add('has-event-poster-bg');
    }
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
          <img src="${banner}" alt="${esc(ev.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/no-image.svg'">
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
                <button type="button" class="btn-outline-sm" style="flex: 1; justify-content: center;" onclick="window.handleAddEventItinerary('${esc(ev.id)}', '${esc(ev.title)}')">+ Add to Itinerary</button>
                <button type="button" class="btn-outline-sm" style="flex: 1; justify-content: center;" onclick="window.handleShareEvent()">Share Event</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Related events (matching events-catalog banner cards)
    const related = events.filter(item => String(item.id) !== String(ev.id)).slice(0, 4);
    const relSec = document.getElementById('relatedEventsSection');
    const relGrid = document.getElementById('relatedEventsGrid');
    if (relSec && relGrid && related.length) {
      relSec.style.display = 'block';
      relGrid.innerHTML = related.map(item => {
        const img = (item.images && item.images[0]) || item.image || 'assets/no-image.svg';
        const itemDate = formatDate(item);
        const itemAdm = item.admission || 'Free Entry';
        const itemVenue = item.attractionTitle || item.location || 'Featured Venue';
        const itemTime = item.operatingHours || 'All Day';
        const itemUrl = `event-details.html?id=${encodeURIComponent(item.id)}`;
        return `
          <article class="event-catalog-banner" onclick="window.location.href='${itemUrl}'" style="cursor: pointer;">
            <img src="${img}" alt="${esc(item.title)}" class="event-catalog-banner-img" onerror="this.src='assets/no-image.svg'">
            <div class="event-catalog-banner-scrim"></div>
            <div class="event-catalog-banner-top">
              <span style="background: rgba(2, 132, 199, 0.92); color: #ffffff; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 999px; backdrop-filter: blur(6px);">${esc(itemDate)}</span>
              <span style="background: rgba(16, 185, 129, 0.92); color: #ffffff; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 999px; backdrop-filter: blur(6px);">${esc(itemAdm)}</span>
            </div>
            <div class="event-catalog-banner-content">
              <div style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.25rem;">${esc(itemVenue)} &bull; ${esc(itemTime)}</div>
              <h3 style="margin: 0 0 0.65rem; font-size: 1.15rem; font-weight: 800; line-height: 1.25; color: #ffffff;">${esc(item.title)}</h3>
              <a href="${itemUrl}" onclick="event.stopPropagation();" class="btn-primary-blue" style="text-decoration: none; font-size: 0.8rem; padding: 0.48rem 0.95rem; border-radius: 999px; display: inline-flex;">
                View Details
              </a>
            </div>
          </article>
        `;
      }).join('');
    }
  }

  let activeEventObj = null;

  function parseEventTiers(admissionStr) {
    const raw = String(admissionStr || 'Free Entry').trim();
    const parts = raw.split('/').map(s => s.trim()).filter(Boolean);
    const tiers = parts.map(part => {
      const m = part.match(/(?:₱|PHP|P)\s*([\d,]+)/i);
      const price = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
      const label = part.replace(/(?:₱|PHP|P)\s*[\d,]+/i, '').replace(/[-—:]+$/, '').trim() || (price > 0 ? 'Standard Ticket' : 'Free Entry');
      return { label, price, display: price > 0 ? `${label} — ₱${price.toLocaleString()}` : `${label} — Free` };
    });
    return tiers.length ? tiers : [{ label: 'Free Entry', price: 0, display: 'Free Entry — Free' }];
  }

  function getActiveUser() {
    if (window.TourismHubStore) {
      const admin = typeof TourismHubStore.getAdminAuth === 'function' ? TourismHubStore.getAdminAuth() : null;
      const client = typeof TourismHubStore.getClientAuth === 'function' ? TourismHubStore.getClientAuth() : null;
      if (admin || client) return admin || client;
    }
    try {
      const raw = localStorage.getItem('tourismhub_temp_admin_auth') || localStorage.getItem('tourismhub_temp_client_auth') || localStorage.getItem('tourismhub_temp_session') || localStorage.getItem('tourismhub_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  window.updateEventBookingTotal = function () {
    const tierEl = document.getElementById('evBookTier');
    const visitorsEl = document.getElementById('evBookVisitors');
    const unitEl = document.getElementById('evBookUnitRate');
    const totalEl = document.getElementById('evBookTotalPrice');
    if (!tierEl || !visitorsEl || !unitEl || !totalEl) return;

    const unitPrice = parseInt(tierEl.value, 10) || 0;
    const qty = Math.max(1, parseInt(visitorsEl.value, 10) || 1);
    const total = unitPrice * qty;

    unitEl.textContent = unitPrice > 0 ? `₱${unitPrice.toLocaleString()}` : 'Free';
    totalEl.textContent = total > 0 ? `₱${total.toLocaleString()}` : 'Free';
  };

  window.closeEventBookingModal = function () {
    const modal = document.getElementById('eventBookingModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  };

  window.handleBookEventPass = function () {
    const user = getActiveUser();
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
      window.location.href = `login.html?redirect=${returnUrl}`;
      return;
    }

    const events = (window.TourismHubStore && typeof TourismHubStore.getEvents === 'function')
      ? TourismHubStore.getEvents()
      : [];
    const reqId = getRequestedEventId();
    activeEventObj = events.find(e => String(e.id) === String(reqId)) || events[0];
    if (!activeEventObj) return;

    const ev = activeEventObj;
    const modal = document.getElementById('eventBookingModal');
    if (!modal) return;

    const banner = (ev.images && ev.images[0]) || ev.image || 'assets/no-image.svg';
    const cap = Number(ev.capacityPerSlot) || 100;
    const booked = Number(ev.bookedCount) || 0;
    const remaining = Math.max(0, cap - booked);
    const fillPct = Math.min(100, Math.round((booked / Math.max(1, cap)) * 100));

    document.getElementById('evBookModalTitle').textContent = `Book Tickets: ${ev.title || 'Event'}`;
    document.getElementById('evBookPoster').src = banner;
    document.getElementById('evBookDesc').textContent = ev.description || 'Reserve your verified digital QR pass for this event.';
    document.getElementById('evBookDateText').textContent = formatDate(ev);
    document.getElementById('evBookTimeText').textContent = ev.operatingHours || 'All Day';
    document.getElementById('evBookLocationText').textContent = ev.location || ev.attractionTitle || 'Manila';
    document.getElementById('evBookSlotsText').textContent = `${remaining} / ${cap} left`;
    document.getElementById('evBookSlotsFill').style.width = `${fillPct}%`;

    const tierEl = document.getElementById('evBookTier');
    const tiers = parseEventTiers(ev.admission);
    tierEl.innerHTML = tiers.map(t => `<option value="${t.price}" data-label="${esc(t.label)}">${esc(t.display)}</option>`).join('');

    const dateEl = document.getElementById('evBookDate');
    dateEl.value = ev.date || ev.eventDate || new Date().toISOString().slice(0, 10);
    document.getElementById('evBookVisitors').value = 1;
    document.getElementById('evBookGuestName').value = user.name || user.fullName || '';

    window.updateEventBookingTotal();
    modal.classList.add('active');
    modal.style.display = 'flex';
  };

  window.submitEventBookingForm = async function (e) {
    e.preventDefault();
    if (!activeEventObj) return;
    const user = getActiveUser();
    const tierEl = document.getElementById('evBookTier');
    const selectedOpt = tierEl && tierEl.options[tierEl.selectedIndex];
    const passType = (selectedOpt && selectedOpt.dataset.label) || 'Event Pass';
    const validDate = document.getElementById('evBookDate').value;
    const partySize = Math.max(1, parseInt(document.getElementById('evBookVisitors').value, 10) || 1);
    const visitorName = document.getElementById('evBookGuestName').value.trim() || (user && user.name) || 'Tourist';

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const passCode = `PASS-${randNum}-EVT`;
    const unitPrice = parseInt(tierEl && tierEl.value, 10) || 0;
    const totalPrice = unitPrice * partySize;

    const passPayload = {
      code: passCode,
      userId: (user && user.id) || null,
      bookedByUserId: (user && user.id) || null,
      bookedByEmail: (user && user.email) || '',
      attractionId: activeEventObj.parentAttractionId || activeEventObj.id,
      attraction: activeEventObj.title || 'Event Pass',
      passType: passType,
      visitorName: visitorName,
      visitorEmail: (user && user.email) || '',
      touristName: visitorName,
      touristEmail: (user && user.email) || '',
      validDate: validDate,
      slot: activeEventObj.operatingHours || 'Event Access',
      partySize: partySize,
      amount: totalPrice > 0 ? `₱${totalPrice.toLocaleString()}.00` : '₱0.00',
      status: 'valid'
    };

    if (window.TourismHubStore && typeof TourismHubStore.addPass === 'function') {
      TourismHubStore.addPass(passPayload);
    }

    window.closeEventBookingModal();
    if (window.TourismHubDialog && typeof TourismHubDialog.alert === 'function') {
      await TourismHubDialog.alert(`Your QR pass for "${activeEventObj.title}" (${partySize} guest${partySize > 1 ? 's' : ''}) has been generated and saved to your Profile!`, { title: 'Pass Confirmed', okText: 'View My Passes' });
      window.location.href = 'profile.html#passes';
    } else {
      window.location.href = 'profile.html#passes';
    }
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
