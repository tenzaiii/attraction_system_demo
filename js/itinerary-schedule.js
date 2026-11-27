// Search, Filter & Sort Controls for Capacity Table
const searchInput = document.getElementById('capacitySearchInput');
const filterTabs = document.querySelectorAll('.portal-filter-tab');
const sortSelect = document.getElementById('capacitySortSelect');

// =========================================================================
// Embedded Interactive Monthly Calendar & Selected Day Upcoming Events
// =========================================================================
let pageCalViewDate = new Date();
let pageSelectedDateKey = (window.TourismHubStore && typeof TourismHubStore.formatLocalDateKey === 'function')
  ? TourismHubStore.formatLocalDateKey(new Date())
  : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
let pageCalShowAll = false;

function escapeCalHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function getIndexedEventsByDate() {
  const map = new Map();
  const allEvents = (window.TourismHubStore && typeof TourismHubStore.getEvents === 'function')
    ? TourismHubStore.getEvents()
    : [];
  allEvents.forEach(ev => {
    const key = (window.TourismHubStore && typeof TourismHubStore.extractEventDateKey === 'function')
      ? TourismHubStore.extractEventDateKey(ev)
      : (ev.eventDate || '');
    if (key) {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
  });
  return { map, allEvents };
}

function renderEmbeddedEventsCalendar() {
  const daysGrid = document.getElementById('pageCalDaysGrid');
  const monthTitleEl = document.getElementById('pageCalMonthTitle');
  const selectedTitleEl = document.getElementById('pageCalSelectedDateTitle');
  const countBadgeEl = document.getElementById('pageCalEventsCountBadge');
  const eventsListEl = document.getElementById('pageCalEventsList');
  const showAllBtn = document.getElementById('pageCalAllEventsBtn');
  if (!daysGrid || !monthTitleEl || !eventsListEl) return;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const year = pageCalViewDate.getFullYear();
  const month = pageCalViewDate.getMonth();
  monthTitleEl.textContent = `${monthNames[month]} ${year}`;

  if (showAllBtn) {
    showAllBtn.classList.toggle('active', pageCalShowAll);
  }

  const { map: eventsByDate, allEvents } = getIndexedEventsByDate();
  const todayKey = (window.TourismHubStore && typeof TourismHubStore.formatLocalDateKey === 'function')
    ? TourismHubStore.formatLocalDateKey(new Date())
    : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  let gridHtml = '';
  for (let i = firstDay - 1; i >= 0; i--) {
    gridHtml += `<span class="calendar-day-cell muted">${daysInPrevMonth - i}</span>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cellKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = eventsByDate.get(cellKey) || [];
    const isToday = cellKey === todayKey;
    const isSelected = !pageCalShowAll && cellKey === pageSelectedDateKey;
    const cls = [
      'calendar-day-cell',
      isToday ? 'today' : '',
      isSelected ? 'selected' : '',
      dayEvents.length > 0 ? 'has-events' : ''
    ].filter(Boolean).join(' ');
    const dotHtml = dayEvents.length > 0
      ? `<span class="cal-event-dot" title="${dayEvents.length} upcoming event${dayEvents.length > 1 ? 's' : ''}"></span>`
      : '';

    gridHtml += `<button type="button" class="${cls}" data-date="${cellKey}" aria-label="${cellKey} (${dayEvents.length} events)">
          <span>${d}</span>${dotHtml}
        </button>`;
  }

  const totalCells = firstDay + daysInMonth;
  const trailingDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let j = 1; j <= trailingDays; j++) {
    gridHtml += `<span class="calendar-day-cell muted">${j}</span>`;
  }

  daysGrid.innerHTML = gridHtml;
  daysGrid.querySelectorAll('.calendar-day-cell[data-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pickedKey = btn.getAttribute('data-date');
      pageSelectedDateKey = pickedKey;
      pageCalShowAll = false;
      function renderCapacityItineraryTracker() {
        const listEl = document.getElementById('capacityItineraryList');
        if (!listEl || !window.TourismHubStore) return;
        const itinIds = (typeof TourismHubStore.getItinerary === 'function') ? TourismHubStore.getItinerary() : [];
        if (itinIds.length === 0) {
          listEl.innerHTML = '<div class="schedule-day-empty" style="padding: 1.25rem;"><p style="margin: 0;">Your itinerary is empty. Browse attractions and click <strong>+ Itinerary</strong> to plan your trip.</p></div>';
          return;
        }
        const catalog = (typeof TourismHubStore.getCatalog === 'function') ? TourismHubStore.getCatalog() : [];
        listEl.innerHTML = itinIds.map((id, idx) => {
          const item = catalog.find(a => a.id === id);
          if (!item) return '';
          const img = item.image || 'assets/no-image.svg';
          return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.85rem; padding: 0.75rem 0.9rem; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card); flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 200px;">
              <span style="width: 26px; height: 26px; border-radius: 50%; background: var(--primary, #0284c7); color: #fff; font-size: 0.78rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${idx + 1}</span>
              <img src="${img}" alt="${item.title}" onerror="this.src='assets/no-image.svg'" style="width: 52px; height: 40px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
              <div>
                <a href="attraction-details.html?id=${item.id}" style="font-weight: 700; color: var(--text-main); text-decoration: none; font-size: 0.92rem;">${item.title}</a>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${item.location || 'Manila'} &bull; ${item.operatingHours || 'Open Daily'}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <button type="button" class="btn-outline-sm" onclick="TourismHubStore.moveItineraryItem('${item.id}', 'up'); renderCapacityItineraryTracker();" ${idx === 0 ? 'disabled' : ''} title="Move Up">&uarr;</button>
              <button type="button" class="btn-outline-sm" onclick="TourismHubStore.moveItineraryItem('${item.id}', 'down'); renderCapacityItineraryTracker();" ${idx === itinIds.length - 1 ? 'disabled' : ''} title="Move Down">&darr;</button>
              <button type="button" class="btn-outline-sm" onclick="TourismHubStore.removeFromItinerary('${item.id}'); renderCapacityItineraryTracker();" style="color: #ef4444;" title="Remove">&times;</button>
            </div>
          </div>
        `;
        }).join('');
      }
      window.renderCapacityItineraryTracker = renderCapacityItineraryTracker;
      renderCapacityItineraryTracker();
      renderEmbeddedEventsCalendar();
    });
  });

  let displayEvents = [];
  let headingText = 'All Upcoming Events';
  if (pageCalShowAll) {
    displayEvents = allEvents;
  } else {
    displayEvents = eventsByDate.get(pageSelectedDateKey) || [];
    if (/^\d{4}-\d{2}-\d{2}$/.test(pageSelectedDateKey)) {
      const [sy, sm, sd] = pageSelectedDateKey.split('-').map(Number);
      headingText = new Date(sy, sm - 1, sd).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
    } else {
      headingText = pageSelectedDateKey;
    }
  }

  if (selectedTitleEl) selectedTitleEl.textContent = headingText;
  if (countBadgeEl) {
    countBadgeEl.textContent = `${allEvents.length} Total`;
  }

  const renderCalEventCard = (ev) => {
    const targetId = ev.parentAttractionId || ev.id;
    const venueName = ev.attractionTitle || ev.category || 'Metro Manila Attraction';
    const thumb = (Array.isArray(ev.images) && ev.images[0]) || ev.image || 'assets/no-image.svg';
    const safeThumb = String(thumb).includes('images.unsplash.com/photo-') ? 'assets/no-image.svg' : thumb;
    return `
          <article class="schedule-event-item" style="cursor: pointer;" onclick="if (!event.target.closest('a')) window.location.href='attraction-details.html?id=${encodeURIComponent(targetId)}'">
            <img src="${escapeCalHtml(safeThumb)}" alt="${escapeCalHtml(ev.title)}" class="schedule-event-thumb" onerror="this.src='assets/no-image.svg'">
            <div class="schedule-event-main">
              <div class="schedule-event-top">
                <span class="schedule-event-venue">${escapeCalHtml(venueName)}</span>
                <span class="schedule-event-fee">${escapeCalHtml(ev.admission || 'Free')}</span>
              </div>
              <h5>${escapeCalHtml(ev.title)}</h5>
              <p class="schedule-event-meta">${escapeCalHtml(ev.operatingHours || 'TBA')} · ${Number(ev.capacityPerSlot || 100)} slots</p>
            </div>
            <div class="schedule-event-actions">
              <a href="attraction-details.html?id=${encodeURIComponent(targetId)}" class="btn-outline-sm" style="text-decoration: none;">Details</a>
            </div>
          </article>
        `;
  };

  const selectedDayEvents = eventsByDate.get(pageSelectedDateKey) || [];
  let combinedHtml = `<div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--primary, #0284c7); margin-bottom: 0.4rem;">Events for ${escapeCalHtml(headingText)}</div>`;
  if (selectedDayEvents.length > 0) {
    combinedHtml += selectedDayEvents.map(renderCalEventCard).join('');
  } else {
    combinedHtml += `<div class="schedule-day-empty" style="padding: 0.85rem; margin-bottom: 0.75rem;"><p style="margin: 0;">No events scheduled for <strong>${escapeCalHtml(headingText)}</strong>.</p></div>`;
  }

  combinedHtml += `<div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); margin: 0.9rem 0 0.45rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">All Upcoming Events (${allEvents.length})</div>`;
  if (allEvents.length > 0) {
    combinedHtml += allEvents.map(renderCalEventCard).join('');
  } else {
    combinedHtml += `<div class="schedule-day-empty" style="padding: 0.85rem;"><p style="margin: 0;">No upcoming events scheduled.</p></div>`;
  }
  eventsListEl.innerHTML = combinedHtml;
}

document.getElementById('pageCalPrevBtn')?.addEventListener('click', () => {
  pageCalViewDate = new Date(pageCalViewDate.getFullYear(), pageCalViewDate.getMonth() - 1, 1);
  renderEmbeddedEventsCalendar();
});
document.getElementById('pageCalNextBtn')?.addEventListener('click', () => {
  pageCalViewDate = new Date(pageCalViewDate.getFullYear(), pageCalViewDate.getMonth() + 1, 1);
  renderEmbeddedEventsCalendar();
});
document.getElementById('pageCalTodayBtn')?.addEventListener('click', () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  pageCalShowAll = false;
  pageCalViewDate = new Date(now.getFullYear(), now.getMonth(), 1);
  pageSelectedDateKey = (window.TourismHubStore && typeof TourismHubStore.formatLocalDateKey === 'function')
    ? TourismHubStore.formatLocalDateKey(now)
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  renderEmbeddedEventsCalendar();
});
document.getElementById('pageCalAllEventsBtn')?.addEventListener('click', () => {
  pageCalShowAll = !pageCalShowAll;
  renderEmbeddedEventsCalendar();
});
renderEmbeddedEventsCalendar();
if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
  TourismHubStore.onSync(() => renderEmbeddedEventsCalendar());
}
let draggedItineraryIdx = null;

function resolveItineraryStop(id, catalog, events) {
  const attr = catalog.find(a => a.id === id);
  if (attr) {
    return {
      id: attr.id,
      title: attr.title || attr.name || 'Attraction',
      mapTarget: attr.title || attr.name || 'Manila',
      location: attr.location || 'Manila',
      image: (attr.images && attr.images[0]) || attr.image || 'assets/no-image.svg',
      isEvent: false
    };
  }
  const ev = events.find(e => e.id === id);
  if (ev) {
    const parentAttr = ev.parentAttractionId ? catalog.find(a => a.id === ev.parentAttractionId) : null;
    const venueName = (parentAttr && (parentAttr.title || parentAttr.name)) || ev.attractionTitle || ev.location || 'Manila';
    const loc = (parentAttr && parentAttr.location) || ev.location || 'Manila';
    return {
      id: ev.id,
      title: ev.title || 'Event',
      mapTarget: venueName,
      location: `${venueName} • ${loc}`,
      mapLocation: loc,
      image: (ev.images && ev.images[0]) || ev.image || (parentAttr && parentAttr.image) || 'assets/no-image.svg',
      isEvent: true
    };
  }
  return null;
}

window.openItineraryGoogleMaps = function () {
  if (!window.TourismHubStore) return;
  const itinIds = TourismHubStore.getItinerary ? TourismHubStore.getItinerary() : [];
  const catalog = TourismHubStore.getCatalog ? TourismHubStore.getCatalog() : [];
  const events = TourismHubStore.getEvents ? TourismHubStore.getEvents() : [];
  const stops = itinIds.map(id => resolveItineraryStop(id, catalog, events)).filter(Boolean);
  if (stops.length === 0) return;
  const waypoints = stops.map(s => encodeURIComponent(`${s.mapTarget}, ${s.mapLocation || s.location || 'Manila'}, Philippines`));
  const url = `https://www.google.com/maps/dir/${waypoints.join('/')}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

window.confirmClearItinerary = async function () {
  if (!window.TourismHubStore || typeof TourismHubStore.clearItinerary !== 'function') return;
  if (!(await TourismHubDialog.confirm('Clear all stops from your itinerary?', { title: 'Clear Itinerary', confirmText: 'Clear All', danger: true }))) return;
  TourismHubStore.clearItinerary();
  renderCapacityItineraryTracker();
};

function renderCapacityItineraryTracker() {
  const listEl = document.getElementById('capacityItineraryList');
  if (!listEl || !window.TourismHubStore) return;
  const itinIds = (typeof TourismHubStore.getItinerary === 'function') ? TourismHubStore.getItinerary() : [];
  const visitedIds = (typeof TourismHubStore.getVisitedItinerary === 'function') ? TourismHubStore.getVisitedItinerary() : [];
  const mapsBtn = document.getElementById('btnOpenMapsRoute');
  const clearBtn = document.getElementById('btnClearItinerary');
  const progWrap = document.getElementById('itineraryProgressWrap');
  const progLabel = document.getElementById('itineraryProgressLabel');
  const progFill = document.getElementById('itineraryProgressFill');

  const mapWrap = document.getElementById('itineraryRouteMapWrap');
  const mapIframe = document.getElementById('itineraryRouteMapIframe');

  if (itinIds.length === 0) {
    if (mapsBtn) mapsBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    if (progWrap) progWrap.style.display = 'none';
    if (mapWrap) mapWrap.style.display = 'none';
    listEl.style.gridColumn = '1 / -1';
    listEl.innerHTML = '<div class="schedule-day-empty" style="padding: 1.75rem; width: 100%;"><p style="margin: 0;">Your itinerary is empty. Browse attractions and click <strong>Add to Itinerary</strong> to plan your trip.</p></div>';
    return;
  }

  listEl.style.gridColumn = '';

  if (mapsBtn) mapsBtn.style.display = 'inline-flex';
  if (clearBtn) clearBtn.style.display = 'inline-flex';
  if (progWrap) progWrap.style.display = 'block';

  const visitedCount = itinIds.filter(id => visitedIds.includes(id)).length;
  const pct = Math.round((visitedCount / itinIds.length) * 100);
  if (progLabel) progLabel.textContent = `${visitedCount} of ${itinIds.length} stops visited (${pct}%)`;
  if (progFill) progFill.style.width = `${pct}%`;

  const catalog = (typeof TourismHubStore.getCatalog === 'function') ? TourismHubStore.getCatalog() : [];
  const events = (typeof TourismHubStore.getEvents === 'function') ? TourismHubStore.getEvents() : [];
  const resolvedStops = itinIds.map(id => resolveItineraryStop(id, catalog, events)).filter(Boolean);
  if (mapWrap && mapIframe && resolvedStops.length > 0) {
    let embedUrl = '';
    if (resolvedStops.length === 1) {
      const q = encodeURIComponent(`${resolvedStops[0].mapTarget}, ${resolvedStops[0].mapLocation || resolvedStops[0].location || 'Manila'}, Philippines`);
      embedUrl = `https://maps.google.com/maps?q=${q}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    } else {
      const saddr = encodeURIComponent(`${resolvedStops[0].mapTarget}, ${resolvedStops[0].mapLocation || resolvedStops[0].location || 'Manila'}, Philippines`);
      const daddrParts = resolvedStops.slice(1).map(s => encodeURIComponent(`${s.mapTarget}, ${s.mapLocation || s.location || 'Manila'}, Philippines`));
      embedUrl = `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddrParts.join('+to:')}&output=embed`;
    }
    if (mapIframe.dataset.lastUrl !== embedUrl) {
      mapIframe.dataset.lastUrl = embedUrl;
      mapIframe.src = embedUrl;
    }
    mapWrap.style.display = 'block';
  }
  listEl.innerHTML = itinIds.map((id, idx) => {
    const item = resolveItineraryStop(id, catalog, events);
    if (!item) return '';
    const img = item.image || 'assets/no-image.svg';
    const isVisited = visitedIds.includes(id);
    const isLast = idx === itinIds.length - 1;
    return `
          <div class="itinerary-stop-row" draggable="true" data-idx="${idx}"
               ondragstart="draggedItineraryIdx=${idx}; this.style.opacity='0.5';"
               ondragend="this.style.opacity='1';"
               ondragover="event.preventDefault();"
               ondrop="event.preventDefault(); if (draggedItineraryIdx !== null && draggedItineraryIdx !== ${idx}) { TourismHubStore.reorderItinerary(draggedItineraryIdx, ${idx}); renderCapacityItineraryTracker(); } draggedItineraryIdx = null;"
               style="position: relative; display: flex; align-items: center; justify-content: space-between; gap: 0.85rem; padding: 0.75rem 0.9rem; border: 1px solid ${isVisited ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'}; border-radius: 10px; background: var(--bg-card); flex-wrap: wrap; cursor: grab;">
            ${!isLast ? '<span aria-hidden="true" style="position: absolute; left: 26px; bottom: -14px; width: 2px; height: 14px; background: var(--primary, #0284c7); opacity: 0.45;"></span>' : ''}
            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 200px;">
              <input type="checkbox" ${isVisited ? 'checked' : ''} onchange="TourismHubStore.toggleItineraryVisited('${item.id}'); renderCapacityItineraryTracker();" title="Mark as visited" style="width: 17px; height: 17px; accent-color: #10b981; cursor: pointer; flex-shrink: 0;">
              <span style="width: 26px; height: 26px; border-radius: 50%; background: ${isVisited ? '#10b981' : 'var(--primary, #0284c7)'}; color: #fff; font-size: 0.78rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${isVisited ? '✓' : idx + 1}</span>
              <img src="${img}" alt="${item.title}" referrerpolicy="no-referrer" onerror="this.src='assets/no-image.svg'" style="width: 52px; height: 40px; object-fit: cover; border-radius: 6px; flex-shrink: 0; opacity: ${isVisited ? '0.65' : '1'};">
              <div>
                <a href="attraction-details.html?id=${item.id}" style="font-weight: 700; color: var(--text-main); text-decoration: ${isVisited ? 'line-through' : 'none'}; opacity: ${isVisited ? '0.7' : '1'}; font-size: 0.92rem;">${item.title}</a>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${item.location || 'Manila'} &bull; ${item.operatingHours || 'Open Daily'}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <button type="button" class="btn-outline-sm" onclick="TourismHubStore.moveItineraryItem('${item.id}', 'up'); renderCapacityItineraryTracker();" ${idx === 0 ? 'disabled' : ''} title="Move Up">&uarr;</button>
              <button type="button" class="btn-outline-sm" onclick="TourismHubStore.moveItineraryItem('${item.id}', 'down'); renderCapacityItineraryTracker();" ${idx === itinIds.length - 1 ? 'disabled' : ''} title="Move Down">&darr;</button>
              <button type="button" class="btn-outline-sm" onclick="TourismHubStore.removeFromItinerary('${item.id}'); renderCapacityItineraryTracker();" style="color: #ef4444;" title="Remove">&times;</button>
            </div>
          </div>
        `;
  }).join('');
}
window.renderCapacityItineraryTracker = renderCapacityItineraryTracker;

window.addEventListener('supabaseSyncComplete', () => {
  renderEmbeddedEventsCalendar();
  if (typeof window.renderCapacityItineraryTracker === 'function') window.renderCapacityItineraryTracker();
});
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.renderCapacityItineraryTracker === 'function') window.renderCapacityItineraryTracker();
});
if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
  TourismHubStore.onSync(() => {
    if (typeof window.renderCapacityItineraryTracker === 'function') window.renderCapacityItineraryTracker();
  });
}
if (typeof window.renderCapacityItineraryTracker === 'function') window.renderCapacityItineraryTracker();

function sortCapacityTableRows() {
  const tbody = document.getElementById('capacityTableBody');
  if (!tbody || !sortSelect) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.forEach((row, index) => {
    if (!row.hasAttribute('data-default-order')) {
      row.setAttribute('data-default-order', String(index));
    }
  });

  const criterion = sortSelect.value;
  const getNumber = (row, cellIndex) => {
    const value = row.cells[cellIndex]?.textContent || '';
    return Number.parseInt(value.replace(/[^\d-]/g, ''), 10) || 0;
  };
  const getName = row => row.querySelector('.attraction-cell-title')?.textContent.trim() || '';

  rows.sort((a, b) => {
    const capacityA = getNumber(a, 2);
    const capacityB = getNumber(b, 2);
    const bookedA = getNumber(a, 3);
    const bookedB = getNumber(b, 3);
    const availableA = getNumber(a, 4);
    const availableB = getNumber(b, 4);

    if (criterion === 'name-asc') return getName(a).localeCompare(getName(b));
    if (criterion === 'name-desc') return getName(b).localeCompare(getName(a));
    if (criterion === 'capacity-desc') return capacityB - capacityA;
    if (criterion === 'capacity-asc') return capacityA - capacityB;
    if (criterion === 'booked-desc') return bookedB - bookedA;
    if (criterion === 'available-desc') return availableB - availableA;
    return Number(a.getAttribute('data-default-order')) - Number(b.getAttribute('data-default-order'));
  });

  rows.forEach(row => tbody.appendChild(row));
}

sortSelect.addEventListener('change', sortCapacityTableRows);

function filterTable() {
  const q = (searchInput?.value || '').toLowerCase().trim();
  const activeFilter = document.querySelector('.portal-filter-tab.active')?.getAttribute('data-filter') || 'all';
  const rows = document.querySelectorAll('#capacityTableBody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const typeAttr = (row.getAttribute('data-type') || '').toLowerCase();

    const matchesQuery = !q || text.includes(q);
    const matchesTab = (activeFilter === 'all') || typeAttr.includes(activeFilter);

    if (matchesQuery && matchesTab) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

searchInput?.addEventListener('input', filterTable);

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    filterTable();
  });
});

window.openCapacityDetails = function (name, cap, booked, avail, itemId) {
  document.getElementById('capModalName').textContent = name;
  document.getElementById('capModalMax').textContent = cap;
  document.getElementById('capModalBooked').textContent = booked;
  document.getElementById('capModalAvail').textContent = avail;

  const pct = cap > 0 ? Math.min(100, Math.round((booked / cap) * 100)) : 0;
  document.getElementById('capModalPercent').textContent = `${pct}%`;
  const pBar = document.getElementById('capModalProgressBar');
  pBar.style.width = `${pct}%`;
  pBar.style.background = pct >= 90 ? '#ef4444' : (pct >= 70 ? '#f59e0b' : '#0284c7');

  // Resolve exact target attraction ID for booking tourist pass on attraction-details.html
  let targetAttractionId = '';
  if (window.TourismHubStore) {
    const events = typeof TourismHubStore.getEvents === 'function' ? TourismHubStore.getEvents() : [];
    const catalog = typeof TourismHubStore.getCatalog === 'function' ? TourismHubStore.getCatalog() : [];

    if (itemId) {
      const matchedEvent = events.find(ev => String(ev.id) === String(itemId));
      if (matchedEvent) {
        targetAttractionId = matchedEvent.parentAttractionId || matchedEvent.attractionId || matchedEvent.id;
      } else {
        targetAttractionId = String(itemId);
      }
    } else {
      const lowerName = String(name || '').trim().toLowerCase();
      const matchedCatalog = catalog.find(c => String(c.title || '').trim().toLowerCase() === lowerName);
      if (matchedCatalog) {
        targetAttractionId = matchedCatalog.id;
      } else {
        const matchedEventByTitle = events.find(ev => String(ev.title || '').trim().toLowerCase() === lowerName);
        if (matchedEventByTitle) {
          targetAttractionId = matchedEventByTitle.parentAttractionId || matchedEventByTitle.attractionId || matchedEventByTitle.id;
        }
      }
    }
  }
  if (!targetAttractionId) {
    targetAttractionId = '1';
  }

  const bookBtn = document.getElementById('capModalBookPassBtn');
  if (bookBtn) {
    bookBtn.onclick = function () {
      closePortalModal('capacityDetailsModal');
      window.location.href = `attraction-details.html?id=${encodeURIComponent(targetAttractionId)}`;
    };
  }

  openPortalModal('capacityDetailsModal');
};

window.populateAddEventAttractionsSelect = function () {
  const sel = document.getElementById('schedAttractionId');
  if (!sel) return;
  const catalog = (window.TourismHubStore && typeof TourismHubStore.getCatalog === 'function')
    ? TourismHubStore.getCatalog()
    : [];
  if (catalog.length === 0) {
    sel.innerHTML = '<option value="1">Intramuros Historic Core</option>';
    return;
  }
  sel.innerHTML = catalog.map(attr => {
    const safeTitle = escapeCalHtml(attr.title || attr.id);
    return `<option value="${escapeCalHtml(attr.id)}">${safeTitle}</option>`;
  }).join('');
};

window.openAddEventModalFromCapacity = function () {
  populateAddEventAttractionsSelect();
  const dateInput = document.getElementById('schedDate');
  if (dateInput) {
    const defaultDate = /^\d{4}-\d{2}-\d{2}$/.test(pageSelectedDateKey)
      ? pageSelectedDateKey
      : ((window.TourismHubStore && typeof TourismHubStore.formatLocalDateKey === 'function')
        ? TourismHubStore.formatLocalDateKey(new Date())
        : new Date().toISOString().slice(0, 10));
    dateInput.value = defaultDate;
  }
  openPortalModal('addScheduleModal');
};

function handleScheduleSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('schedTitle').value.trim();
  const attractionId = document.getElementById('schedAttractionId').value;
  const dateVal = document.getElementById('schedDate').value;
  const timeWindow = document.getElementById('schedTime').value.trim() || '09:00 AM - 04:00 PM';
  const cap = parseInt(document.getElementById('schedCapacity').value, 10) || 150;
  const admissionVal = document.getElementById('schedAdmission').value.trim() || 'Free Entry';
  const desc = document.getElementById('schedDesc').value.trim();

  const catalog = (window.TourismHubStore && typeof TourismHubStore.getCatalog === 'function')
    ? TourismHubStore.getCatalog()
    : [];
  const parentAttr = catalog.find(a => String(a.id) === String(attractionId));
  const attractionTitle = parentAttr ? parentAttr.title : 'Attraction Event';
  const parentLoc = parentAttr ? parentAttr.location : 'Metro Manila';
  const parentImg = (parentAttr && parentAttr.image && !String(parentAttr.image).includes('images.unsplash.com/photo-'))
    ? parentAttr.image
    : 'assets/no-image.svg';
  const parentImages = (parentAttr && Array.isArray(parentAttr.images) && parentAttr.images.length > 0)
    ? parentAttr.images
    : [parentImg];

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
  const newEvent = {
    id: `event-${slug}-${Date.now()}`,
    title: title,
    type: 'event',
    parentAttractionId: attractionId,
    attractionId: attractionId,
    attractionTitle: attractionTitle,
    category: attractionTitle,
    badge: attractionId,
    status: 'active',
    eventDate: dateVal,
    date: dateVal,
    priceLabel: dateVal,
    operatingHours: timeWindow,
    schedule: timeWindow,
    time: timeWindow,
    capacityPerSlot: cap,
    capacity: cap,
    admission: admissionVal,
    location: parentLoc,
    image: parentImg,
    images: parentImages,
    description: desc || `Scheduled event happening at ${attractionTitle}.`
  };

  if (window.TourismHubStore && typeof TourismHubStore.addEvent === 'function') {
    TourismHubStore.addEvent(newEvent);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    const [ey, em] = dateVal.split('-').map(Number);
    pageCalViewDate = new Date(ey, em - 1, 1);
    pageSelectedDateKey = dateVal;
    pageCalShowAll = false;
  }
  renderEmbeddedEventsCalendar();
  if (typeof window.syncCapacityPage === 'function') {
    window.syncCapacityPage();
  }

  closePortalModal('addScheduleModal');
  document.getElementById('newScheduleForm').reset();
  if (window.showPortalToast) {
    showPortalToast(`Event "${title}" added for ${attractionTitle}!`);
  }
}
