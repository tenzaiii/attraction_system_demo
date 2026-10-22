/**
 * TourismHub - Centralized Attraction & Operator Admin Dashboard
 * Core Application Logic, State Management & Event Handling
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  //  1. Central Data Store
  // ==========================================================================

  // Attraction & Event Catalog Data Store (Synchronized with TourismHubStore)
  let catalogData = (window.TourismHubStore && typeof TourismHubStore.getCatalog === 'function')
    ? TourismHubStore.getCatalog()
    : [
    {
      id: 'rizal-monument',
      title: 'Rizal Monument & Luneta Park',
      category: 'Historical Site',
      type: 'historical',
      status: 'active',
      operatingHours: '06:00 AM - 09:00 PM',
      admission: 'Free Entry / Guided $15',
      price: 15,
      capacityPerSlot: 150,
      image: 'assets/rizal-monument.jpg',
      location: 'Manila, Metro Manila',
      description: 'The monumental memorial in Luneta Park honoring Dr. José Rizal, national hero of the Philippines with ceremonial guards.'
    },
    {
      id: 'intramuros-walled-city',
      title: 'Intramuros Walled City Heritage',
      category: 'Historical Site',
      type: 'historical',
      status: 'active',
      operatingHours: '08:00 AM - 06:00 PM',
      admission: 'Heritage Pass $20',
      price: 20,
      capacityPerSlot: 120,
      image: 'assets/rizal-monument.jpg',
      location: 'Intramuros, Manila',
      description: 'Centuries of Spanish colonial history featuring stone ramparts, Fort Santiago, cobblestone roadways, and museum plazas.'
    },
    {
      id: 'white-beach-boracay',
      title: 'White Beach Eco-Tourism Reserve',
      category: 'Tourist Spot',
      type: 'beach',
      status: 'active',
      operatingHours: '05:30 AM - 10:00 PM',
      admission: 'Environmental Pass $25',
      price: 25,
      capacityPerSlot: 200,
      image: 'assets/white-beach.jpg',
      location: 'Boracay Island, Aklan',
      description: 'Powdery sugar-white sand, turquoise lagoon waters, and curated marine activities with regulated daily eco-caps.'
    },
    {
      id: 'el-nido-big-lagoon',
      title: 'Big Lagoon Marine Sanctuary',
      category: 'Tourist Spot',
      type: 'beach',
      status: 'maintenance',
      operatingHours: '07:00 AM - 04:00 PM',
      admission: 'Eco-Tour Pass $45',
      price: 45,
      capacityPerSlot: 80,
      image: 'assets/hero-banner.jpg',
      location: 'El Nido, Palawan',
      description: 'Emerald waters surrounded by soaring limestone karst cliffs with strict kayak slot rationing to prevent reef degradation.'
    },
    {
      id: 'pahiyas-festival',
      title: 'Pahiyas Harvest Celebration',
      category: 'Festival',
      type: 'festival',
      status: 'active',
      operatingHours: '07:00 AM - 08:00 PM',
      admission: 'Fiesta Access $35',
      price: 35,
      capacityPerSlot: 300,
      image: 'assets/pahiyas-festival.jpg',
      location: 'Lucban, Quezon',
      description: 'Vibrant annual harvest fiesta featuring house facades decorated with colorful kiping rice wafers, fruits, and crafts.'
    },
    {
      id: 'sinulog-grand-mardi-gras',
      title: 'Sinulog Cultural Grandstand',
      category: 'Festival',
      type: 'festival',
      status: 'active',
      operatingHours: '08:00 AM - 09:00 PM',
      admission: 'Grandstand Pass $30',
      price: 30,
      capacityPerSlot: 250,
      image: 'assets/pahiyas-festival.jpg',
      location: 'Cebu City, Central Visayas',
      description: 'The Philippines grandest cultural and dance celebration with rhythmic drumbeats, vivid costumes, and pageantry.'
    }
  ];

  // Capacity & Schedule Time-Slots Store (Mapped by attraction ID)
  let capacityScheduleData = (window.TourismHubStore && typeof TourismHubStore.getCapacityData === 'function')
    ? TourismHubStore.getCapacityData()
    : {
    'rizal-monument': [
      { id: 'rm-1', time: '08:00 AM - 10:00 AM', booked: 45, max: 150, status: 'open' },
      { id: 'rm-2', time: '10:00 AM - 12:00 PM', booked: 132, max: 150, status: 'near-full' },
      { id: 'rm-3', time: '01:00 PM - 03:00 PM', booked: 150, max: 150, status: 'sold-out' },
      { id: 'rm-4', time: '03:00 PM - 05:00 PM', booked: 118, max: 150, status: 'near-full' },
      { id: 'rm-5', time: '05:00 PM - 07:00 PM', booked: 64, max: 150, status: 'open' }
    ],
    'intramuros-walled-city': [
      { id: 'in-1', time: '08:30 AM - 10:30 AM', booked: 70, max: 120, status: 'open' },
      { id: 'in-2', time: '10:30 AM - 12:30 PM', booked: 114, max: 120, status: 'near-full' },
      { id: 'in-3', time: '01:30 PM - 03:30 PM', booked: 120, max: 120, status: 'sold-out' },
      { id: 'in-4', time: '03:30 PM - 05:30 PM', booked: 85, max: 120, status: 'open' }
    ],
    'white-beach-boracay': [
      { id: 'wb-1', time: '06:00 AM - 09:00 AM', booked: 88, max: 200, status: 'open' },
      { id: 'wb-2', time: '09:00 AM - 12:00 PM', booked: 185, max: 200, status: 'near-full' },
      { id: 'wb-3', time: '01:00 PM - 04:00 PM', booked: 160, max: 200, status: 'open' },
      { id: 'wb-4', time: '04:00 PM - 07:00 PM', booked: 200, max: 200, status: 'sold-out' }
    ],
    'el-nido-big-lagoon': [
      { id: 'en-1', time: '07:30 AM - 10:30 AM', booked: 76, max: 80, status: 'near-full' },
      { id: 'en-2', time: '11:00 AM - 02:00 PM', booked: 80, max: 80, status: 'sold-out' },
      { id: 'en-3', time: '02:30 PM - 05:30 PM', booked: 35, max: 80, status: 'open' }
    ],
    'pahiyas-festival': [
      { id: 'pf-1', time: '08:00 AM - 12:00 PM', booked: 285, max: 300, status: 'near-full' },
      { id: 'pf-2', time: '01:00 PM - 05:00 PM', booked: 300, max: 300, status: 'sold-out' },
      { id: 'pf-3', time: '05:00 PM - 09:00 PM', booked: 190, max: 300, status: 'open' }
    ],
    'sinulog-grand-mardi-gras': [
      { id: 'sg-1', time: '08:00 AM - 12:00 PM', booked: 240, max: 250, status: 'near-full' },
      { id: 'sg-2', time: '01:00 PM - 05:00 PM', booked: 250, max: 250, status: 'sold-out' },
      { id: 'sg-3', time: '05:00 PM - 09:00 PM', booked: 180, max: 250, status: 'open' }
    ]
  };

  // Mock Tourist Pass Database for QR Verification
  const touristPassesDB = {
    'PASS-8842-MNL': {
      code: 'PASS-8842-MNL',
      status: 'valid',
      touristName: 'Maria Santos',
      attraction: 'Rizal Monument & Luneta Park',
      attractionId: 'rizal-monument',
      slot: '10:00 AM - 12:00 PM',
      pax: 3,
      date: 'Today',
      issued: 'Oct 22, 2026'
    },
    'PASS-5120-BCY': {
      code: 'PASS-5120-BCY',
      status: 'valid',
      touristName: 'Alexander Hayes',
      attraction: 'White Beach Eco-Tourism Reserve',
      attractionId: 'white-beach-boracay',
      slot: '09:00 AM - 12:00 PM',
      pax: 2,
      date: 'Today',
      issued: 'Oct 22, 2026'
    },
    'PASS-9912-EXP': {
      code: 'PASS-9912-EXP',
      status: 'expired',
      touristName: 'Chen Wei',
      attraction: 'Intramuros Walled City Heritage',
      attractionId: 'intramuros-walled-city',
      slot: '08:30 AM - 10:30 AM (Expired)',
      pax: 1,
      date: 'Expired Yesterday',
      issued: 'Oct 21, 2026'
    },
    'PASS-3310-USD': {
      code: 'PASS-3310-USD',
      status: 'already-used',
      touristName: 'Sofia Delgado',
      attraction: 'Rizal Monument & Luneta Park',
      attractionId: 'rizal-monument',
      slot: '08:00 AM - 10:00 AM',
      pax: 4,
      date: 'Scanned at 08:14 AM Today',
      issued: 'Oct 22, 2026'
    }
  };

  // Recent Entry Scans Log
  let recentScansList = [
    { time: '10:14 AM', code: 'PASS-8842-MNL', name: 'Maria Santos', attraction: 'Rizal Monument', pax: 3, gate: 'North Turnstile 2', status: 'Approved' },
    { time: '10:08 AM', code: 'PASS-5120-BCY', name: 'Alexander Hayes', attraction: 'White Beach', pax: 2, gate: 'Station 1 Gate A', status: 'Approved' },
    { time: '09:55 AM', code: 'PASS-9912-EXP', name: 'Chen Wei', attraction: 'Intramuros', pax: 1, gate: 'Fort Santiago Express', status: 'Rejected' },
    { time: '09:42 AM', code: 'PASS-4402-PLW', name: 'Liam Henderson', attraction: 'Big Lagoon', pax: 2, gate: 'Dock Gate 3', status: 'Approved' },
    { time: '09:30 AM', code: 'PASS-3310-USD', name: 'Sofia Delgado', attraction: 'Rizal Monument', pax: 4, gate: 'Main Arch Gate', status: 'Rejected' }
  ];

  // Announcements & Dispatch Store (Synchronized with TourismHubStore)
  let announcementsList = (window.TourismHubStore && typeof TourismHubStore.getAnnouncements === 'function')
    ? TourismHubStore.getAnnouncements()
    : [
    {
      id: 'ann-1',
      type: 'weather',
      priority: 'urgent',
      title: 'Gale Warning & High Waves Alert for Palawan Marine Tours',
      text: 'PAGASA has issued a regional marine advisory. Kayak departures at Big Lagoon and Small Lagoon are temporarily suspended until 02:00 PM for passenger safety.',
      target: 'Big Lagoon Marine Sanctuary',
      timestamp: '25 mins ago',
      active: true
    },
    {
      id: 'ann-2',
      type: 'schedule',
      priority: 'normal',
      title: 'Extended Operating Hours for Intramuros Night Walking Tour',
      text: 'Due to high evening demand, gate hours for Fort Santiago and the Plaza Roma ramparts have been extended until 08:30 PM this Saturday.',
      target: 'Intramuros Walled City Heritage',
      timestamp: '2 hours ago',
      active: true
    },
    {
      id: 'ann-3',
      type: 'info',
      priority: 'normal',
      title: 'Pahiyas Festival Route & Traffic Advisory',
      text: 'Designated tourist parking is now active at Lucban Bypass Road. Electric shuttles depart every 10 minutes directly to the town plaza.',
      target: 'Pahiyas Harvest Celebration',
      timestamp: 'Yesterday',
      active: true
    }
  ];

  // ==========================================================================
  //  2. Navigation & Tab Switching
  // ==========================================================================
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('adminPageTitle');
  const pageSubtitle = document.getElementById('adminPageSubtitle');

  const tabMeta = {
    overview: {
      title: 'Overview & Operations Control',
      sub: 'Real-time summary of tourist admissions, active capacities, and alerts.'
    },
    catalog: {
      title: 'Attraction & Event Cataloging',
      sub: 'Manage attraction profiles, operating schedules, descriptions, and media.'
    },
    capacity: {
      title: 'Capacity & Schedule Management',
      sub: 'Monitor time-slot allocations against allowable thresholds to prevent overcrowding.'
    },
    scanner: {
      title: 'QR Tourist Pass Scanner',
      sub: 'Validate digital passes and record attendance logs at attraction turnstiles.'
    },
    analytics: {
      title: 'Admin Analytics Dashboard',
      sub: 'Analyze attendance trends, peak visiting hours, and operator reporting.'
    },
    dispatch: {
      title: 'Announcement & Notification Dispatch',
      sub: 'Broadcast weather advisories, schedule changes, and alerts to tourists.'
    }
  };

  window.switchTab = function(tabId) {
    sidebarLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabId);
    });

    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    if (tabMeta[tabId]) {
      if (pageTitle) pageTitle.textContent = tabMeta[tabId].title;
      if (pageSubtitle) pageSubtitle.textContent = tabMeta[tabId].sub;
    }

    // Refresh specific tab renders
    if (tabId === 'catalog') renderCatalog();
    if (tabId === 'capacity') renderCapacitySlots();
    if (tabId === 'scanner') renderRecentScans();
    if (tabId === 'analytics') renderAnalyticsView();
    if (tabId === 'dispatch') renderAnnouncementsFeed();

    // Close mobile sidebar if open
    document.getElementById('adminSidebar')?.classList.remove('open');
  };

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.dataset.tab;
      if (tabId) switchTab(tabId);
    });
  });

  // Mobile sidebar controls
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  const adminSidebar = document.getElementById('adminSidebar');

  menuToggleBtn?.addEventListener('click', () => {
    adminSidebar?.classList.toggle('open');
  });

  sidebarCloseBtn?.addEventListener('click', () => {
    adminSidebar?.classList.remove('open');
  });

  // ==========================================================================
  //  3. Module 1: Attraction & Event Cataloging
  // ==========================================================================
  const catalogGrid = document.getElementById('catalogGrid');
  const catalogSearchInput = document.getElementById('catalogSearchInput');
  const catalogCategoryFilter = document.getElementById('catalogCategoryFilter');
  const catalogStatusFilter = document.getElementById('catalogStatusFilter');
  const attractionModal = document.getElementById('attractionModal');
  const attractionForm = document.getElementById('attractionForm');

  function renderCatalog() {
    if (!catalogGrid) return;

    const searchTerm = (catalogSearchInput?.value || '').toLowerCase().trim();
    const catVal = catalogCategoryFilter?.value || 'all';
    const statusVal = catalogStatusFilter?.value || 'all';

    const filtered = catalogData.filter(item => {
      const matchSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchTerm) || 
        item.location.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm);
      const matchCat = catVal === 'all' || item.type === catVal;
      const matchStatus = statusVal === 'all' || item.status === statusVal;
      return matchSearch && matchCat && matchStatus;
    });

    if (filtered.length === 0) {
      catalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
          <svg style="width: 44px; height: 44px; color: var(--text-light); margin-bottom: 0.75rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h4 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: 0.35rem;">No attraction or event found</h4>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Try modifying search terms or resetting filters.</p>
        </div>
      `;
      return;
    }

    catalogGrid.innerHTML = filtered.map(item => `
      <article class="catalog-item-card" data-id="${item.id}">
        <div class="catalog-media-header">
          <img src="${item.image}" alt="${item.title}" class="catalog-img" onerror="this.src='assets/hero-banner.jpg'">
          <span class="catalog-status-badge ${item.status}">${item.status}</span>
          <span class="catalog-category-tag">${item.category}</span>
        </div>
        <div class="catalog-card-body">
          <h3 class="catalog-card-title">${item.title}</h3>
          <p class="catalog-card-desc">${item.description}</p>
          <div class="catalog-meta-list">
            <div class="catalog-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${item.operatingHours}</span>
            </div>
            <div class="catalog-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${item.location}</span>
            </div>
            <div class="catalog-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Slot Limit: <strong>${item.capacityPerSlot} visitors</strong></span>
            </div>
          </div>
          <div class="catalog-card-footer">
            <span class="catalog-price">${item.admission}</span>
            <div class="catalog-actions">
              <button class="btn-icon-action" title="Edit Attraction Profile" onclick="openEditAttractionModal('${item.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn-icon-action delete" title="Archive / Delete" onclick="deleteAttraction('${item.id}', '${item.title.replace(/'/g, "\\'")}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </article>
    `).join('');

    // Update attraction options in other modules
    updateAttractionDropdowns();
  }

  // Filter listeners
  catalogSearchInput?.addEventListener('input', renderCatalog);
  catalogCategoryFilter?.addEventListener('change', renderCatalog);
  catalogStatusFilter?.addEventListener('change', renderCatalog);

  // Open modal to add new attraction
  window.openAddAttractionModal = function() {
    attractionForm?.reset();
    document.getElementById('attractionModalId').value = '';
    document.getElementById('attractionModalTitle').textContent = 'Catalog New Attraction / Event';
    attractionModal?.classList.add('active');
  };

  // Open modal to edit existing attraction
  window.openEditAttractionModal = function(id) {
    const item = catalogData.find(a => a.id === id);
    if (!item) return;

    document.getElementById('attractionModalId').value = item.id;
    document.getElementById('attrFormTitle').value = item.title;
    document.getElementById('attrFormCategory').value = item.category;
    document.getElementById('attrFormType').value = item.type;
    document.getElementById('attrFormLocation').value = item.location;
    document.getElementById('attrFormHours').value = item.operatingHours;
    document.getElementById('attrFormPrice').value = item.admission;
    document.getElementById('attrFormCapacity').value = item.capacityPerSlot;
    document.getElementById('attrFormStatus').value = item.status;
    document.getElementById('attrFormDesc').value = item.description;

    document.getElementById('attractionModalTitle').textContent = 'Edit Attraction Profile';
    attractionModal?.classList.add('active');
  };

  // Save / Update attraction
  attractionForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('attractionModalId')?.value;
    const title = document.getElementById('attrFormTitle')?.value;
    const category = document.getElementById('attrFormCategory')?.value;
    const type = document.getElementById('attrFormType')?.value;
    const location = document.getElementById('attrFormLocation')?.value;
    const hours = document.getElementById('attrFormHours')?.value;
    const priceStr = document.getElementById('attrFormPrice')?.value;
    const capacity = parseInt(document.getElementById('attrFormCapacity')?.value) || 100;
    const status = document.getElementById('attrFormStatus')?.value;
    const desc = document.getElementById('attrFormDesc')?.value;

    if (id) {
      // Edit existing
      const updates = {
        title,
        category,
        type,
        location,
        operatingHours: hours,
        admission: priceStr,
        capacityPerSlot: capacity,
        status,
        description: desc
      };
      if (window.TourismHubStore) {
        TourismHubStore.updateAttraction(id, updates);
        catalogData = TourismHubStore.getCatalog();
      } else {
        const item = catalogData.find(a => a.id === id);
        if (item) Object.assign(item, updates);
      }
      showToast(`Updated profile for "${title}"`);
    } else {
      // Create new
      const newId = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const newAttr = {
        id: newId,
        title,
        category,
        type,
        location,
        operatingHours: hours,
        admission: priceStr,
        price: 20,
        capacityPerSlot: capacity,
        status,
        image: 'assets/hero-banner.jpg',
        description: desc
      };

      if (window.TourismHubStore) {
        TourismHubStore.addAttraction(newAttr);
        catalogData = TourismHubStore.getCatalog();
        capacityScheduleData = TourismHubStore.getCapacityData();
      } else {
        catalogData.unshift(newAttr);
        capacityScheduleData[newId] = [
          { id: `${newId}-1`, time: '08:00 AM - 11:00 AM', booked: 0, max: capacity, status: 'open' },
          { id: `${newId}-2`, time: '11:00 AM - 02:00 PM', booked: 0, max: capacity, status: 'open' },
          { id: `${newId}-3`, time: '02:00 PM - 05:00 PM', booked: 0, max: capacity, status: 'open' }
        ];
      }

      showToast(`Successfully cataloged "${title}"`);
    }

    closeModal('attractionModal');
    renderCatalog();
    updateOverviewStats();
  });

  // Delete attraction
  window.deleteAttraction = function(id, name) {
    if (confirm(`Are you sure you want to archive / delete "${name}" from the active catalog?`)) {
      if (window.TourismHubStore) {
        TourismHubStore.deleteAttraction(id);
        catalogData = TourismHubStore.getCatalog();
        capacityScheduleData = TourismHubStore.getCapacityData();
      } else {
        catalogData = catalogData.filter(a => a.id !== id);
        delete capacityScheduleData[id];
      }
      showToast(`Archived "${name}"`);
      renderCatalog();
      updateOverviewStats();
    }
  };

  // Helper to update attraction dropdowns across the system
  function updateAttractionDropdowns() {
    const selectors = [
      document.getElementById('capacityAttractionSelect'),
      document.getElementById('dispatchTargetSelect')
    ];

    selectors.forEach(sel => {
      if (!sel) return;
      const curVal = sel.value;
      const isDispatch = sel.id === 'dispatchTargetSelect';

      let html = isDispatch ? '<option value="all">Broadcast to All Attractions</option>' : '';
      html += catalogData.map(a => `<option value="${a.id}">${a.title}</option>`).join('');
      sel.innerHTML = html;

      if (curVal && catalogData.some(a => a.id === curVal)) {
        sel.value = curVal;
      }
    });
  }

  // ==========================================================================
  //  4. Module 2: Capacity & Schedule Management
  // ==========================================================================
  const capacitySelect = document.getElementById('capacityAttractionSelect');
  const capacitySlotsGrid = document.getElementById('capacitySlotsGrid');

  function renderCapacitySlots() {
    if (!capacitySlotsGrid || !capacitySelect) return;

    const currentAttrId = capacitySelect.value || catalogData[0]?.id;
    const slots = capacityScheduleData[currentAttrId] || [];
    const attrInfo = catalogData.find(a => a.id === currentAttrId);

    if (slots.length === 0) {
      capacitySlotsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
          <p style="color: var(--text-muted);">No active schedule slots configured for this attraction.</p>
          <button class="btn-primary" style="margin-top: 1rem;" onclick="addSlotForAttraction('${currentAttrId}')">+ Create First Slot</button>
        </div>
      `;
      return;
    }

    capacitySlotsGrid.innerHTML = slots.map(slot => {
      const percentage = Math.min(100, Math.round((slot.booked / slot.max) * 100));
      let fillClass = 'normal';
      let statusClass = 'open';
      let statusText = 'Available';

      if (percentage >= 100) {
        fillClass = 'danger';
        statusClass = 'sold-out';
        statusText = 'At Capacity (Full)';
      } else if (percentage >= 80) {
        fillClass = 'warning';
        statusClass = 'near-full';
        statusText = 'Near Capacity (80%+)';
      }

      return `
        <div class="slot-card ${percentage >= 100 ? 'at-capacity' : percentage >= 80 ? 'near-capacity' : ''}">
          <div class="slot-card-header">
            <span class="slot-time">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${slot.time}
            </span>
            <span class="slot-status-pill ${statusClass}">${statusText}</span>
          </div>

          <div class="slot-progress-wrap">
            <div class="slot-capacity-numbers">
              <span>Allocated: <strong class="slot-booked-count">${slot.booked} pax</strong></span>
              <span class="slot-max-limit">Limit: <strong>${slot.max}</strong> (${percentage}%)</span>
            </div>
            <div class="capacity-progress-bar">
              <div class="capacity-progress-fill ${fillClass}" style="width: ${percentage}%;"></div>
            </div>
          </div>

          <div class="slot-card-actions">
            <button class="btn-secondary btn-sm" onclick="adjustSlotCapacity('${currentAttrId}', '${slot.id}', ${slot.booked}, ${slot.max})">
              Adjust Limit
            </button>
            <button class="btn-secondary btn-sm" onclick="simulateWalkIn('${currentAttrId}', '${slot.id}')" title="Simulate entry scan">
              + Add Visitor
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  capacitySelect?.addEventListener('change', renderCapacitySlots);

  // Add new time-slot prompt
  window.addSlotForAttraction = function(attrId) {
    const timeStr = prompt('Enter new slot time (e.g. 05:00 PM - 07:00 PM):');
    if (!timeStr) return;

    const maxLimit = parseInt(prompt('Enter maximum visitor capacity limit for this slot:', '120')) || 120;

    if (!capacityScheduleData[attrId]) capacityScheduleData[attrId] = [];
    capacityScheduleData[attrId].push({
      id: `${attrId}-${Date.now()}`,
      time: timeStr,
      booked: 0,
      max: maxLimit,
      status: 'open'
    });

    showToast(`Added schedule slot "${timeStr}"`);
    renderCapacitySlots();
    updateOverviewStats();
  };

  // Adjust slot maximum limit
  window.adjustSlotCapacity = function(attrId, slotId, currentBooked, currentMax) {
    const newMax = prompt(`Update maximum allowable capacity limit (Current: ${currentMax}, Booked: ${currentBooked}):`, currentMax);
    if (!newMax) return;
    const maxVal = parseInt(newMax);
    if (isNaN(maxVal) || maxVal < currentBooked) {
      alert(`Invalid limit. New limit cannot be less than currently booked visitors (${currentBooked}).`);
      return;
    }

    if (window.TourismHubStore) {
      TourismHubStore.updateSlot(attrId, slotId, { max: maxVal });
      capacityScheduleData = TourismHubStore.getCapacityData();
    } else {
      const slot = capacityScheduleData[attrId]?.find(s => s.id === slotId);
      if (slot) slot.max = maxVal;
    }

    showToast(`Updated capacity threshold to ${maxVal}`);
    renderCapacitySlots();
    updateOverviewStats();
  };

  // Simulate a visitor entry
  window.simulateWalkIn = function(attrId, slotId) {
    const slot = capacityScheduleData[attrId]?.find(s => s.id === slotId);
    if (!slot) return;
    if (slot.booked >= slot.max) {
      alert('Cannot add entry. This time-slot is at maximum allowable capacity to prevent overcrowding.');
      return;
    }

    if (window.TourismHubStore) {
      TourismHubStore.recordSlotWalkIn(attrId, slotId, 1);
      capacityScheduleData = TourismHubStore.getCapacityData();
    } else {
      slot.booked += 1;
    }

    showToast(`Logged visitor entry into slot (${slot.booked}/${slot.max})`);
    renderCapacitySlots();
    updateOverviewStats();
  };

  // ==========================================================================
  //  5. Module 3: QR Tourist Pass Scanning & Entry Validation
  // ==========================================================================
  const scanInput = document.getElementById('scannerManualInput');
  const scanSubmitBtn = document.getElementById('scanSubmitBtn');
  const validationResultCard = document.getElementById('validationResultCard');
  const recentScansTable = document.getElementById('recentScansTable');

  window.runQRScanValidation = function(customCode = null) {
    const code = (customCode || scanInput?.value || '').trim().toUpperCase();
    if (!code) {
      alert('Please enter or scan a valid QR Tourist Pass code.');
      return;
    }

    const allPasses = window.TourismHubStore ? TourismHubStore.getPasses() : touristPassesDB;
    const record = allPasses[code] || touristPassesDB[code];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!record) {
      // Unrecognized pass
      displayValidationUI({
        valid: false,
        title: 'Invalid QR Pass (Unrecognized)',
        code,
        name: 'Unknown Tourist',
        attraction: 'N/A',
        slot: 'Not found in system registry',
        pax: 0,
        statusLabel: 'Pass Not Registered'
      });

      recentScansList.unshift({
        time: timeStr,
        code,
        name: 'Unregistered Pass',
        attraction: 'N/A',
        pax: 0,
        gate: 'Turnstile A1',
        status: 'Rejected'
      });
      renderRecentScans();
      return;
    }

    const displayName = record.touristName || record.visitorName || 'Tourist Guest';
    const displayPax = record.pax || record.partySize || 1;
    const isAlreadyUsed = record.status === 'already-used' || record.status === 'already_used';

    if (record.status === 'valid') {
      if (window.TourismHubStore) {
        TourismHubStore.validatePass(code);
      } else {
        record.status = 'already_used';
      }

      displayValidationUI({
        valid: true,
        title: 'Entry Approved — Valid Tourist Pass',
        code: record.code,
        name: displayName,
        attraction: record.attraction,
        slot: record.slot || 'Current Slot',
        pax: displayPax,
        statusLabel: 'Verified & Admitted'
      });

      // Update capacity slot for that attraction
      if (capacityScheduleData[record.attractionId]) {
        const slot = capacityScheduleData[record.attractionId][0];
        if (slot) slot.booked = Math.min(slot.max, slot.booked + displayPax);
      }

      recentScansList.unshift({
        time: timeStr,
        code: record.code,
        name: displayName,
        attraction: record.attraction,
        pax: displayPax,
        gate: 'Turnstile A1 Express',
        status: 'Approved'
      });

      showToast(`Pass verified! Admitted ${displayPax} pax for ${displayName}.`);

    } else if (record.status === 'expired') {
      displayValidationUI({
        valid: false,
        title: 'Entry Denied — Pass Expired',
        code: record.code,
        name: displayName,
        attraction: record.attraction,
        slot: record.slot || 'Expired Window',
        pax: displayPax,
        statusLabel: 'Reservation Expired'
      });

      recentScansList.unshift({
        time: timeStr,
        code: record.code,
        name: displayName,
        attraction: record.attraction,
        pax: displayPax,
        gate: 'Turnstile A1 Express',
        status: 'Rejected'
      });

    } else if (isAlreadyUsed) {
      displayValidationUI({
        valid: false,
        title: 'Entry Denied — Pass Already Scanned',
        code: record.code,
        name: displayName,
        attraction: record.attraction,
        slot: record.slot || 'Earlier Slot',
        pax: displayPax,
        statusLabel: 'Duplicate Scan Detected'
      });

      recentScansList.unshift({
        time: timeStr,
        code: record.code,
        name: displayName,
        attraction: record.attraction,
        pax: displayPax,
        gate: 'Turnstile A1 Express',
        status: 'Rejected'
      });
    }

    renderRecentScans();
    updateOverviewStats();
  };

  function displayValidationUI(data) {
    if (!validationResultCard) return;

    validationResultCard.className = `validation-card show ${data.valid ? 'valid' : 'invalid'}`;
    validationResultCard.innerHTML = `
      <div class="validation-header">
        <div class="validation-icon">
          ${data.valid ? `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          ` : `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          `}
        </div>
        <div>
          <h3 class="validation-title">${data.title}</h3>
          <span style="font-size: 0.8rem; font-weight: 600; color: ${data.valid ? '#166534' : '#991b1b'};">${data.statusLabel}</span>
        </div>
      </div>
      <div class="validation-details-grid">
        <div class="validation-field">
          <label>Pass Code</label>
          <span>${data.code}</span>
        </div>
        <div class="validation-field">
          <label>Lead Tourist</label>
          <span>${data.name}</span>
        </div>
        <div class="validation-field">
          <label>Destination</label>
          <span>${data.attraction}</span>
        </div>
        <div class="validation-field">
          <label>Scheduled Slot</label>
          <span>${data.slot}</span>
        </div>
        <div class="validation-field">
          <label>Admitted Party</label>
          <span><strong>${data.pax} Visitor(s)</strong></span>
        </div>
        <div class="validation-field">
          <label>Gate Verification</label>
          <span>Turnstile A1 • Fast Track</span>
        </div>
      </div>
    `;
  }

  function renderRecentScans() {
    if (!recentScansTable) return;

    recentScansTable.innerHTML = recentScansList.slice(0, 7).map(scan => `
      <tr>
        <td style="font-weight: 600;">${scan.time}</td>
        <td><code>${scan.code}</code></td>
        <td><strong>${scan.name}</strong></td>
        <td>${scan.attraction}</td>
        <td>${scan.pax} pax</td>
        <td>
          <span class="scan-status-badge ${scan.status === 'Approved' ? 'approved' : 'rejected'}">
            ${scan.status}
          </span>
        </td>
      </tr>
    `).join('');
  }

  scanSubmitBtn?.addEventListener('click', () => runQRScanValidation());
  scanInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') runQRScanValidation();
  });

  // Preset quick chips
  window.testPresetPass = function(code) {
    if (scanInput) scanInput.value = code;
    runQRScanValidation(code);
  };

  // ==========================================================================
  //  6. Module 4: Admin Analytics Dashboard
  // ==========================================================================
  const peakHoursContainer = document.getElementById('peakHoursContainer');
  const categoryBreakdownContainer = document.getElementById('categoryBreakdownContainer');
  const attendanceTrendsTable = document.getElementById('attendanceTrendsTable');

  const hourlyPeakData = [
    { hour: '07:00 AM', visitors: 65, max: 320, isPeak: false },
    { hour: '09:00 AM', visitors: 190, max: 320, isPeak: false },
    { hour: '11:00 AM', visitors: 310, max: 320, isPeak: true },
    { hour: '01:00 PM', visitors: 285, max: 320, isPeak: false },
    { hour: '03:00 PM', visitors: 240, max: 320, isPeak: false },
    { hour: '05:00 PM', visitors: 175, max: 320, isPeak: false }
  ];

  const categoryDistribution = [
    { category: 'Historical Sites & Heritage', percentage: 42, visitors: '1,420 pax', color: '#6366f1' },
    { category: 'Tourist Spots & Beaches', percentage: 38, visitors: '1,280 pax', color: '#0284c7' },
    { category: 'Cultural Festivals', percentage: 20, visitors: '680 pax', color: '#f59e0b' }
  ];

  const destinationTrends = [
    { name: 'Rizal Monument & Luneta Park', today: '409 pax', week: '2,890 pax', capacityUtil: '86%', status: 'Normal' },
    { name: 'Intramuros Walled City', today: '389 pax', week: '2,650 pax', capacityUtil: '91%', status: 'Peak' },
    { name: 'White Beach Eco-Reserve', today: '633 pax', week: '4,420 pax', capacityUtil: '94%', status: 'Peak' },
    { name: 'Pahiyas Harvest Celebration', today: '775 pax', week: '5,100 pax', capacityUtil: '98%', status: 'Critical' },
    { name: 'Big Lagoon Marine Sanctuary', today: '191 pax', week: '1,320 pax', capacityUtil: '79%', status: 'Normal' }
  ];

  function renderAnalyticsView() {
    // 1. Peak Hours Bar Visualizer
    if (peakHoursContainer) {
      peakHoursContainer.innerHTML = hourlyPeakData.map(h => {
        const pct = Math.round((h.visitors / h.max) * 100);
        return `
          <div class="hourly-bar-row">
            <span class="hour-label">${h.hour}</span>
            <div class="bar-track">
              <div class="bar-fill ${h.isPeak ? 'peak' : ''}" style="width: ${pct}%;"></div>
            </div>
            <span class="visitor-count-label">${h.visitors} pax</span>
          </div>
        `;
      }).join('');
    }

    // 2. Category Distribution
    if (categoryBreakdownContainer) {
      categoryBreakdownContainer.innerHTML = categoryDistribution.map(c => `
        <div class="cat-bar-item">
          <div class="cat-bar-header">
            <span>${c.category}</span>
            <span style="color: ${c.color}; font-weight: 700;">${c.percentage}% (${c.visitors})</span>
          </div>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" style="width: ${c.percentage}%; background-color: ${c.color};"></div>
          </div>
        </div>
      `).join('');
    }

    // 3. Trends Table
    if (attendanceTrendsTable) {
      attendanceTrendsTable.innerHTML = destinationTrends.map(t => `
        <tr>
          <td><strong>${t.name}</strong></td>
          <td>${t.today}</td>
          <td>${t.week}</td>
          <td>
            <span style="font-weight: 700; color: ${parseInt(t.capacityUtil) > 90 ? '#dc2626' : '#0284c7'};">
              ${t.capacityUtil}
            </span>
          </td>
          <td>
            <span class="catalog-status-badge ${t.status === 'Critical' ? 'closed' : t.status === 'Peak' ? 'maintenance' : 'active'}">
              ${t.status}
            </span>
          </td>
        </tr>
      `).join('');
    }
  }

  // ==========================================================================
  //  7. Module 5: Announcement & Notification Dispatch
  // ==========================================================================
  const dispatchForm = document.getElementById('dispatchForm');
  const announcementsFeed = document.getElementById('announcementsFeed');

  function renderAnnouncementsFeed() {
    if (!announcementsFeed) return;

    if (announcementsList.length === 0) {
      announcementsFeed.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: #fff; border-radius: var(--radius-md); border: 1px dashed var(--border);">
          <p style="color: var(--text-muted);">No active broadcast announcements.</p>
        </div>
      `;
      return;
    }

    announcementsFeed.innerHTML = announcementsList.map(a => `
      <div class="announcement-card ${a.priority === 'urgent' ? 'urgent' : a.type === 'weather' ? 'weather' : ''}" data-id="${a.id}">
        <div class="announcement-card-header">
          <span class="announcement-type-badge ${a.priority === 'urgent' ? 'urgent' : a.type === 'weather' ? 'weather' : 'info'}">
            ${a.type.toUpperCase()} • ${a.priority.toUpperCase()}
          </span>
          <span class="announcement-time">${a.timestamp}</span>
        </div>
        <h4 class="announcement-title">${a.title}</h4>
        <p class="announcement-text">${a.text}</p>
        <div class="announcement-footer">
          <span>Target: <strong>${a.target}</strong></span>
          <button class="btn-secondary btn-sm" onclick="deactivateAnnouncement('${a.id}')">Dismiss Broadcast</button>
        </div>
      </div>
    `).join('');
  }

  dispatchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('dispatchTitle')?.value;
    const type = document.getElementById('dispatchType')?.value;
    const targetSelect = document.getElementById('dispatchTargetSelect');
    const target = targetSelect?.options[targetSelect.selectedIndex]?.text || 'All Attractions';
    const text = document.getElementById('dispatchBody')?.value;
    const priority = document.querySelector('input[name="dispatchPriority"]:checked')?.value || 'normal';

    if (!title || !text) {
      alert('Please fill out all required announcement fields.');
      return;
    }

    const newAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      type,
      priority,
      target,
      text,
      timestamp: 'Just now',
      active: true
    };

    if (window.TourismHubStore) {
      TourismHubStore.addAnnouncement(newAnnouncement);
      announcementsList = TourismHubStore.getAnnouncements();
    } else {
      announcementsList.unshift(newAnnouncement);
    }

    showToast(`Broadcasted announcement: "${title}"`);
    dispatchForm.reset();
    renderAnnouncementsFeed();
  });

  window.deactivateAnnouncement = function(id) {
    if (window.TourismHubStore) {
      TourismHubStore.dismissAnnouncement(id);
      announcementsList = TourismHubStore.getAnnouncements();
    } else {
      announcementsList = announcementsList.filter(a => a.id !== id);
    }
    showToast('Announcement dismissed from tourist feeds.');
    renderAnnouncementsFeed();
  };

  // ==========================================================================
  //  8. Overview Dashboard Statistics Synchronizer
  // ==========================================================================
  function updateOverviewStats() {
    let totalCapacity = 0;
    let totalBooked = 0;

    Object.values(capacityScheduleData).forEach(slots => {
      slots.forEach(s => {
        totalBooked += s.booked;
        totalCapacity += s.max;
      });
    });

    const activeCountEl = document.getElementById('kpiActiveAttractions');
    const capacityRateEl = document.getElementById('kpiCapacityRate');
    const passesScannedEl = document.getElementById('kpiPassesScanned');

    if (activeCountEl) activeCountEl.textContent = catalogData.filter(a => a.status === 'active').length;
    if (capacityRateEl) {
      const rate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 74;
      capacityRateEl.textContent = `${rate}%`;
    }
    if (passesScannedEl) passesScannedEl.textContent = `${recentScansList.filter(s => s.status === 'Approved').length * 48 + 312} pax`;
  }

  // Toast System
  let toastTimer;
  const adminToast = document.getElementById('adminToast');
  const toastMsg = document.getElementById('adminToastMessage');

  window.showToast = function(msg) {
    if (!adminToast || !toastMsg) return;
    toastMsg.textContent = msg;
    adminToast.classList.add('active');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      adminToast.classList.remove('active');
    }, 3800);
  };

  // Modal Close System
  window.closeModal = function(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  };

  document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // ==========================================================================
  //  9. Cross-Tab Real-Time Sync Listener
  // ==========================================================================
  if (window.TourismHubStore && typeof TourismHubStore.onSync === 'function') {
    TourismHubStore.onSync(() => {
      catalogData = TourismHubStore.getCatalog();
      capacityScheduleData = TourismHubStore.getCapacityData();
      announcementsList = TourismHubStore.getAnnouncements();
      renderCatalog();
      renderCapacitySlots();
      renderAnnouncementsFeed();
      updateOverviewStats();
    });
  }

  // ==========================================================================
  //  10. Initial Execution
  // ==========================================================================
  renderCatalog();
  renderCapacitySlots();
  renderRecentScans();
  renderAnalyticsView();
  renderAnnouncementsFeed();
  updateOverviewStats();

});
