/**
 * TourismHub - Attraction & Event Booking System
 * Dynamic Interactive Functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Data Store for Attractions ---
  const attractionsData = [
    {
      id: 'rizal-monument',
      title: 'Rizal Monument',
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
      id: 'white-beach',
      title: 'White Beach',
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
      title: 'Pahiyas Festival',
      category: 'Festival',
      type: 'festival',
      rating: '4.9',
      reviews: '850',
      price: 35,
      priceLabel: 'Event Access $35',
      image: 'assets/pahiyas-festival.jpg',
      badge: 'Annual Celebration',
      description: 'A colorful harvest festival in Lucban featuring houses decorated with vibrant kiping rice wafers and fruits.'
    },
    {
      id: 'intramuros-tour',
      title: 'Intramuros Walled City',
      category: 'Historical Site',
      type: 'historical',
      rating: '4.8',
      reviews: '2.1k',
      price: 20,
      priceLabel: 'Pass from $20',
      image: 'assets/rizal-monument.jpg',
      badge: 'UNESCO Heritage',
      description: 'Centuries of Spanish colonial history, stone fortresses, cobblestone roads, and timeless plazas.'
    },
    {
      id: 'el-nido-lagoon',
      title: 'Big Lagoon El Nido',
      category: 'Tourist Spot',
      type: 'beach',
      rating: '4.9',
      reviews: '3.4k',
      price: 45,
      priceLabel: 'Tour Pass $45',
      image: 'assets/hero-banner.jpg',
      badge: 'World Wonder',
      description: 'Emerald waters surrounded by towering limestone karsts, perfect for kayaking and snorkeling.'
    },
    {
      id: 'sinulog-festival',
      title: 'Sinulog Grand Mardi Gras',
      category: 'Festival',
      type: 'festival',
      rating: '4.9',
      reviews: '1.5k',
      price: 30,
      priceLabel: 'Grandstand $30',
      image: 'assets/pahiyas-festival.jpg',
      badge: 'Cultural Fiesta',
      description: 'Grandest religious and cultural dance celebration with rhythmic drumbeats and colorful costumes.'
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
  const toast = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // Sticky Header Effect
  const siteHeader = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  });

  // --- 3. Render Attractions ---
  let showAll = false;
  let currentFilter = 'all';

  function renderAttractions() {
    if (!attractionsGrid) return;

    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const dropdownCat = searchFilter ? searchFilter.value : 'all';

    let filtered = attractionsData.filter(item => {
      // Tab filter
      if (currentFilter !== 'all' && item.type !== currentFilter && item.category.toLowerCase() !== currentFilter.toLowerCase()) {
        return false;
      }
      // Dropdown category filter
      if (dropdownCat !== 'all' && item.type !== dropdownCat) {
        return false;
      }
      // Text search
      if (searchTerm) {
        const matchesName = item.title.toLowerCase().includes(searchTerm);
        const matchesCat = item.category.toLowerCase().includes(searchTerm);
        const matchesDesc = item.description.toLowerCase().includes(searchTerm);
        return matchesName || matchesCat || matchesDesc;
      }
      return true;
    });

    // If not showing all, limit to 3 like the screenshot
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
          <img src="${item.image}" alt="${item.title}" class="card-image" loading="lazy">
          <span class="card-badge-floating">${item.badge}</span>
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
              <span>${item.rating}</span>
              <span class="rating-count">(${item.reviews})</span>
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
  window.filterByQuickAction = function(type) {
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
  window.toggleWishlist = function(id, name) {
    if (savedAttractions.has(id)) {
      savedAttractions.delete(id);
      showToast(`Removed "${name}" from your saved list`);
    } else {
      savedAttractions.add(id);
      showToast(`Saved "${name}" to your favorites!`);
    }
    renderAttractions();
  };



  // --- 7. FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question-btn');
    questionBtn?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      // Close other accordions
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // --- 8. Modals Logic (Booking, Tickets, Notifications) ---
  window.openBookingModal = function(attractionId) {
    const attraction = attractionsData.find(a => a.id === attractionId) || attractionsData[0];
    const modalTitle = document.getElementById('bookingModalTitle');
    const modalImg = document.getElementById('bookingModalImg');
    const modalPrice = document.getElementById('bookingModalPrice');
    const bookingAttractionInput = document.getElementById('bookingAttractionId');

    if (modalTitle) modalTitle.textContent = `Reserve Pass: ${attraction.title}`;
    if (modalImg) modalImg.src = attraction.image;
    if (modalPrice) modalPrice.textContent = `$${attraction.price}`;
    if (bookingAttractionInput) bookingAttractionInput.value = attraction.id;

    recalcTotal();
    bookingModal?.classList.add('active');
  };

  window.closeModal = function(modalId) {
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
    const attraction = attractionsData.find(a => a.id === attractionId) || attractionsData[0];
    const count = parseInt(visitorCountInput.value) || 1;
    const total = attraction.price * count;
    totalPriceDisplay.textContent = `$${total}`;
  }

  if (visitorCountInput) {
    visitorCountInput.addEventListener('input', recalcTotal);
  }

  // Booking Form Submission
  const bookingForm = document.getElementById('attractionBookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const attractionId = document.getElementById('bookingAttractionId')?.value;
      const attraction = attractionsData.find(a => a.id === attractionId) || attractionsData[0];
      const count = visitorCountInput ? visitorCountInput.value : 1;
      
      closeModal('bookingModal');
      showToast(`Success! ${count} pass(es) confirmed for ${attraction.title}. QR ticket sent!`);
      // Update badge count
      const badge = document.querySelector('.badge-count');
      if (badge) {
        badge.textContent = parseInt(badge.textContent || 0) + 1;
      }
    });
  }

  // Open "My Tickets" Modal
  window.openTicketsModal = function() {
    ticketsModal?.classList.add('active');
  };

  // Open "Notifications" Modal
  window.openNotificationsModal = function() {
    notificationsModal?.classList.add('active');
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

  // --- 9. Toast Notification System ---
  let toastTimeout;
  window.showToast = function(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 4000);
  };

  // --- 10. Collapsible Side Navigation Bar Logic ---
  const sideNav = document.getElementById('sideNav');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const sidebarLinks = document.querySelectorAll('.sidebar-menu-link');

  function openSidebar() {
    sideNav?.classList.add('active');
    sidebarBackdrop?.classList.add('active');
  }

  function closeSidebar() {
    sideNav?.classList.remove('active');
    sidebarBackdrop?.classList.remove('active');
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sideNav?.classList.contains('active')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  // Collapse / Expand to Icon-Only Rail
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sideNav?.classList.toggle('collapsed');
      const isCollapsed = sideNav?.classList.contains('collapsed');
      const icon = sidebarCollapseBtn.querySelector('svg');
      if (icon) {
        icon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
      }
      showToast(isCollapsed ? 'Sidebar collapsed to icon rail' : 'Sidebar expanded');
    });
  }

  // Click logo to expand if collapsed
  const sidebarLogo = document.querySelector('.sidebar-logo');
  if (sidebarLogo) {
    sidebarLogo.addEventListener('click', (e) => {
      if (sideNav?.classList.contains('collapsed')) {
        e.preventDefault();
        sideNav?.classList.remove('collapsed');
        showToast('Sidebar expanded');
      }
    });
  }

  // Sidebar link active highlight & navigation
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      if (window.innerWidth < 1024 && link.getAttribute('href')?.startsWith('#')) {
        closeSidebar();
      }
    });
  });

  // Modal Handlers for Sidebar Features
  window.openCapacityModal = function() {
    document.getElementById('capacityModal')?.classList.add('active');
  };

  window.openScannerModal = function() {
    document.getElementById('qrScannerModal')?.classList.add('active');
  };

  window.openAnalyticsModal = function() {
    document.getElementById('analyticsModal')?.classList.add('active');
  };

  window.openSettingsModal = function() {
    showToast('Settings & preferences opened.');
  };

  // --- 11. Initial Render ---
  renderAttractions();
});

