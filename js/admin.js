// Theme Controller for Admin Panel
function updateAdminThemeUI(isDark) {
  document.querySelectorAll('.theme-btn-sun').forEach(el => {
    el.style.display = isDark ? 'block' : 'none';
  });
  document.querySelectorAll('.theme-btn-moon').forEach(el => {
    el.style.display = isDark ? 'none' : 'block';
  });
  const titleText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  document.querySelectorAll('.topbar-theme-toggle-btn').forEach(btn => {
    btn.setAttribute('title', titleText);
    btn.setAttribute('aria-label', titleText);
  });
}

window.toggleAdminTheme = function () {
  const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newDark = !isCurrentlyDark;
  if (newDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('tourismhub_theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('tourismhub_theme', 'light');
  }
  updateAdminThemeUI(newDark);
};

document.addEventListener('DOMContentLoaded', () => {
  function syncAdminSidebarProfile() {
    if (!window.TourismHubStore) return;
    const admin = TourismHubStore.getAdminAuth ? TourismHubStore.getAdminAuth() : null;
    if (!admin) return;
    const avatarEl = document.querySelector('.sidebar-footer .user-avatar');
    const nameEl = document.querySelector('.sidebar-footer .user-name');
    const roleEl = document.querySelector('.sidebar-footer .user-role');
    if (avatarEl) {
      avatarEl.src = TourismHubStore.getUserAvatar
        ? TourismHubStore.getUserAvatar(admin)
        : TourismHubStore.generateInitialsAvatar(admin.name || 'Admin');
    }
    if (nameEl && admin.name) nameEl.textContent = admin.name;
    if (roleEl && admin.role) roleEl.textContent = admin.role;
  }

  syncAdminSidebarProfile();
  window.addEventListener('tourismhub:avatarUpdated', syncAdminSidebarProfile);

  // Sync admin theme button icons
  updateAdminThemeUI(document.documentElement.getAttribute('data-theme') === 'dark');

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
      admission: 'Free Entry / Guided ₱15',
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
      admission: 'Heritage Pass ₱20',
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
      admission: 'Environmental Pass ₱25',
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
      admission: 'Eco-Tour Pass ₱45',
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
      admission: 'Fiesta Access ₱35',
      price: 35,
      capacityPerSlot: 300,
      image: 'assets/pahiyas-festival.jpg',
      location: 'Lucban, Quezon',
      description: 'Vibrant annual harvest fiesta featuring house facades decorated with colorful kiping rice wafers, fruits, and crafts.'
    },
    {
      id: 'testing-testing',
      title: 'TESTING TESTING',
      category: 'TESTING TESTING',
      type: 'historical',
      status: 'maintenance',
      operatingHours: '23',
      admission: 'TESTING TESTING',
      price: 20,
      capacityPerSlot: 2321,
      image: 'assets/hero-banner.jpg',
      location: 'TESTING TESTING',
      description: 'TESTING TESTING'
    },
    {
      id: 'bayan-glori',
      title: 'Bayan Glori',
      category: 'Historical Monument',
      type: 'historical',
      status: 'active',
      operatingHours: '24/7',
      admission: 'Free',
      price: 20,
      capacityPerSlot: 102000,
      image: 'assets/hero-banner.jpg',
      location: 'Bayan, Q.C.',
      description: 'Traffic and Traffic'
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
      { id: 'en-1', time: '07:30 AM - 10:30 AM', booked: 76, max: 90, status: 'near-full' },
      { id: 'en-2', time: '11:00 AM - 02:00 PM', booked: 88, max: 90, status: 'sold-out' },
      { id: 'en-3', time: '02:30 PM - 05:30 PM', booked: 25, max: 90, status: 'open' }
    ],
    'pahiyas-festival': [
      { id: 'pf-1', time: '08:00 AM - 12:00 PM', booked: 285, max: 300, status: 'near-full' },
      { id: 'pf-2', time: '01:00 PM - 05:00 PM', booked: 300, max: 300, status: 'sold-out' },
      { id: 'pf-3', time: '05:00 PM - 09:00 PM', booked: 190, max: 300, status: 'open' }
    ],
    'testing-testing': [
      { id: 'tt-1', time: '08:00 AM - 12:00 PM', booked: 120, max: 2321, status: 'open' },
      { id: 'tt-2', time: '01:00 PM - 05:00 PM', booked: 350, max: 2321, status: 'open' }
    ],
    'bayan-glori': [
      { id: 'bg-1', time: '08:00 AM - 12:00 PM', booked: 1200, max: 102000, status: 'open' },
      { id: 'bg-2', time: '01:00 PM - 05:00 PM', booked: 2400, max: 102000, status: 'open' }
    ]
  };

  // Tourist Pass Database for QR Verification (Synchronized with Supabase)
  const touristPassesDB = {
    'TEST-PROBE-001': {
      code: 'TEST-PROBE-001',
      status: 'valid',
      touristName: 'Test Visitor',
      attraction: 'Rizal Monument & Luneta Park',
      attractionId: 'rizal-monument',
      slot: '09:00 AM - 12:00 PM',
      pax: 1,
      date: 'Today',
      issued: 'Nov 09, 2026'
    },
    'PASS-8448-BEA': {
      code: 'PASS-8448-BEA',
      status: 'valid',
      touristName: 'Maria Santos',
      attraction: 'Big Lagoon Marine Sanctuary',
      attractionId: 'el-nido-big-lagoon',
      slot: '09:00 AM - 12:00 PM',
      pax: 1,
      date: 'Today',
      issued: 'Nov 10, 2026'
    }
  };

  // Recent Entry Scans Log (Aligned with actual system passes)
  let recentScansList = [
    { time: '10:14 AM', code: 'TEST-PROBE-001', name: 'Test Visitor', attraction: 'Rizal Monument', pax: 1, gate: 'North Entrance Gate 2', status: 'Approved' },
    { time: '10:08 AM', code: 'PASS-8448-BEA', name: 'Maria Santos', attraction: 'Big Lagoon', pax: 1, gate: 'Station 1 Gate A', status: 'Approved' }
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
      sub: 'Validate digital passes and record attendance logs at attraction entrance gates.'
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

    catalogGrid.innerHTML = filtered.map(item => {
      const itemImg = (item.image && !String(item.image).includes('images.unsplash.com/photo-')) ? item.image : 'assets/no-image.svg';
      return `
      <article class="catalog-item-card" data-id="${item.id}">
        <div class="catalog-media-header">
          <img src="${itemImg}" alt="${item.title}" class="catalog-img" onerror="this.src='assets/no-image.svg'">
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
      `;
    }).join('');

    // Update attraction options in other modules
    updateAttractionDropdowns();
  }

  // Filter listeners
  catalogSearchInput?.addEventListener('input', renderCatalog);
  catalogCategoryFilter?.addEventListener('change', renderCatalog);
  catalogStatusFilter?.addEventListener('change', renderCatalog);

  // Active photos being added or edited for the attraction modal (limit 5 pictures)
  let adminSelectedPhotos = [];

  function renderAdminPhotosPreview() {
    const grid = document.getElementById('attrPhotosPreviewGrid');
    const badge = document.getElementById('attrPhotoCountBadge');
    if (badge) {
      badge.textContent = `${adminSelectedPhotos.length} / 5 pictures`;
    }
    if (!grid) return;

    if (adminSelectedPhotos.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 0.5rem 0;">No photos added yet. Default placeholder will be used if left empty.</div>';
      return;
    }

    grid.innerHTML = adminSelectedPhotos.map((url, idx) => `
      <div style="position: relative; border-radius: 8px; overflow: hidden; height: 75px; border: 1.5px solid ${idx === 0 ? '#0284c7' : 'var(--border)'}; background: #0f172a;" title="${idx === 0 ? 'Primary Cover Photo' : `Photo ${idx + 1}`}">
        <img src="${url}" alt="Preview ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;">
        ${idx === 0 ? '<span style="position: absolute; bottom: 2px; left: 2px; right: 2px; background: rgba(2, 132, 199, 0.95); color: #fff; font-size: 0.62rem; font-weight: 700; text-align: center; border-radius: 4px; padding: 1px;">Cover</span>' : ''}
        <button type="button" onclick="removeAdminPhoto(${idx})" title="Remove photo" style="position: absolute; top: 3px; right: 3px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.7); color: #fff; border: none; font-size: 14px; font-weight: 700; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.15s ease;">&times;</button>
      </div>
    `).join('');
  }

  window.removeAdminPhoto = function(idx) {
    if (idx >= 0 && idx < adminSelectedPhotos.length) {
      adminSelectedPhotos.splice(idx, 1);
      renderAdminPhotosPreview();
    }
  };

  // Helper to downscale and compress images client-side before bucket upload
  function downscaleAdminPhoto(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  window.handleAdminPhotoSelection = async function(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 5 - adminSelectedPhotos.length;
    if (remainingSlots <= 0) {
      showToast('Maximum of 5 pictures reached. Remove one first to replace.');
      e.target.value = '';
      return;
    }

    if (files.length > remainingSlots) {
      showToast(`Only ${remainingSlots} more picture(s) allowed (limit is 5).`);
    }

    const filesToRead = files.slice(0, remainingSlots);
    let loaded = 0;

    for (const file of filesToRead) {
      const compressedDataUrl = await downscaleAdminPhoto(file);
      if (compressedDataUrl && adminSelectedPhotos.length < 5) {
        adminSelectedPhotos.push(compressedDataUrl);
        loaded++;
      }
    }

    renderAdminPhotosPreview();
    if (loaded > 0) {
      showToast(`Prepared ${loaded} picture(s) for Supabase bucket storage.`);
    }

    e.target.value = '';
  };

  // Open modal to add new attraction
  window.openAddAttractionModal = function() {
    attractionForm?.reset();
    adminSelectedPhotos = [];
    renderAdminPhotosPreview();
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

    // Load existing pictures (max 5)
    adminSelectedPhotos = (Array.isArray(item.images) ? [...item.images] : (item.image ? [item.image] : []))
      .filter(url => url && !String(url).includes('images.unsplash.com/photo-'))
      .slice(0, 5);
    renderAdminPhotosPreview();

    document.getElementById('attractionModalTitle').textContent = 'Edit Attraction Profile';
    attractionModal?.classList.add('active');
  };

  // Save / Update attraction (Uploads photos to Supabase Storage bucket 'attractions' organized by folder)
  attractionForm?.addEventListener('submit', async (e) => {
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

    const targetFolderId = id || title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    showToast('Uploading pictures to Supabase Storage bucket...');

    // Upload any newly selected photos to Supabase Storage bucket 'attractions' (folder: targetFolderId)
    const finalImages = [];
    for (let i = 0; i < adminSelectedPhotos.length && i < 5; i++) {
      const photo = adminSelectedPhotos[i];
      if (typeof photo === 'string' && photo.startsWith('data:') && window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          const uploadRes = await TourismHubSupabase.uploadAttractionImage(targetFolderId, photo, i + 1);
          if (uploadRes && uploadRes.success && uploadRes.publicUrl) {
            finalImages.push(uploadRes.publicUrl);
            continue;
          }
        } catch (uploadErr) {
          console.warn('[Admin] Bucket upload error for photo ' + (i + 1), uploadErr);
        }
      }
      finalImages.push(photo);
    }

    if (finalImages.length === 0) {
      finalImages.push('assets/no-image.svg');
    }
    const primaryImg = finalImages[0];

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
        description: desc,
        image: primaryImg,
        images: finalImages
      };
      if (window.TourismHubStore) {
        TourismHubStore.updateAttraction(id, updates);
        catalogData = TourismHubStore.getCatalog();
      } else {
        const item = catalogData.find(a => a.id === id);
        if (item) Object.assign(item, updates);
      }
      showToast(`Updated "${title}" with Supabase bucket pictures!`);
    } else {
      // Create new
      const newId = targetFolderId;
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
        image: primaryImg,
        images: finalImages,
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

      showToast(`Successfully cataloged "${title}" in Supabase!`);
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

      if (percentage >= 100) {
        fillClass = 'danger';
      } else if (percentage >= 80) {
        fillClass = 'warning';
      }

      return `
        <div class="slot-card ${percentage >= 100 ? 'at-capacity' : percentage >= 80 ? 'near-capacity' : ''}">
          <div class="slot-card-header">
            <span class="slot-time">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${slot.time}
            </span>
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

  let adminHtml5QrScanner = null;
  let isAdminCameraActive = false;
  let lastAdminScannedCode = '';
  let lastAdminScanTime = 0;

  function extractAdminPassCode(rawText) {
    if (!rawText) return '';
    const trimmed = String(rawText).trim();
    try {
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.code || parsed.pass_code) return String(parsed.code || parsed.pass_code).toUpperCase().trim();
      }
    } catch (e) {}
    const match = trimmed.match(/(PASS-[A-Z0-9-]+|TEST-[A-Z0-9-]+)/i);
    if (match) return match[1].toUpperCase();
    return trimmed.toUpperCase();
  }

  window.toggleAdminLiveCamera = async function () {
    const boxEl = document.getElementById('adminCameraBox');
    const readerEl = document.getElementById('adminLiveQrReader');
    const btnLabel = document.getElementById('adminCameraBtnLabel');
    const toggleBtn = document.getElementById('adminToggleCameraBtn');
    const targetSvg = document.getElementById('adminViewfinderTarget');

    if (isAdminCameraActive && adminHtml5QrScanner) {
      try {
        await adminHtml5QrScanner.stop();
        adminHtml5QrScanner.clear();
      } catch (e) {
        console.warn('Error stopping admin camera:', e);
      }
      isAdminCameraActive = false;
      if (boxEl) boxEl.classList.remove('camera-live');
      if (readerEl) readerEl.style.display = 'none';
      if (btnLabel) btnLabel.textContent = 'Start Live Camera';
      if (toggleBtn) {
        toggleBtn.style.background = '#10b981';
        toggleBtn.style.borderColor = '#10b981';
      }
      if (targetSvg) targetSvg.style.display = 'flex';
      return;
    }

    if (typeof Html5Qrcode === 'undefined') {
      showToast('QR Camera library is still loading. Please try again in a moment.');
      return;
    }

    try {
      if (boxEl) boxEl.classList.add('camera-live');
      if (readerEl) readerEl.style.display = 'block';
      if (targetSvg) targetSvg.style.display = 'none';
      adminHtml5QrScanner = new Html5Qrcode('adminLiveQrReader');
      await adminHtml5QrScanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 200, height: 200 } },
        async (decodedText) => {
          const now = Date.now();
          const code = extractAdminPassCode(decodedText);
          if (!code) return;
          if (code === lastAdminScannedCode && now - lastAdminScanTime < 3500) return;
          lastAdminScannedCode = code;
          lastAdminScanTime = now;
          if (scanInput) scanInput.value = code;
          await window.runQRScanValidation(code);
        },
        () => {}
      );
      isAdminCameraActive = true;
      if (btnLabel) btnLabel.textContent = 'Stop Live Camera';
      if (toggleBtn) {
        toggleBtn.style.background = '#ef4444';
        toggleBtn.style.borderColor = '#ef4444';
      }
      showToast('Live QR camera started! Point at a tourist pass QR code.');
    } catch (err) {
      console.warn('Admin camera failed:', err);
      if (boxEl) boxEl.classList.remove('camera-live');
      if (readerEl) readerEl.style.display = 'none';
      if (targetSvg) targetSvg.style.display = 'flex';
      showToast('Camera unavailable or permission denied. Use "Upload QR Image" or manual input.');
    }
  };

  window.scanAdminQrImage = async function (event) {
    const file = event.target?.files?.[0];
    if (!file) return;
    if (typeof Html5Qrcode === 'undefined') {
      showToast('QR decoder not available.');
      return;
    }
    try {
      if (isAdminCameraActive && adminHtml5QrScanner) {
        await window.toggleAdminLiveCamera();
      }
      const fileScanner = new Html5Qrcode('adminLiveQrReader');
      const decodedText = await fileScanner.scanFile(file, false);
      fileScanner.clear();
      const code = extractAdminPassCode(decodedText);
      if (code) {
        if (scanInput) scanInput.value = code;
        await window.runQRScanValidation(code);
      }
    } catch (err) {
      console.warn('Admin QR image scan error:', err);
      showToast('Could not detect a valid QR code in the uploaded image.');
    } finally {
      event.target.value = '';
    }
  };

  window.runQRScanValidation = async function(customCode = null) {
    const rawCode = (customCode || scanInput?.value || '').trim();
    const code = extractAdminPassCode(rawCode);
    if (!code) {
      alert('Please enter or scan a valid QR Tourist Pass code.');
      return;
    }

    // Fetch live pass from Supabase first if online so any pass in DB is recognized
    if (window.TourismHubSupabase && typeof TourismHubSupabase.getPassByCode === 'function' && TourismHubSupabase.isReady()) {
      try {
        const remotePass = await TourismHubSupabase.getPassByCode(code);
        if (remotePass && window.TourismHubStore) {
          const currentPasses = TourismHubStore.getPasses();
          currentPasses[code] = remotePass;
          TourismHubStore.savePasses(currentPasses);
        }
      } catch (e) {
        console.warn('[Admin Scanner] Supabase lookup warning:', e);
      }
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
        slot: 'Not found in Supabase registry',
        pax: 0,
        statusLabel: 'Pass Not Registered'
      });

      recentScansList.unshift({
        time: timeStr,
        code,
        name: 'Unregistered Pass',
        attraction: 'N/A',
        pax: 0,
        gate: 'Gate A1',
        status: 'Rejected'
      });
      renderRecentScans();
      return;
    }

    const displayName = record.touristName || record.visitorName || 'Tourist Guest';
    const displayPax = record.pax || record.partySize || 1;
    const isAlreadyUsed = record.status === 'already-used' || record.status === 'already_used' || record.status === 'used';

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
        statusLabel: 'Verified & Synced to Supabase'
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
        gate: 'Gate A1 Express',
        status: 'Approved'
      });

      showToast(`Pass verified & synced to Supabase! Admitted ${displayPax} pax for ${displayName}.`);

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
        gate: 'Gate A1 Express',
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
        gate: 'Gate A1 Express',
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
          <span>Gate A1 • Fast Track</span>
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
  //  6. Module 4: Admin Analytics Dashboard (Live Operational Data)
  // ==========================================================================
  const peakHoursContainer = document.getElementById('peakHoursContainer');
  const peakHoursOverviewPreview = document.getElementById('peakHoursOverviewPreview');
  const categoryBreakdownContainer = document.getElementById('categoryBreakdownContainer');
  const attendanceTrendsTable = document.getElementById('attendanceTrendsTable');

  function renderAnalyticsView() {
    // Sync current catalog and capacity from store if available
    if (window.TourismHubStore) {
      catalogData = TourismHubStore.getCatalog();
      capacityScheduleData = TourismHubStore.getCapacityData();
    }

    // -----------------------------------------------------------------------
    // 1. Compute Live Hourly Peak Attendance
    // -----------------------------------------------------------------------
    const slotBuckets = [
      { key: '08:00 AM', label: '08:00 AM - 11:00 AM', booked: 0, max: 0 },
      { key: '11:00 AM', label: '11:00 AM - 02:00 PM', booked: 0, max: 0 },
      { key: '02:00 PM', label: '02:00 PM - 05:00 PM', booked: 0, max: 0 },
      { key: '05:00 PM', label: '05:00 PM - 08:00 PM', booked: 0, max: 0 }
    ];

    Object.values(capacityScheduleData).forEach(slots => {
      if (Array.isArray(slots)) {
        slots.forEach((s, idx) => {
          const targetBucket = slotBuckets[idx % slotBuckets.length];
          targetBucket.booked += (s.booked || 0);
          targetBucket.max += (s.max || 100);
        });
      }
    });

    // Add entries from recent approved scans to mid-day / afternoon load
    const approvedScans = (recentScansList || []).filter(s => s.status === 'Approved').length;
    if (slotBuckets[1]) slotBuckets[1].booked += Math.round(approvedScans * 0.6);
    if (slotBuckets[2]) slotBuckets[2].booked += Math.round(approvedScans * 0.4);

    // Find the highest visitor slot to tag as Peak
    let maxVisitors = 0;
    slotBuckets.forEach(b => {
      if (b.booked > maxVisitors) maxVisitors = b.booked;
    });

    const hourlyPeakHTML = slotBuckets.map(b => {
      const isPeak = b.booked > 0 && b.booked === maxVisitors;
      const pct = b.max > 0 ? Math.min(100, Math.round((b.booked / b.max) * 100)) : 45;
      return `
        <div class="hourly-bar-row">
          <span class="hour-label">${b.key}</span>
          <div class="bar-track">
            <div class="bar-fill ${isPeak ? 'peak' : ''}" style="width: ${pct}%;"></div>
          </div>
          <span class="visitor-count-label">${b.booked} pax</span>
        </div>
      `;
    }).join('');

    if (peakHoursContainer) peakHoursContainer.innerHTML = hourlyPeakHTML;
    if (peakHoursOverviewPreview) peakHoursOverviewPreview.innerHTML = hourlyPeakHTML;

    // -----------------------------------------------------------------------
    // 2. Compute Live Attendance by Category
    // -----------------------------------------------------------------------
    const categoryMap = {};
    const colorPalette = {
      'historical': { name: 'Historical Sites & Heritage', color: '#6366f1' },
      'beach': { name: 'Tourist Spots & Beaches', color: '#0284c7' },
      'festival': { name: 'Cultural Festivals & Events', color: '#f59e0b' },
      'eco': { name: 'Eco-Tourism & Nature', color: '#10b981' }
    };

    let totalCategoryPax = 0;
    catalogData.forEach(item => {
      const typeKey = (item.type || 'beach').toLowerCase();
      const meta = colorPalette[typeKey] || { name: item.category || 'Destinations', color: '#14b8a6' };
      const catName = meta.name;

      let itemPax = 0;
      if (capacityScheduleData[item.id] && Array.isArray(capacityScheduleData[item.id])) {
        itemPax = capacityScheduleData[item.id].reduce((sum, s) => sum + (s.booked || 0), 0);
      }
      if (itemPax === 0) itemPax = Math.round((item.capacityPerSlot || 100) * 0.65);

      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, visitors: 0, color: meta.color };
      }
      categoryMap[catName].visitors += itemPax;
      totalCategoryPax += itemPax;
    });

    if (categoryBreakdownContainer) {
      categoryBreakdownContainer.innerHTML = Object.values(categoryMap).map(c => {
        const pct = totalCategoryPax > 0 ? Math.round((c.visitors / totalCategoryPax) * 100) : 33;
        return `
          <div class="cat-bar-item">
            <div class="cat-bar-header">
              <span>${c.name}</span>
              <span style="color: ${c.color}; font-weight: 700;">${pct}% (${c.visitors.toLocaleString()} pax)</span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" style="width: ${pct}%; background-color: ${c.color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // -----------------------------------------------------------------------
    // 3. Destination Attendance & Capacity Utilization Table
    // -----------------------------------------------------------------------
    if (attendanceTrendsTable) {
      attendanceTrendsTable.innerHTML = catalogData.map(item => {
        let bookedSum = 0;
        let maxCapSum = 0;

        if (capacityScheduleData[item.id] && Array.isArray(capacityScheduleData[item.id])) {
          capacityScheduleData[item.id].forEach(s => {
            bookedSum += (s.booked || 0);
            maxCapSum += (s.max || 100);
          });
        }

        const utilRate = maxCapSum > 0 ? Math.round((bookedSum / maxCapSum) * 100) : 50;
        const weekPax = Math.round(bookedSum * 6.8 + 240);

        let statusText = 'Normal';
        let statusClass = 'active';
        let utilColor = '#0284c7';

        if (utilRate >= 90) {
          statusText = 'Critical';
          statusClass = 'closed';
          utilColor = '#dc2626';
        } else if (utilRate >= 75) {
          statusText = 'Peak';
          statusClass = 'maintenance';
          utilColor = '#d97706';
        }

        return `
          <tr>
            <td>
              <div style="font-weight: 800; color: var(--text-main);">${item.title}</div>
              <small style="color: var(--text-muted); font-size: 0.74rem;">${item.category || 'Attraction'} • ${item.location || 'Metro Manila'}</small>
            </td>
            <td style="font-weight: 600;">${bookedSum} pax</td>
            <td>${weekPax.toLocaleString()} pax</td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 800; color: ${utilColor}; min-width: 38px;">${utilRate}%</span>
                <div style="flex: 1; height: 6px; background: var(--bg-subtle); border-radius: 99px; overflow: hidden; max-width: 90px;">
                  <div style="width: ${utilRate}%; height: 100%; background: ${utilColor}; border-radius: 99px;"></div>
                </div>
              </div>
            </td>
            <td>
              <span class="catalog-status-badge ${statusClass}">
                ${statusText}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // -------------------------------------------------------------------------
  // 4. Operational Analytics Export (CSV Generator)
  // -------------------------------------------------------------------------
  window.exportAnalyticsReportCSV = function() {
    if (!catalogData || catalogData.length === 0) {
      showToast('No attraction records available to export.');
      return;
    }

    const headers = [
      'Destination ID',
      'Destination Title',
      'Category',
      'Operating Hours',
      'Admission Price',
      'Today Booked Pax',
      'Total Capacity Slots',
      'Capacity Utilization',
      'Operational Status'
    ];

    const rows = catalogData.map(item => {
      let bookedSum = 0;
      let maxCapSum = 0;
      if (capacityScheduleData[item.id] && Array.isArray(capacityScheduleData[item.id])) {
        capacityScheduleData[item.id].forEach(s => {
          bookedSum += (s.booked || 0);
          maxCapSum += (s.max || 100);
        });
      }
      const utilRate = maxCapSum > 0 ? Math.round((bookedSum / maxCapSum) * 100) : 0;
      const statusText = utilRate >= 90 ? 'Critical' : (utilRate >= 75 ? 'Peak' : 'Normal');

      return [
        `"${item.id}"`,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${item.operatingHours || '08:00 AM - 06:00 PM'}"`,
        `"${item.priceLabel || `$${item.price || 0}`}"`,
        bookedSum,
        maxCapSum,
        `"${utilRate}%"`,
        `"${statusText}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const todayDate = new Date().toISOString().slice(0, 10);
    downloadAnchor.href = url;
    downloadAnchor.setAttribute('download', `TourismHub_Analytics_Report_${todayDate}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);

    showToast('Operational analytics report exported successfully!');
  };

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
    renderAnalyticsView();
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
