/**
 * TourismHub - Attraction & Event Booking System (Client Portal)
 * Synchronized with Operator Admin Dashboard via TourismHubStore
 */

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
        rating: '4.8',
        reviews: '1.2k',
        price: 15,
        priceLabel: 'Free / Guided $15',
        image: 'assets/rizal-monument.jpg',
        badge: 'Iconic Landmark',
        description: 'The monumental memorial in Luneta Park honoring Dr. José Rizal, national hero of the Philippines.'
      },
      {
        id: 'white-beach-boracay',
        title: 'White Beach Eco-Tourism Reserve',
        category: 'Tourist Spot',
        type: 'beach',
        rating: '4.7',
        reviews: '980',
        price: 25,
        priceLabel: 'Day Pass $25',
        image: 'assets/white-beach.jpg',
        badge: 'Tropical Haven',
        description: 'Pristine powdery white sand, azure waters, and vibrant island activities with legendary sunsets.'
      },
      {
        id: 'pahiyas-festival',
        title: 'Pahiyas Harvest Festival',
        category: 'Festival',
        type: 'festival',
        rating: '4.9',
        reviews: '850',
        price: 35,
        priceLabel: 'Event Access $35',
        image: 'assets/pahiyas-festival.jpg',
        badge: 'Annual Celebration',
        description: 'A colorful harvest festival in Lucban featuring houses decorated with vibrant kiping rice wafers and fruits.'
      }
    ];

  // User Wishlist
  const savedAttractions = new Set();

  // --- 2. DOM Elements ---
  const attractionsGrid = document.getElementById('attractionsGrid');
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

    let filtered = attractionsData.filter(item => {
      // Tab filter
      if (currentFilter !== 'all' && item.type !== currentFilter && item.category?.toLowerCase() !== currentFilter.toLowerCase()) {
        return false;
      }
      // Dropdown category filter
      if (dropdownCat !== 'all' && item.type !== dropdownCat) {
        return false;
      }
      // Text search
      if (searchTerm) {
        const matchesName = item.title?.toLowerCase().includes(searchTerm);
        const matchesCat = item.category?.toLowerCase().includes(searchTerm);
        const matchesDesc = item.description?.toLowerCase().includes(searchTerm);
        return matchesName || matchesCat || matchesDesc;
      }
      return true;
    });

    // Limit initial display unless expanded
    const displayList = showAll ? filtered : filtered.slice(0, 3);

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
        });
      }
      return;
    }

    attractionsGrid.innerHTML = displayList.map(item => `
      <article class="attraction-card" data-id="${item.id}">
        <div class="card-media-wrapper">
          <img src="${item.image || 'assets/hero-banner.jpg'}" alt="${item.title}" class="card-image" loading="lazy">
          <span class="card-badge-floating">${item.badge || 'Featured'}</span>
          <button class="card-wishlist-btn ${savedAttractions.has(item.id) ? 'saved' : ''}" 
                  aria-label="Save ${item.title}" 
                  onclick="toggleWishlist('${item.id}', '${item.title}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${savedAttractions.has(item.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${item.title}</h3>
          <p class="card-subtitle">${item.category}</p>
          <div class="card-meta-row">
            <div class="card-rating">
              <svg class="star-icon" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${item.rating || '4.8'}</span>
              <span class="rating-count">(${item.reviews || 'New'})</span>
            </div>
            <div class="card-price-cta">
              <button class="btn-book-card" onclick="openBookingModal('${item.id}')">Book Pass</button>
            </div>
          </div>
        </div>
      </article>
    `).join('');
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
    });
  }

  if (searchFilter) {
    searchFilter.addEventListener('change', () => {
      renderAttractions();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      renderAttractions();
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

  if (seeAllBtn) {
    seeAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showAll = !showAll;
      seeAllBtn.textContent = showAll ? 'Show Less <' : 'See All >';
      renderAttractions();
    });
  }

  // Quick Action Buttons (Under Hero)
  window.filterByQuickAction = function (type) {
    if (type === 'attractions') {
      currentFilter = 'all';
      updateActiveTab('all');
      renderAttractions();
      document.getElementById('featuredAttractions')?.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'events') {
      currentFilter = 'festival';
      updateActiveTab('festival');
      renderAttractions();
      document.getElementById('featuredAttractions')?.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'tickets') {
      openTicketsModal();
    } else if (type === 'notifications') {
      openNotificationsModal();
    }
  };

  // --- 5. Wishlist Toggle ---
  window.toggleWishlist = function (id, name) {
    if (savedAttractions.has(id)) {
      savedAttractions.delete(id);
      showToast(`Removed "${name}" from your saved list`);
    } else {
      savedAttractions.add(id);
      showToast(`Added "${name}" to your wishlist!`);
    }
    renderAttractions();
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

    notifBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${announcements.map(a => {
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

  // --- 8. Dynamic "My Digital Passes" Renderer ---
  function renderMyTickets() {
    const ticketsBody = document.getElementById('myTicketsModalBody');
    if (!ticketsBody || !window.TourismHubStore) return;
    const passes = Object.values(TourismHubStore.getPasses());

    if (passes.length === 0) {
      ticketsBody.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <p>No active digital passes found. Book an attraction pass to generate a QR pass!</p>
        </div>
      `;
      return;
    }

    ticketsBody.innerHTML = passes.map(pass => `
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
          <svg width="70" height="70" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v2h-4v-2zm-4 0h2v4h-2v-4zm2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm-6 2h4v2h-4v-2z"/>
          </svg>
          <span style="font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; color: var(--text-muted);">${pass.code}</span>
        </div>
      </div>
    `).join('') + `
      <button onclick="showToast('Pass added to Google / Apple Wallet!'); closeModal('ticketsModal')" style="width: 100%; padding: 0.85rem; background: var(--bg-subtle); color: var(--text-main); font-weight: 700; border-radius: var(--radius-full); border: 1px solid var(--border);">
        Add to Apple Wallet / Google Pay
      </button>
    `;
  }

  // --- 9. Modals Logic (Booking, Tickets, Notifications) ---
  window.openBookingModal = function (attractionId) {
    if (window.TourismHubStore) {
      attractionsData = TourismHubStore.getCatalog();
    }
    const attraction = attractionsData.find(a => a.id === attractionId) || attractionsData[0];
    const modalTitle = document.getElementById('bookingModalTitle');
    const modalImg = document.getElementById('bookingModalImg');
    const modalPrice = document.getElementById('bookingModalPrice');
    const bookingAttractionInput = document.getElementById('bookingAttractionId');

    if (modalTitle) modalTitle.textContent = `Reserve Pass: ${attraction.title}`;
    if (modalImg) modalImg.src = attraction.image || 'assets/hero-banner.jpg';
    if (modalPrice) modalPrice.textContent = `$${attraction.price || 20}`;
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

  function recalcTotal() {
    if (!visitorCountInput || !totalPriceDisplay) return;
    const attractionId = document.getElementById('bookingAttractionId')?.value;
    const attraction = (window.TourismHubStore ? TourismHubStore.getCatalog() : attractionsData).find(a => a.id === attractionId) || attractionsData[0];
    const count = parseInt(visitorCountInput.value, 10) || 1;
    const unitPrice = attraction.price || 20;
    const total = unitPrice * count;
    totalPriceDisplay.textContent = `$${total}`;
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
      const attraction = (window.TourismHubStore ? TourismHubStore.getCatalog() : attractionsData).find(a => a.id === attractionId) || attractionsData[0];
      const count = parseInt(visitorCountInput ? visitorCountInput.value : 1, 10);
      const guestName = document.getElementById('visitorName')?.value || 'Guest Tourist';
      const visitDate = document.getElementById('bookingDate')?.value || 'Today';

      // Generate verified pass code
      const randDigits = Math.floor(1000 + Math.random() * 9000);
      const codeSuffix = (attraction.type || 'VIS').substring(0, 3).toUpperCase();
      const passCode = `PASS-${randDigits}-${codeSuffix}`;

      if (window.TourismHubStore) {
        TourismHubStore.addPass({
          code: passCode,
          visitorName: guestName,
          visitorEmail: `${guestName.toLowerCase().replace(/\s+/g, '.')}@traveler.ph`,
          partySize: count,
          attractionId: attraction.id,
          attraction: attraction.title,
          slot: '09:00 AM - 12:00 PM',
          passType: 'Standard Tourist Pass',
          status: 'valid',
          amount: `$${(attraction.price || 20) * count}.00`,
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

  window.openAnalyticsModal = function () {
    document.getElementById('analyticsModal')?.classList.add('active');
  };

  window.openSettingsModal = function () {
    showToast('Settings & preferences opened.');
  };

  // --- 12. Real-Time Cross-Tab Synchronization Listener ---
  if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
    TourismHubStore.onSync((key) => {
      renderAttractions();
      renderNotifications();
      renderCapacityModal();
      renderMyTickets();

      if (key === 'tourismhub_announcements_v1') {
        const announcements = TourismHubStore.getAnnouncements();
        if (announcements.length > 0) {
          showToast(`Operator Alert: "${announcements[0].title}"`);
        }
      } else if (key === 'tourismhub_catalog_v1') {
        showToast('Attraction catalog updated by operator.');
      }
    });
  }

  // --- 13. Initial Render ---
  renderAttractions();
  renderNotifications();
  renderCapacityModal();
  renderMyTickets();

});
