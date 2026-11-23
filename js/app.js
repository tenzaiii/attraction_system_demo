document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Shared Data Store for Attractions ---
  let attractionsData = (window.TourismHubStore && typeof TourismHubStore.getCatalog === 'function')
    ? TourismHubStore.getCatalog()
    : [
      {
        id: 'rizal-monument',
        title: 'Rizal Monument & Luneta Park',
        category: 'Historical Site',
        type: 'historical',
        location: 'Manila',
        rating: '4.8',
        reviews: '1.2k',
        price: 0,
        priceLabel: 'Free Entry',
        image: 'assets/rizal-monument.jpg',
        badge: 'Iconic Landmark',
        description: 'The monumental memorial in Luneta Park honoring Dr. José Rizal, national hero of the Philippines.'
      },
      {
        id: 'intramuros-walled-city',
        title: 'Intramuros & Fort Santiago',
        category: 'Historical Site',
        type: 'historical',
        location: 'Manila',
        rating: '4.9',
        reviews: '1.5k',
        price: 75,
        priceLabel: 'Entrance ₱75',
        image: 'assets/hero-banner.jpg',
        badge: 'Heritage District',
        description: 'Explore historic stone fortifications, centuries-old churches, and museums inside the Walled City of Manila.'
      },
      {
        id: 'qc-memorial-circle',
        title: 'Quezon Memorial Circle',
        category: 'Park & Nature',
        type: 'park',
        location: 'Quezon City',
        rating: '4.7',
        reviews: '980',
        price: 0,
        priceLabel: 'Free Entry',
        image: 'assets/qc-memorial-circle.jpg',
        badge: 'National Shrine',
        description: 'Central civic park, heritage shrine, gardens, and museums located in the heart of Quezon City.'
      }
    ];

  // User Wishlist
  function getSavedSet() {
    const list = (window.TourismHubStore && typeof TourismHubStore.getFavorites === 'function')
      ? TourismHubStore.getFavorites()
      : [];
    return new Set(list);
  }

  // --- 2. DOM Elements ---
  const attractionsGrid = document.getElementById('attractionsGrid');
  const featuredEventsGrid = document.getElementById('featuredEventsGrid');
  const searchInput = document.getElementById('heroSearchInput');
  const searchFilter = document.getElementById('searchCategoryFilter');
  const searchBtn = document.getElementById('heroSearchBtn');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const seeAllBtn = document.getElementById('seeAllBtn');

  // Modals & Panels
  const bookingModal = document.getElementById('bookingModal');
  const ticketsModal = document.getElementById('ticketsModal');
  const notificationsModal = document.getElementById('notificationsModal');
  const capacityModal = document.getElementById('capacityModal');
  const toast = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // Sticky Header Effect
  const siteHeader = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      siteHeader?.classList.add('scrolled');
    } else {
      siteHeader?.classList.remove('scrolled');
    }
  });

  // --- 2b. Automatic Hero Featured Locations Background Carousel ---
  const heroLocationCarousel = document.getElementById('heroLocationCarousel');
  const heroLocationDots = document.getElementById('heroLocationDots');
  const heroLocationCaptionText = document.getElementById('heroLocationCaptionText');
  const heroLocationCaptionLink = document.getElementById('heroLocationCaptionLink');
  const heroLocationMetaBar = document.getElementById('heroLocationMetaBar');
  const HERO_FALLBACK_PHOTOS = [
    'assets/qc-memorial-circle.jpg',
    'assets/rizal-monument.jpg',
    'assets/hero-banner.jpg',
    'assets/white-beach.jpg'
  ];
  let heroLocationSlidesData = [];
  let currentHeroLocationIdx = 0;
  let heroLocationTimer = null;

  function applyHeroLocationSlide(index) {
    if (!heroLocationCarousel || heroLocationSlidesData.length === 0) return;
    const slides = heroLocationCarousel.querySelectorAll('.hero-location-slide');
    const dots = heroLocationDots ? heroLocationDots.querySelectorAll('.hero-location-dot') : [];
    if (slides.length === 0) return;

    currentHeroLocationIdx = ((index % slides.length) + slides.length) % slides.length;
    const activeItem = heroLocationSlidesData[currentHeroLocationIdx];

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentHeroLocationIdx);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentHeroLocationIdx);
      dot.setAttribute('aria-pressed', idx === currentHeroLocationIdx ? 'true' : 'false');
    });

    if (activeItem && heroLocationCaptionText) {
      heroLocationCaptionText.textContent = `${activeItem.title} \u2022 ${activeItem.location || 'Metro Manila'}`;
    }
    if (activeItem && heroLocationCaptionLink) {
      heroLocationCaptionLink.href = `attraction-details.html?id=${encodeURIComponent(activeItem.id)}`;
    }
  }

  function stopHeroLocationAutoPlay() {
    if (heroLocationTimer) {
      clearInterval(heroLocationTimer);
      heroLocationTimer = null;
    }
  }

  function startHeroLocationAutoPlay() {
    stopHeroLocationAutoPlay();
    if (heroLocationSlidesData.length <= 1) return;
    heroLocationTimer = setInterval(() => {
      applyHeroLocationSlide(currentHeroLocationIdx + 1);
    }, 4500);
  }

  window.changeHeroLocationSlide = function (delta) {
    applyHeroLocationSlide(currentHeroLocationIdx + delta);
    startHeroLocationAutoPlay();
  };

  window.goToHeroLocationSlide = function (idx) {
    applyHeroLocationSlide(idx);
    startHeroLocationAutoPlay();
  };

  function renderHeroLocationsCarousel() {
    if (!heroLocationCarousel) return;

    const catalog = (window.TourismHubStore && typeof TourismHubStore.getCatalog === 'function')
      ? TourismHubStore.getCatalog()
      : attractionsData;

    const featured = Array.isArray(catalog) && catalog.length > 0
      ? catalog.filter(item => item.status !== 'closed')
      : [];
    const pool = featured.length > 0 ? featured : (Array.isArray(catalog) ? catalog : []);
    const targetTypes = ['historical', 'spot', 'park', 'museum'];
    const picked = [];
    const usedIds = new Set();
    targetTypes.forEach(t => {
      const match = pool.find(item => String(item.type || '').toLowerCase() === t && !usedIds.has(item.id));
      if (match) {
        picked.push(match);
        usedIds.add(match.id);
      }
    });
    pool.forEach(item => {
      if (picked.length < 4 && !usedIds.has(item.id)) {
        picked.push(item);
        usedIds.add(item.id);
      }
    });
    heroLocationSlidesData = picked.slice(0, 4);

    if (heroLocationSlidesData.length === 0) {
      heroLocationSlidesData = [
        { id: 'qc-memorial-circle', title: 'Quezon Memorial Circle & Park', location: 'Quezon City', image: 'assets/qc-memorial-circle.jpg' },
        { id: 'rizal-monument', title: 'Rizal Monument & Luneta Park', location: 'Manila', image: 'assets/rizal-monument.jpg' }
      ];
    }

    if (currentHeroLocationIdx >= heroLocationSlidesData.length) {
      currentHeroLocationIdx = 0;
    }

    heroLocationCarousel.innerHTML = heroLocationSlidesData.map((item, idx) => {
      const candidateImg = (Array.isArray(item.images) && item.images[0]) || item.image || '';
      const hasCustomPhoto = candidateImg && !String(candidateImg).includes('images.unsplash.com/photo-') && !String(candidateImg).includes('no-image.svg');
      const resolvedBg = hasCustomPhoto ? candidateImg : HERO_FALLBACK_PHOTOS[idx % HERO_FALLBACK_PHOTOS.length];
      return `<div class="hero-location-slide ${idx === currentHeroLocationIdx ? 'active' : ''}" style="background-image: url('${String(resolvedBg).replace(/'/g, '%27')}');"></div>`;
    }).join('');

    if (heroLocationDots) {
      heroLocationDots.innerHTML = heroLocationSlidesData.map((item, idx) => {
        const safeTitle = String(item.title || 'Featured Location').replace(/"/g, '&quot;');
        return `<button type="button" class="hero-location-dot ${idx === currentHeroLocationIdx ? 'active' : ''}" onclick="goToHeroLocationSlide(${idx})" aria-label="Show ${safeTitle}" aria-pressed="${idx === currentHeroLocationIdx ? 'true' : 'false'}"></button>`;
      }).join('');
    }

    if (heroLocationMetaBar && heroLocationMetaBar.dataset.heroHoverBound !== 'true') {
      heroLocationMetaBar.dataset.heroHoverBound = 'true';
      heroLocationMetaBar.addEventListener('mouseenter', stopHeroLocationAutoPlay);
      heroLocationMetaBar.addEventListener('mouseleave', startHeroLocationAutoPlay);
    }

    applyHeroLocationSlide(currentHeroLocationIdx);
    startHeroLocationAutoPlay();
  }

  // --- 3. Render Attractions Grid ---
  let showAll = false;
  let currentFilter = 'all';

  function renderAttractions() {
    if (!attractionsGrid) return;

    if (window.TourismHubStore) {
      attractionsData = TourismHubStore.getCatalog();
    }

    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const dropdownCat = searchFilter ? searchFilter.value : 'all';

    const matchesFilterValue = (item, filterVal) => {
      if (!filterVal || filterVal === 'all') return true;
      const val = String(filterVal).toLowerCase();
      const itemType = String(item.type || '').toLowerCase();
      const itemCategory = String(item.category || '').toLowerCase();
      const itemLocation = String(item.location || '').toLowerCase();
      return itemType === val || itemCategory === val || itemLocation === val;
    };

    let filtered = attractionsData.filter(item => {
      // Tab filter
      if (!matchesFilterValue(item, currentFilter)) {
        return false;
      }
      // Dropdown category / location filter
      if (!matchesFilterValue(item, dropdownCat)) {
        return false;
      }
      // Text search
      if (searchTerm) {
        const matchesName = item.title?.toLowerCase().includes(searchTerm);
        const matchesCat = item.category?.toLowerCase().includes(searchTerm);
        const matchesLoc = item.location?.toLowerCase().includes(searchTerm);
        const matchesDesc = item.description?.toLowerCase().includes(searchTerm);
        return matchesName || matchesCat || matchesLoc || matchesDesc;
      }
      return true;
    });

    // Limit initial display unless expanded
    const displayList = showAll ? filtered : filtered.slice(0, 3);
    const savedAttractions = getSavedSet();

    if (displayList.length === 0) {
      attractionsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
          <svg style="width: 48px; height: 48px; color: #94a3b8; margin: 0 auto 1rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; margin-bottom: 0.5rem;">No attractions found</h3>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Try modifying your search or clearing the category filters.</p>
          <button id="resetSearchBtn" style="margin-top: 1rem; padding: 0.5rem 1.25rem; background: var(--primary); color: #fff; border-radius: var(--radius-full); font-weight: 600;">Reset Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('resetSearchBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          if (searchFilter) searchFilter.value = 'all';
          currentFilter = 'all';
          updateActiveTab('all');
          renderAttractions();
          renderFeaturedEvents();
        });
      }
      return;
    }

    attractionsGrid.innerHTML = displayList.map(item => `
      <article class="attraction-card" data-id="${item.id}">
        <div class="card-media-wrapper image-preload-wrapper" onclick="window.location.href='attraction-details.html?id=${item.id}'" style="cursor: pointer;" title="View ${item.title} details">
          <img src="${(item.image && !String(item.image).includes('images.unsplash.com/photo-')) ? item.image : 'assets/no-image.svg'}" alt="${item.title}" class="card-image is-preloading" loading="lazy" onload="this.classList.remove('is-preloading'); this.classList.add('is-loaded'); this.parentElement.classList.add('img-loaded');" onerror="this.classList.remove('is-preloading'); this.classList.add('is-loaded'); this.parentElement.classList.add('img-loaded'); this.src='assets/no-image.svg';">
          <span class="card-badge-floating">${item.badge || 'Featured'}</span>
          <button class="card-wishlist-btn ${savedAttractions.has(item.id) ? 'saved' : ''}" 
                  aria-label="Save ${item.title}" 
                  onclick="event.stopPropagation(); toggleWishlist('${item.id}', '${item.title}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${savedAttractions.has(item.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title" style="cursor: pointer;" onclick="window.location.href='attraction-details.html?id=${item.id}'" title="View details">${item.title}</h3>
          <p class="card-subtitle">${item.category}</p>
          <div class="card-meta-row">
            <div class="card-rating">
              <svg class="star-icon" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${item.rating || '4.8'}</span>
              <span class="rating-count">(${item.reviews || 'New'})</span>
            </div>
            <div class="card-price-cta" style="display: flex; gap: 0.4rem; align-items: center;">
              <a href="attraction-details.html?id=${item.id}" class="btn-book-card" style="text-align: center; text-decoration: none;">View Details</a>
            </div>
          </div>
        </div>
      </article>
    `).join('');
  }

  let currentEventSlideIndex = 0;
  let eventCarouselTimer = null;

  function formatBannerEventDate(ev) {
    const rawKey = (window.TourismHubStore && typeof TourismHubStore.extractEventDateKey === 'function')
      ? TourismHubStore.extractEventDateKey(ev)
      : (ev.eventDate || ev.priceLabel || '');
    let datePart = '';
    if (rawKey && /^\d{4}-\d{2}-\d{2}$/.test(rawKey)) {
      const [y, m, d] = rawKey.split('-').map(Number);
      datePart = new Date(y, m - 1, d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } else if (ev.eventDate || ev.priceLabel) {
      datePart = String(ev.eventDate || ev.priceLabel).trim();
    }
    const timePart = (ev.operatingHours && ev.operatingHours !== 'TBA') ? ev.operatingHours : '';
    if (datePart && timePart) return `${datePart} \u2022 ${timePart}`;
    return datePart || timePart || 'Upcoming Schedule';
  }

  function applyFeaturedEventSlide(index) {
    if (!featuredEventsGrid) return;
    const slides = featuredEventsGrid.querySelectorAll('.event-banner-slide');
    const dots = featuredEventsGrid.querySelectorAll('.event-banner-dot');
    if (slides.length === 0) return;

    currentEventSlideIndex = ((index % slides.length) + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentEventSlideIndex);
      slide.setAttribute('aria-hidden', idx === currentEventSlideIndex ? 'false' : 'true');
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentEventSlideIndex);
      dot.setAttribute('aria-pressed', idx === currentEventSlideIndex ? 'true' : 'false');
    });
  }

  function stopEventCarouselAutoPlay() {
    if (eventCarouselTimer) {
      clearInterval(eventCarouselTimer);
      eventCarouselTimer = null;
    }
  }

  function startEventCarouselAutoPlay(totalSlides) {
    stopEventCarouselAutoPlay();
    if (totalSlides <= 1) return;
    eventCarouselTimer = setInterval(() => {
      applyFeaturedEventSlide(currentEventSlideIndex + 1);
    }, 5500);
  }

  window.changeFeaturedEventSlide = function (delta) {
    applyFeaturedEventSlide(currentEventSlideIndex + delta);
    const total = featuredEventsGrid ? featuredEventsGrid.querySelectorAll('.event-banner-slide').length : 0;
    startEventCarouselAutoPlay(total);
  };

  window.goToFeaturedEventSlide = function (index) {
    applyFeaturedEventSlide(index);
    const total = featuredEventsGrid ? featuredEventsGrid.querySelectorAll('.event-banner-slide').length : 0;
    startEventCarouselAutoPlay(total);
  };

  function renderFeaturedEvents() {
    if (!featuredEventsGrid) return;

    const events = (window.TourismHubStore && typeof TourismHubStore.getEvents === 'function')
      ? TourismHubStore.getEvents()
      : [];

    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const dropdownCat = searchFilter ? searchFilter.value : 'all';
    const isLocationFilter = dropdownCat === 'Manila' || dropdownCat === 'Quezon City';

    const filteredEvents = events.filter(ev => {
      if (isLocationFilter) {
        const evLoc = String(ev.location || '').toLowerCase();
        if (evLoc !== dropdownCat.toLowerCase()) return false;
      }
      if (searchTerm) {
        const matchesTitle = ev.title?.toLowerCase().includes(searchTerm);
        const matchesAttr = ev.attractionTitle?.toLowerCase().includes(searchTerm);
        const matchesLoc = ev.location?.toLowerCase().includes(searchTerm);
        const matchesDesc = ev.description?.toLowerCase().includes(searchTerm);
        return matchesTitle || matchesAttr || matchesLoc || matchesDesc;
      }
      return true;
    });

    if (filteredEvents.length === 0) {
      stopEventCarouselAutoPlay();
      featuredEventsGrid.style.minHeight = 'auto';
      featuredEventsGrid.style.background = 'transparent';
      featuredEventsGrid.style.boxShadow = 'none';
      featuredEventsGrid.innerHTML = `
        <div class="events-banner-empty" style="border: 1px dashed var(--border);">
          <h3 style="font-family: var(--font-heading); font-size: 1.15rem; color: var(--text-main); margin-bottom: 0.35rem;">No upcoming events scheduled</h3>
          <p style="font-size: 0.9rem; margin: 0;">Check back soon for special activities and scheduled events across Manila and Quezon City attractions.</p>
        </div>
      `;
      return;
    }

    featuredEventsGrid.style.minHeight = '';
    featuredEventsGrid.style.background = '';
    featuredEventsGrid.style.boxShadow = '';

    if (currentEventSlideIndex >= filteredEvents.length) {
      currentEventSlideIndex = 0;
    }

    const esc = (str) => String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const escAttr = (str) => esc(str).replace(/'/g, '&#39;');

    const slidesHtml = filteredEvents.map((ev, idx) => {
      const targetAttractionId = ev.parentAttractionId || ev.id;
      const rawImgUrl = (Array.isArray(ev.images) && ev.images[0]) || ev.image || '';
      const isNoImage = !rawImgUrl || String(rawImgUrl).includes('no-image.svg') || String(rawImgUrl).includes('images.unsplash.com/photo-');
      // If event has no image, try to use the parent attraction's image
      let safeImg = rawImgUrl;
      if (isNoImage && targetAttractionId) {
        const parentAttr = attractionsData.find(a => a.id === targetAttractionId);
        if (parentAttr && parentAttr.image && !String(parentAttr.image).includes('no-image.svg') && !String(parentAttr.image).includes('images.unsplash.com/photo-')) {
          safeImg = parentAttr.image;
        } else {
          safeImg = '';
        }
      }
      const hasImage = safeImg && !String(safeImg).includes('no-image.svg');
      const detailsHref = `attraction-details.html?id=${encodeURIComponent(targetAttractionId)}`;
      const dateText = formatBannerEventDate(ev);
      const isActive = idx === currentEventSlideIndex;

      return `
        <article class="event-banner-slide ${isActive ? 'active' : ''}" data-slide-index="${idx}" data-event-id="${esc(ev.id)}" aria-hidden="${isActive ? 'false' : 'true'}">
          <img src="${esc(safeImg)}" alt="${esc(ev.title)}" class="event-banner-bg" onerror="this.src='assets/no-image.svg'">
          <div class="event-banner-overlay"></div>
          <div class="event-banner-content">
            <div class="event-banner-meta-row">
              <span class="event-banner-venue-pill">${esc(ev.attractionTitle || 'Featured Event')}${ev.location ? ' &bull; ' + esc(ev.location) : ''}</span>
              <span class="event-banner-date-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>${esc(dateText)}</span>
              </span>
            </div>
            <h3 class="event-banner-title">${esc(ev.title)}</h3>
            <p class="event-banner-desc">${esc(ev.description || 'Experience this special upcoming cultural and tourism event.')}</p>
            <div class="event-banner-actions">
              <button type="button" class="btn-event-banner-book" onclick="openBookingModal('${escAttr(ev.id)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Book Pass</span>
              </button>
              <a href="${detailsHref}" class="btn-event-banner-details">View Details</a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    const navControlsHtml = filteredEvents.length > 1 ? `
      <button type="button" class="event-banner-nav-btn prev" onclick="changeFeaturedEventSlide(-1)" aria-label="Previous Featured Event">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button type="button" class="event-banner-nav-btn next" onclick="changeFeaturedEventSlide(1)" aria-label="Next Featured Event">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      <div class="event-banner-dots" role="tablist" aria-label="Featured Event Slides">
        ${filteredEvents.map((ev, idx) => `
          <button type="button" class="event-banner-dot ${idx === currentEventSlideIndex ? 'active' : ''}" onclick="goToFeaturedEventSlide(${idx})" aria-label="Slide ${idx + 1}: ${esc(ev.title)}" aria-pressed="${idx === currentEventSlideIndex ? 'true' : 'false'}"></button>
        `).join('')}
      </div>
    ` : '';

    featuredEventsGrid.innerHTML = `
      <div class="events-banner-track">
        ${slidesHtml}
      </div>
      ${navControlsHtml}
    `;

    if (featuredEventsGrid.dataset.carouselHoverBound !== 'true') {
      featuredEventsGrid.dataset.carouselHoverBound = 'true';
      featuredEventsGrid.addEventListener('mouseenter', stopEventCarouselAutoPlay);
      featuredEventsGrid.addEventListener('mouseleave', () => {
        const count = featuredEventsGrid.querySelectorAll('.event-banner-slide').length;
        startEventCarouselAutoPlay(count);
      });
    }

    startEventCarouselAutoPlay(filteredEvents.length);
  }

  // Helper to update active filter tab UI
  function updateActiveTab(type) {
    filterTabs.forEach(tab => {
      if (tab.dataset.filter === type) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // --- 4. Search and Filter Event Listeners ---
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderAttractions();
      renderFeaturedEvents();
    });
  }

  if (searchFilter) {
    searchFilter.addEventListener('change', () => {
      renderAttractions();
      renderFeaturedEvents();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      renderAttractions();
      renderFeaturedEvents();
      document.getElementById('featuredAttractions')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      currentFilter = tab.dataset.filter;
      updateActiveTab(currentFilter);
      renderAttractions();
    });
  });

  // Quick Action Buttons (Under Hero)
  window.filterByQuickAction = function (type) {
    if (type === 'attractions') {
      currentFilter = 'all';
      updateActiveTab('all');
      renderAttractions();
      document.getElementById('featuredAttractions')?.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'events') {
      renderFeaturedEvents();
      document.getElementById('featuredEvents')?.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'tickets') {
      openTicketsModal();
    } else if (type === 'notifications') {
      openNotificationsModal();
    }
  };

  // --- 5. Wishlist / Favorites Toggle ---
  window.toggleWishlist = function (id, name) {
    if (window.TourismHubStore && typeof TourismHubStore.toggleFavorite === 'function') {
      const res = TourismHubStore.toggleFavorite(id);
      if (res.isFavorite) {
        showToast(`Saved "${name}" to your profile favorites!`);
      } else {
        showToast(`Removed "${name}" from your favorites`);
      }
    }
    renderAttractions();
    // Dispatch custom event to notify open tabs or other components
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  };

  // --- 6. Dynamic Notifications & Announcements Renderer ---
  function renderNotifications() {
    const notifBody = document.getElementById('notificationsModalBody');
    const badgeCount = document.querySelector('.badge-count');
    if (!window.TourismHubStore) return;
    const announcements = TourismHubStore.getAnnouncements();

    if (badgeCount) {
      badgeCount.textContent = announcements.length;
    }

    if (!notifBody) return;

    if (announcements.length === 0) {
      notifBody.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <p>No active alerts or announcements at this time.</p>
        </div>
      `;
      return;
    }

    const recentAnnouncements = announcements.slice(0, 4);

    notifBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${recentAnnouncements.map(a => {
      const isUrgent = a.priority === 'urgent';
      const isWeather = a.type === 'weather';
      const iconBg = isUrgent ? '#ef4444' : isWeather ? '#0284c7' : '#10b981';
      return `
            <div style="display: flex; gap: 0.85rem; padding: 0.85rem; background: ${isUrgent ? '#fef2f2' : isWeather ? '#f0f9ff' : 'var(--bg-page)'}; border: 1px solid ${isUrgent ? '#fecaca' : isWeather ? '#bae6fd' : 'var(--border)'}; border-radius: var(--radius-sm);">
              <div style="width: 36px; height: 36px; border-radius: 99px; background: ${iconBg}; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                </svg>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <span style="font-weight: 700; font-size: 0.92rem; color: ${isUrgent ? '#b91c1c' : '#0f172a'};">${a.title}</span>
                  <span style="font-size: 0.72rem; color: var(--text-light);">${a.timestamp || 'Recent'}</span>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">${a.text}</div>
                <div style="font-size: 0.72rem; color: ${isUrgent ? '#dc2626' : '#0284c7'}; font-weight: 600; margin-top: 4px;">Destination: ${a.target}</div>
              </div>
            </div>
          `;
    }).join('')}
      </div>
      <div style="margin-top: 1.15rem; padding-top: 0.9rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
        <a href="notifications.html" class="btn-primary-blue" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem; font-weight: 700; font-size: 0.88rem; border-radius: var(--radius-sm);">
          <span>See More Notifications</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </a>
      </div>
    `;
  }

  // --- 7. Dynamic Live Capacity Modal Renderer ---
  function renderCapacityModal() {
    const grid = document.getElementById('capacityModalGrid');
    if (!grid || !window.TourismHubStore) return;
    const capacityData = TourismHubStore.getCapacityData();
    const catalog = TourismHubStore.getCatalog();

    grid.innerHTML = catalog.map(item => {
      const slots = capacityData[item.id] || [];
      const totalBooked = slots.reduce((acc, s) => acc + (s.booked || 0), 0);
      const totalMax = slots.reduce((acc, s) => acc + (s.max || 100), 0) || 100;
      const pct = Math.min(100, Math.round((totalBooked / totalMax) * 100));

      const tagClass = pct >= 90 ? 'high' : pct >= 75 ? 'moderate' : 'normal';
      const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';

      return `
        <div class="capacity-item-card">
          <div class="capacity-header-row">
            <span class="capacity-title">${item.title}</span>
            <span class="capacity-tag ${tagClass}">${pct}% Capacity</span>
          </div>
          <div class="capacity-progress-bar">
            <div class="capacity-progress-fill" style="width: ${pct}%; background: ${color};"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
            <span>Hours: <strong>${item.operatingHours || '08:00 AM - 06:00 PM'}</strong></span>
            <span>Allocated: <strong>${totalBooked} / ${totalMax} pax</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 8. Dynamic "My Digital Passes" Renderer & QR Zoom/Download ---
  function getOwnedPassByCode(code) {
    if (!window.TourismHubStore || typeof TourismHubStore.getUserPasses !== 'function') return null;
    const cleanCode = String(code || '').toUpperCase().trim();
    return TourismHubStore.getUserPasses().find(p => String(p.code || '').toUpperCase().trim() === cleanCode) || null;
  }

  window.downloadPassQr = async function (code) {
    if (!getOwnedPassByCode(code)) {
      if (typeof showToast === 'function') showToast('QR codes are only visible to the user who booked the pass.');
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
      if (typeof showToast === 'function') showToast(`Downloaded QR Pass: ${code}`);
    } catch (e) {
      window.open(qrUrl, '_blank');
    }
  };

  window.zoomPassQr = function (code, attraction, visitorName) {
    if (!getOwnedPassByCode(code)) {
      if (typeof showToast === 'function') showToast('QR codes are only visible to the user who booked the pass.');
      return;
    }
    let modal = document.getElementById('globalQrZoomModal');
    if (modal) modal.remove();
    const html = `
      <div class="modal-overlay active" id="globalQrZoomModal" role="dialog" aria-modal="true" style="display: flex; z-index: 9999;" onclick="if(event.target===this) this.remove()">
        <div class="modal-dialog" style="max-width: 390px; text-align: center; padding: 1.75rem; background: var(--bg-card, #ffffff); border: 1px solid var(--border); border-radius: 16px; margin: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin: 0;">${attraction || 'Digital Tourist Pass'}</h3>
            <button onclick="document.getElementById('globalQrZoomModal')?.remove()" class="modal-close" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);">&times;</button>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1.15rem;">Scan at any attraction express gate or save image</p>
          <div style="background: #ffffff; padding: 16px; border-radius: 14px; border: 2px solid #e2e8f0; display: inline-block; margin-bottom: 1rem;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=340x340&margin=12&data=${encodeURIComponent(code)}" alt="QR ${code}" width="230" height="230" style="display: block;" />
          </div>
          <div style="font-family: monospace; font-size: 1.05rem; font-weight: 800; color: #0284c7; margin-bottom: 0.2rem;">${code}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem;">Pass Holder: ${visitorName || 'Tourist'}</div>
          <div style="display: flex; gap: 0.6rem;">
            <button type="button" onclick="downloadPassQr('${code}')" style="flex: 1; padding: 0.7rem; background: #0284c7; color: #ffffff; font-weight: 700; border: none; border-radius: 8px; cursor: pointer;">Download QR PNG</button>
            <button type="button" onclick="document.getElementById('globalQrZoomModal')?.remove()" style="padding: 0.7rem 1rem; background: var(--bg-subtle); color: var(--text-main); border: 1px solid var(--border); font-weight: 700; border-radius: 8px; cursor: pointer;">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  function renderMyTickets() {
    const ticketsBody = document.getElementById('myTicketsModalBody');
    if (!ticketsBody || !window.TourismHubStore) return;
    const activeUser = (TourismHubStore.getClientAuth && TourismHubStore.getClientAuth()) ||
      (TourismHubStore.getAdminAuth && TourismHubStore.getAdminAuth());

    if (!activeUser) {
      ticketsBody.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <p style="margin-bottom: 1rem;">Please sign in to view QR codes for passes you have booked.</p>
          <a href="login.html?redirect=index.html" class="btn-primary-blue" style="display: inline-flex; text-decoration: none;">Sign In to View Passes</a>
        </div>
      `;
      return;
    }

    const passes = typeof TourismHubStore.getUserPasses === 'function'
      ? TourismHubStore.getUserPasses(activeUser)
      : [];

    if (passes.length === 0) {
      ticketsBody.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <p>No active digital passes booked under your account yet. Reserve an attraction pass to generate your private QR pass!</p>
        </div>
      `;
      return;
    }

    ticketsBody.innerHTML = passes.map(pass => {
      const safeAttr = (pass.attraction || 'Attraction Pass').replace(/'/g, "\\'");
      const safeVisitor = (pass.visitorName || 'Tourist').replace(/'/g, "\\'");
      return `
      <div class="digital-ticket-preview" style="margin-bottom: 1.25rem;">
        <div class="ticket-header-row">
          <div>
            <span class="ticket-pass-type">${pass.passType || 'Standard Pass'}</span>
            <h4 style="font-size: 1.15rem; font-weight: 800; margin-top: 0.35rem;">${pass.attraction}</h4>
          </div>
          <span style="background: ${pass.status === 'valid' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}; color: ${pass.status === 'valid' ? '#34d399' : '#f87171'}; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 99px;">
            ${(pass.status || 'ACTIVE').toUpperCase()}
          </span>
        </div>
        
        <div class="ticket-details-grid">
          <div class="ticket-info-item">
            <small>Pass Holder</small>
            <strong>${pass.visitorName || 'Tourist'}</strong>
          </div>
          <div class="ticket-info-item">
            <small>Valid Date</small>
            <strong>${pass.validDate || 'Today'}</strong>
          </div>
          <div class="ticket-info-item">
            <small>Party Size</small>
            <strong>${pass.partySize || 1} Person(s)</strong>
          </div>
          <div class="ticket-info-item">
            <small>Pass Reference</small>
            <strong style="color: #0284c7;">${pass.code}</strong>
          </div>
        </div>

        <div class="ticket-barcode-wrap">
          <div onclick="zoomPassQr('${pass.code}', '${safeAttr}', '${safeVisitor}')" title="Click to enlarge QR Code" style="background: #ffffff; padding: 8px; border-radius: 8px; display: inline-block; margin-bottom: 0.35rem; cursor: zoom-in;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=6&data=${encodeURIComponent(pass.code)}" alt="QR Code for ${pass.code}" width="96" height="96" style="display: block;" />
          </div>
          <span style="font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; color: var(--text-muted);">${pass.code}</span>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button type="button" onclick="zoomPassQr('${pass.code}', '${safeAttr}', '${safeVisitor}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 700; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-subtle); color: var(--text-main); cursor: pointer;">Zoom QR</button>
            <button type="button" onclick="downloadPassQr('${pass.code}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 700; border-radius: 6px; border: none; background: #0284c7; color: #fff; cursor: pointer;">Download QR</button>
          </div>
        </div>
      </div>
    `;
    }).join('');
  }

  function findBookableItem(itemId) {
    if (window.TourismHubStore) {
      attractionsData = TourismHubStore.getCatalog();
      const catalogMatch = attractionsData.find(a => String(a.id) === String(itemId));
      if (catalogMatch) return catalogMatch;
      if (typeof TourismHubStore.getEvents === 'function') {
        const events = TourismHubStore.getEvents();
        const eventMatch = events.find(e => String(e.id) === String(itemId));
        if (eventMatch) return eventMatch;
      }
    }
    return attractionsData.find(a => String(a.id) === String(itemId)) || attractionsData[0];
  }

  // --- 9. Modals Logic (Booking, Tickets, Notifications) ---
  window.openBookingModal = function (attractionId) {
    // Check if user is logged in before booking
    const clientAuth = (window.TourismHubStore && typeof TourismHubStore.getClientAuth === 'function')
      ? TourismHubStore.getClientAuth()
      : null;
    const adminAuth = (window.TourismHubStore && typeof TourismHubStore.getAdminAuth === 'function')
      ? TourismHubStore.getAdminAuth()
      : null;

    if (!clientAuth && !adminAuth) {
      // Redirect to login page with return parameter to resume booking
      window.location.href = `login.html?redirect=index.html%23featuredAttractions`;
      return;
    }

    const attraction = findBookableItem(attractionId);
    const modalTitle = document.getElementById('bookingModalTitle');
    const modalImg = document.getElementById('bookingModalImg');
    const modalPrice = document.getElementById('bookingModalPrice');
    const bookingAttractionInput = document.getElementById('bookingAttractionId');
    const bookingDateInput = document.getElementById('bookingDate');

    // Auto-fill visitor name with logged-in user name
    const visitorNameInput = document.getElementById('visitorName');
    if (visitorNameInput) {
      const activeUser = clientAuth || adminAuth;
      if (activeUser && activeUser.name) {
        visitorNameInput.value = activeUser.name;
      }
    }

    // Pre-fill event/visit date if this item carries an event date
    if (bookingDateInput) {
      const extractedDate = (window.TourismHubStore && typeof TourismHubStore.extractEventDateKey === 'function')
        ? TourismHubStore.extractEventDateKey(attraction)
        : (attraction?.eventDate || '');
      if (extractedDate && /^\d{4}-\d{2}-\d{2}$/.test(extractedDate)) {
        bookingDateInput.value = extractedDate;
      } else {
        bookingDateInput.value = (window.TourismHubStore && typeof TourismHubStore.formatLocalDateKey === 'function')
          ? TourismHubStore.formatLocalDateKey(new Date())
          : new Date().toISOString().slice(0, 10);
      }
    }

    const numericPrice = (window.TourismHubStore && typeof TourismHubStore.parseNumericPriceFromLabel === 'function')
      ? TourismHubStore.parseNumericPriceFromLabel(attraction.admission || attraction.priceLabel || '', attraction.price)
      : (typeof attraction.price === 'number' ? attraction.price : 0);
    const itemImg = (Array.isArray(attraction.images) && attraction.images[0]) || attraction.image || '';
    if (modalTitle) modalTitle.textContent = `Reserve Pass: ${attraction.title}`;
    if (modalImg) {
      modalImg.src = (itemImg && !String(itemImg).includes('images.unsplash.com/photo-')) ? itemImg : 'assets/no-image.svg';
      modalImg.onerror = function () { this.src = 'assets/no-image.svg'; };
    }
    if (modalPrice) modalPrice.textContent = attraction.admission || attraction.priceLabel || (numericPrice > 0 ? `₱${numericPrice}` : 'Free (₱0)');
    if (bookingAttractionInput) bookingAttractionInput.value = attraction.id;

    recalcTotal();
    bookingModal?.classList.add('active');
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  };

  // Close modals on clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Modal Quantity & Pricing calculation
  const visitorCountInput = document.getElementById('visitorCount');
  const totalPriceDisplay = document.getElementById('bookingTotalPrice');

  function getResolvedAttractionPrice(attr) {
    if (!attr) return 0;
    if (window.TourismHubStore && typeof TourismHubStore.parseNumericPriceFromLabel === 'function') {
      return TourismHubStore.parseNumericPriceFromLabel(attr.admission || attr.priceLabel || '', attr.price);
    }
    return (typeof attr.price === 'number' && !isNaN(attr.price)) ? attr.price : 0;
  }

  function recalcTotal() {
    if (!visitorCountInput || !totalPriceDisplay) return;
    const attractionId = document.getElementById('bookingAttractionId')?.value;
    const attraction = findBookableItem(attractionId);
    const count = parseInt(visitorCountInput.value, 10) || 1;
    const unitPrice = getResolvedAttractionPrice(attraction);
    const total = unitPrice * count;
    totalPriceDisplay.textContent = total > 0 ? `₱${total}` : '₱0';
  }

  if (visitorCountInput) {
    visitorCountInput.addEventListener('input', recalcTotal);
  }

  // Booking Form Submission & Pass Generation
  const bookingForm = document.getElementById('attractionBookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const attractionId = document.getElementById('bookingAttractionId')?.value;
      const attraction = findBookableItem(attractionId);
      const count = parseInt(visitorCountInput ? visitorCountInput.value : 1, 10);
      const guestName = document.getElementById('visitorName')?.value || 'Guest Tourist';
      const visitDate = document.getElementById('bookingDate')?.value || 'Today';

      // Generate verified pass code
      const randDigits = Math.floor(1000 + Math.random() * 9000);
      const codeSuffix = (attraction.type || 'VIS').substring(0, 3).toUpperCase();
      const passCode = `PASS-${randDigits}-${codeSuffix}`;
      const activeUser = (window.TourismHubStore && (TourismHubStore.getClientAuth() || TourismHubStore.getAdminAuth())) || null;
      const unitPrice = getResolvedAttractionPrice(attraction);
      const targetSlotAttractionId = attraction.parentAttractionId || attraction.id;

      if (window.TourismHubStore) {
        TourismHubStore.addPass({
          code: passCode,
          visitorName: guestName,
          visitorEmail: activeUser?.email || `${guestName.toLowerCase().replace(/\s+/g, '.')}@traveler.ph`,
          bookedByEmail: activeUser?.email || '',
          userId: activeUser?.id || null,
          bookedByUserId: activeUser?.id || null,
          partySize: count,
          attractionId: targetSlotAttractionId,
          attraction: attraction.title,
          slot: attraction.operatingHours || '09:00 AM - 12:00 PM',
          passType: attraction.type === 'event' ? 'Event Tourist Pass' : 'Standard Tourist Pass',
          status: 'valid',
          amount: `₱${unitPrice * count}.00`,
          validDate: visitDate
        });
      }

      closeModal('bookingModal');
      showToast(`Pass Generated! Ref: ${passCode} saved for ${attraction.title}. Ready for QR check-in!`);

      // Refresh tickets, capacity, and notifications
      renderMyTickets();
      renderCapacityModal();
      renderNotifications();
    });
  }

  // Open "My Tickets" Modal
  window.openTicketsModal = function () {
    renderMyTickets();
    ticketsModal?.classList.add('active');
  };

  // Open "Notifications" Modal
  window.openNotificationsModal = function () {
    renderNotifications();
    notificationsModal?.classList.add('active');
  };

  // Open "Capacity" Modal
  window.openCapacityModal = function () {
    renderCapacityModal();
    capacityModal?.classList.add('active');
  };

  // CTA Newsletter / Promo Form
  const ctaForm = document.getElementById('ctaNewsletterForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = ctaForm.querySelector('.cta-email-input');
      const email = emailInput ? emailInput.value : '';
      if (email) {
        showToast(`Promo code "EXPLORE15" sent to ${email}!`);
        ctaForm.reset();
      }
    });
  }

  // --- 10. Toast Notification System ---
  let toastTimeout;
  window.showToast = function (message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add('active');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 4500);
  };

  // --- 11. Collapsible Side Navigation Bar Logic ---
  // Managed by js/sidebar.js to avoid duplicate event listeners across pages

  // Modal Handlers for Sidebar Features
  window.openScannerModal = function () {
    document.getElementById('qrScannerModal')?.classList.add('active');
  };

  if (!window.openAnalyticsModal) window.openAnalyticsModal = function () {
    document.getElementById('analyticsModal')?.classList.add('active');
  };

  if (!window.openSettingsModal) window.openSettingsModal = function () {
    showToast('Settings & preferences opened.');
  };

  // --- 13. Profile Navigation & User Profile Header Synchronization ---
  // Managed by js/profile-dropdown.js for unified navbar dropdown menu behavior

  window.switchDropdownTab = function (tabName) {
    const tabPasses = document.getElementById('dropdownTabPasses');
    const tabDetails = document.getElementById('dropdownTabDetails');
    const btnPasses = document.getElementById('tabBtnPasses');
    const btnDetails = document.getElementById('tabBtnDetails');

    if (tabName === 'passes') {
      tabPasses?.classList.add('active');
      tabDetails?.classList.remove('active');
      btnPasses?.classList.add('active');
      btnDetails?.classList.remove('active');
    } else {
      tabPasses?.classList.remove('active');
      tabDetails?.classList.add('active');
      btnPasses?.classList.remove('active');
      btnDetails?.classList.add('active');
    }
  };

  window.handleSignOut = function () {
    if (window.TourismHubStore) {
      TourismHubStore.clientLogout();
      TourismHubStore.adminLogout();
    }
    showToast('Signed out successfully. Returning to sign in gateway...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 450);
  };

  // Close dropdown on clicking outside
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('userProfileWrapper');
    const dropdown = document.getElementById('userProfileDropdown');
    if (dropdown && dropdown.classList.contains('active')) {
      if (!wrapper || !wrapper.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    }
  });

  function renderProfileDropdownContent() {
    if (!window.TourismHubStore) return;
    const clientAuth = TourismHubStore.getClientAuth ? TourismHubStore.getClientAuth() : null;
    const adminAuth = TourismHubStore.getAdminAuth ? TourismHubStore.getAdminAuth() : null;
    const activeUser = adminAuth || clientAuth;

    if (!activeUser) return;

    // Header info
    const nameEl = document.getElementById('dropdownUserName');
    const emailEl = document.getElementById('dropdownUserEmail');
    const avatarEl = document.getElementById('dropdownAvatar');

    if (nameEl) nameEl.textContent = activeUser.name;
    if (emailEl) emailEl.textContent = activeUser.email;
    if (avatarEl && activeUser.avatar) avatarEl.src = activeUser.avatar;

    // Compiled QR Passes list (only passes booked by the active user)
    const passes = typeof TourismHubStore.getUserPasses === 'function'
      ? TourismHubStore.getUserPasses(activeUser)
      : [];
    const passesList = document.getElementById('dropdownPassesList');
    const passesCountEl = document.getElementById('dropdownPassesCount');

    if (passesCountEl) passesCountEl.textContent = passes.length;

    if (passesList) {
      if (passes.length === 0) {
        passesList.innerHTML = `
          <div style="text-align: center; padding: 1.5rem 0.5rem; color: var(--text-muted);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin: 0 auto 0.5rem; opacity: 0.6;"><path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/></svg>
            <div style="font-size: 0.84rem; font-weight: 700; color: var(--text-main);">No Active Passes Yet</div>
            <div style="font-size: 0.74rem; margin-top: 2px;">Reserve attraction slots below to view your QR passes here.</div>
          </div>
        `;
      } else {
        passesList.innerHTML = passes.map(pass => `
          <div class="dropdown-pass-card">
            <div class="dropdown-pass-header">
              <span class="dropdown-pass-title">${pass.attraction || 'Attraction Pass'}</span>
              <span class="dropdown-pass-badge">${(pass.status || 'valid').toUpperCase()}</span>
            </div>
            <div class="dropdown-pass-body">
              <div class="dropdown-pass-qr" style="background: #ffffff; padding: 4px; border-radius: 6px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(pass.code)}" alt="QR ${pass.code}" width="46" height="46" style="display: block;" />
              </div>
              <div class="dropdown-pass-meta">
                <div>Ref: <strong>${pass.code}</strong></div>
                <div>Date: ${pass.validDate || 'Today'}</div>
                <div>Slot: ${pass.slot || 'Standard Access'}</div>
                <div>Party: ${pass.partySize || 1} Person(s)</div>
              </div>
            </div>
          </div>
        `).join('') + `
          <button type="button" class="dropdown-action-btn" onclick="openTicketsModal(); document.getElementById('userProfileDropdown')?.classList.remove('active');">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Open Full Pass Viewer</span>
          </button>
        `;
      }
    }

    // Account details tab
    const detailsEl = document.getElementById('dropdownAccountDetails');
    if (detailsEl) {
      detailsEl.innerHTML = `
        <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 8px; padding: 0.85rem; margin-bottom: 0.5rem;">
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.4rem;">Session Information</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
            <span style="color: var(--text-muted);">Country:</span>
            <span>${activeUser.country || 'Philippines'}</span>
          </div>
          ${activeUser.phone ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
            <span style="color: var(--text-muted);">Contact:</span>
            <span>${activeUser.phone}</span>
          </div>` : ''}
          ${adminAuth && activeUser.department ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
            <span style="color: var(--text-muted);">Dept:</span>
            <span style="text-align: right; max-width: 60%;">${activeUser.department}</span>
          </div>` : ''}
        </div>
        ${adminAuth ? `
        <button type="button" class="dropdown-action-btn" style="color: #0284c7; border-color: #bae6fd; background: #f0f9ff;" onclick="location.href='admin.html'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>Open Operator Admin Dashboard</span>
        </button>` : ''}
      `;
    }
  }

  function syncUserProfileHeader() {
    const profileBtn = document.getElementById('userProfileBtn');
    const navAvatar = document.getElementById('userNavAvatar') || profileBtn?.querySelector('.portal-avatar-img');
    const navName = profileBtn?.querySelector('.portal-user-name');
    const authLink = document.getElementById('navSignInLink');
    if (!window.TourismHubStore) return;

    const clientAuth = TourismHubStore.getClientAuth ? TourismHubStore.getClientAuth() : null;
    const adminAuth = TourismHubStore.getAdminAuth ? TourismHubStore.getAdminAuth() : null;
    const activeUser = adminAuth || clientAuth;

    if (activeUser) {
      // 1. Hide Sign In button completely when signed in
      if (authLink) {
        authLink.style.display = 'none';
      }

      // 2. Configure Profile Button with Avatar & Name
      if (navAvatar) {
        navAvatar.src = typeof TourismHubStore.getUserAvatar === 'function'
          ? TourismHubStore.getUserAvatar(activeUser)
          : (activeUser.avatar || '');
      }
      if (navName) {
        navName.textContent = activeUser.name || (adminAuth ? 'Operator' : 'Tourist');
      }
      if (profileBtn) {
        profileBtn.style.display = 'flex';
        profileBtn.style.cursor = 'pointer';
        profileBtn.title = 'Account & Profile Menu';
      }
    } else {
      // Show Sign In button when not signed in
      if (authLink) {
        authLink.style.display = 'inline-flex';
        authLink.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg><span>Sign In</span>`;
        authLink.href = 'login.html';
      }
      // Hide tourist name and profile icon completely when exploring as guest
      if (profileBtn) {
        profileBtn.style.display = 'none';
      }
    }
  }

  // --- 13B. Interactive FAQ Accordion ---
  function initFaqAccordion() {
    const faqButtons = document.querySelectorAll('.faq-question-btn');
    faqButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const item = btn.closest('.faq-item');
        if (!item) return;
        const isOpen = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(otherItem => {
          otherItem.classList.remove('active');
          const otherBtn = otherItem.querySelector('.faq-question-btn');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
  initFaqAccordion();

  // --- 14. Real-Time Cross-Tab Synchronization Listener ---
  if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
    TourismHubStore.onSync((key) => {
      syncUserProfileHeader();
      function bindCarouselSwipe(el, onNext, onPrev) {
    if (!el || el.dataset.swipeBound === 'true') return;
    el.dataset.swipeBound = 'true';
    el.style.cursor = 'grab';
    let startX = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a, input, select')) return;
      startX = e.clientX;
      el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      el.style.cursor = 'grab';
      if (Math.abs(dx) >= 40) {
        if (dx < 0) onNext();
        else onPrev();
      }
    });
    el.addEventListener('pointerleave', () => {
      startX = null;
      el.style.cursor = 'grab';
    });
  }

  bindCarouselSwipe(document.getElementById('hero'), () => window.changeHeroLocationSlide(1), () => window.changeHeroLocationSlide(-1));
  bindCarouselSwipe(document.getElementById('featuredEvents'), () => window.changeEventBannerSlide && window.changeEventBannerSlide(1), () => window.changeEventBannerSlide && window.changeEventBannerSlide(-1));

  renderHeroLocationsCarousel();
      renderAttractions();
      renderFeaturedEvents();
      renderNotifications();
      renderCapacityModal();
      renderMyTickets();

      if (key === 'tourismhub_announcements_v1' || key === 'tourismhub_temp_announcements_v1') {
        const announcements = TourismHubStore.getAnnouncements();
        if (announcements.length > 0) {
          showToast(`Operator Alert: "${announcements[0].title}"`);
        }
      } else if (key === 'tourismhub_catalog_v1' || key === 'tourismhub_temp_catalog_v1') {
        showToast('Attraction catalog updated by operator.');
      }
    });
  }

  // Live Supabase sync listener
  window.addEventListener('supabaseSyncComplete', () => {
    syncUserProfileHeader();
    function bindCarouselSwipe(el, onNext, onPrev) {
    if (!el || el.dataset.swipeBound === 'true') return;
    el.dataset.swipeBound = 'true';
    el.style.cursor = 'grab';
    let startX = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a, input, select')) return;
      startX = e.clientX;
      el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      el.style.cursor = 'grab';
      if (Math.abs(dx) >= 40) {
        if (dx < 0) onNext();
        else onPrev();
      }
    });
    el.addEventListener('pointerleave', () => {
      startX = null;
      el.style.cursor = 'grab';
    });
  }

  bindCarouselSwipe(document.getElementById('hero'), () => window.changeHeroLocationSlide(1), () => window.changeHeroLocationSlide(-1));
  bindCarouselSwipe(document.getElementById('featuredEvents'), () => window.changeEventBannerSlide && window.changeEventBannerSlide(1), () => window.changeEventBannerSlide && window.changeEventBannerSlide(-1));

  renderHeroLocationsCarousel();
    renderAttractions();
    renderFeaturedEvents();
    renderNotifications();
  });

  // --- 15. Initial Render ---
  syncUserProfileHeader();
  function bindCarouselSwipe(el, onNext, onPrev) {
    if (!el || el.dataset.swipeBound === 'true') return;
    el.dataset.swipeBound = 'true';
    el.style.cursor = 'grab';
    let startX = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a, input, select')) return;
      startX = e.clientX;
      el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      el.style.cursor = 'grab';
      if (Math.abs(dx) >= 40) {
        if (dx < 0) onNext();
        else onPrev();
      }
    });
    el.addEventListener('pointerleave', () => {
      startX = null;
      el.style.cursor = 'grab';
    });
  }

  bindCarouselSwipe(document.getElementById('hero'), () => window.changeHeroLocationSlide(1), () => window.changeHeroLocationSlide(-1));
  bindCarouselSwipe(document.getElementById('featuredEvents'), () => window.changeEventBannerSlide && window.changeEventBannerSlide(1), () => window.changeEventBannerSlide && window.changeEventBannerSlide(-1));

  renderHeroLocationsCarousel();
  renderAttractions();
  renderFeaturedEvents();
  renderNotifications();
  renderCapacityModal();
  renderMyTickets();

});
