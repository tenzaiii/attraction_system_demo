(function (window) {
  'use strict';

  // Temporary local cache keys
  const KEYS = {
    CATALOG: 'tourismhub_temp_catalog_v1',
    CAPACITY: 'tourismhub_temp_capacity_v1',
    ANNOUNCEMENTS: 'tourismhub_temp_announcements_v1',
    PASSES: 'tourismhub_temp_passes_v1',
    LOGS: 'tourismhub_temp_logs_v1',
    ADMIN_AUTH: 'tourismhub_temp_admin_auth_v1',
    ADMIN_PASSWORDS: 'tourismhub_temp_admin_passwords_v1',
    CLIENT_AUTH: 'tourismhub_temp_client_auth_v1',
    CLIENT_USERS: 'tourismhub_temp_client_users_v1',
    FAVORITES: 'tourismhub_temp_favorites_v1'
  };

  function isMockAvatarUrl(url) {
    if (!url || typeof url !== 'string') return true;
    const clean = url.trim();
    if (!clean) return true;
    return clean.includes('images.unsplash.com/photo-') || clean === 'assets/hero-banner.jpg';
  }

  // Default Seed Admin & Operator Accounts
  const DEFAULT_ADMIN_USERS = [
    {
      id: 'admin-001',
      name: 'Juan Miguel Repas',
      email: 'admin@tourismhub.gov.ph',
      password: 'admin123',
      role: 'Head of Tourism Ops',
      roleKey: 'admin',
      department: 'Department of Tourism • National Operations',
      badge: 'Chief Operator',
      avatar: '',
      terminal: 'MNL-HQ-01'
    },
    {
      id: 'admin-002',
      name: 'Carlos Mendoza',
      email: 'gate@tourismhub.gov.ph',
      password: 'gate2026',
      role: 'Receptionist / Gate Officer',
      roleKey: 'officer',
      department: 'Luneta & Intramuros Entry Stations',
      badge: 'Field Operations',
      avatar: '',
      terminal: 'LNT-GATE-04'
    }
  ];

  // Default Seed Client / Tourist Accounts
  const DEFAULT_CLIENT_USERS = [
    {
      id: '39c673f7-433a-4259-9569-8deb1904688f',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      password: 'tourist123',
      country: 'Philippines',
      phone: null,
      badge: 'Verified Resident Tourist',
      avatar: ''
    },
    {
      id: '06038a82-9062-430b-a3b6-d848e0e06e30',
      name: 'Alex Tan',
      email: 'alex.tan@visitor.sg',
      password: 'tourist123',
      country: 'Philippines',
      phone: null,
      badge: 'International Explorer',
      avatar: ''
    },
    {
      id: '87313fe7-603f-413d-b98d-2cd18003fbe0',
      name: 'aaa',
      email: 'aaa@email.com',
      password: 'aaa123',
      country: 'aaaa',
      phone: '1231312',
      badge: 'New Tourist Member',
      avatar: ''
    },
    {
      id: '1672fe3b-2b7e-4c1a-a41d-0f407ff35d2f',
      name: 'JB JACOB',
      email: 'jacob@email.com',
      password: 'jacob123',
      country: 'Planet Namek',
      phone: '',
      badge: 'New Tourist Member',
      avatar: ''
    }
  ];

  // Default Seed Data: Attractions & Events Catalog
  const DEFAULT_CATALOG = [
    {
      id: 'rizal-monument',
      title: 'Rizal Monument & Luneta Park',
      category: 'Historical Site',
      type: 'historical',
      rating: '4.8',
      reviews: '1.2k',
      price: 15,
      priceLabel: 'Free / Guided ₱15',
      admission: 'Free Entry / Guided ₱15',
      operatingHours: '06:00 AM - 09:00 PM',
      capacityPerSlot: 150,
      image: 'assets/rizal-monument.jpg',
      images: ['assets/rizal-monument.jpg', 'assets/qc-memorial-circle.jpg', 'assets/hero-banner.jpg'],
      badge: 'Iconic Landmark',
      location: 'Manila, Metro Manila',
      status: 'active',
      description: 'The monumental memorial in Luneta Park honoring Dr. José Rizal, national hero of the Philippines with ceremonial guards.'
    },
    {
      id: 'intramuros-walled-city',
      title: 'Intramuros Walled City Heritage',
      category: 'Historical Site',
      type: 'historical',
      rating: '4.8',
      reviews: '2.1k',
      price: 20,
      priceLabel: 'Pass from ₱20',
      admission: 'Heritage Pass ₱20',
      operatingHours: '08:00 AM - 06:00 PM',
      capacityPerSlot: 120,
      image: 'assets/rizal-monument.jpg',
      images: ['assets/rizal-monument.jpg', 'assets/hero-banner.jpg', 'assets/qc-memorial-circle.jpg', 'assets/white-beach.jpg'],
      badge: 'UNESCO Heritage',
      location: 'Intramuros, Manila',
      status: 'active',
      description: 'Centuries of Spanish colonial history featuring stone ramparts, Fort Santiago, cobblestone roadways, and museum plazas.'
    },
    {
      id: 'white-beach-boracay',
      title: 'White Beach Eco-Tourism Reserve',
      category: 'Tourist Spot',
      type: 'beach',
      rating: '4.7',
      reviews: '980',
      price: 25,
      priceLabel: 'Day Pass ₱25',
      admission: 'Environmental Pass ₱25',
      operatingHours: '05:30 AM - 10:00 PM',
      capacityPerSlot: 200,
      image: 'assets/white-beach.jpg',
      images: ['assets/white-beach.jpg', 'assets/hero-banner.jpg', 'assets/pahiyas-festival.jpg'],
      badge: 'Tropical Haven',
      location: 'Boracay Island, Aklan',
      status: 'active',
      description: 'Powdery sugar-white sand, turquoise lagoon waters, and curated marine activities with regulated daily eco-caps.'
    },
    {
      id: 'pahiyas-festival',
      title: 'Pahiyas Harvest Festival',
      category: 'Festival',
      type: 'festival',
      rating: '4.9',
      reviews: '850',
      price: 35,
      priceLabel: 'Event Access ₱35',
      admission: 'Special Event Access ₱35',
      operatingHours: '07:00 AM - 11:00 PM',
      capacityPerSlot: 300,
      image: 'assets/pahiyas-festival.jpg',
      images: ['assets/pahiyas-festival.jpg', 'assets/hero-banner.jpg', 'assets/qc-memorial-circle.jpg'],
      badge: 'Annual Celebration',
      location: 'Lucban, Quezon',
      status: 'active',
      description: 'A vibrant harvest thanksgiving celebration where traditional homes are decorated with colorful kiping rice wafers and farm yields.'
    },
    {
      id: 'el-nido-big-lagoon',
      title: 'Big Lagoon Marine Sanctuary',
      category: 'Tourist Spot',
      type: 'beach',
      rating: '4.9',
      reviews: '3.4k',
      price: 45,
      priceLabel: 'Tour Pass ₱45',
      admission: 'Eco-Tour Permit ₱45',
      operatingHours: '06:00 AM - 05:00 PM',
      capacityPerSlot: 90,
      image: 'assets/hero-banner.jpg',
      images: ['assets/hero-banner.jpg', 'assets/white-beach.jpg', 'assets/rizal-monument.jpg'],
      badge: 'World Wonder',
      location: 'El Nido, Palawan',
      status: 'active',
      description: 'Emerald lagoon surrounded by towering karst limestone cliffs with strictly monitored eco-kayak time limits.'
    },
    {
      id: 'testing-testing',
      title: 'TESTING TESTING',
      category: 'TESTING TESTING',
      type: 'historical',
      rating: '4.8',
      reviews: '100',
      price: 20,
      priceLabel: '₱20',
      admission: 'TESTING TESTING',
      operatingHours: '23',
      capacityPerSlot: 2321,
      image: 'assets/hero-banner.jpg',
      images: ['assets/hero-banner.jpg', 'assets/qc-memorial-circle.jpg'],
      badge: 'Featured',
      location: 'TESTING TESTING',
      status: 'maintenance',
      description: 'TESTING TESTING'
    },
    {
      id: 'bayan-glori',
      title: 'Bayan Glori',
      category: 'Historical Monument',
      type: 'historical',
      rating: '4.8',
      reviews: '100',
      price: 20,
      priceLabel: '₱20',
      admission: 'Free',
      operatingHours: '24/7',
      capacityPerSlot: 102000,
      image: 'assets/hero-banner.jpg',
      images: ['assets/hero-banner.jpg', 'assets/qc-memorial-circle.jpg'],
      badge: 'Featured',
      location: 'Bayan, Q.C.',
      status: 'active',
      description: 'Traffic and Traffic'
    }
  ];

  // Default Seed Data: Capacity Schedules
  const DEFAULT_CAPACITY = {
    'rizal-monument': [
      { id: 'rm-1', time: '08:00 AM - 11:00 AM', booked: 85, max: 150, status: 'open' },
      { id: 'rm-2', time: '11:00 AM - 02:00 PM', booked: 142, max: 150, status: 'near-full' },
      { id: 'rm-3', time: '02:00 PM - 05:00 PM', booked: 102, max: 150, status: 'open' },
      { id: 'rm-4', time: '05:00 PM - 08:00 PM', booked: 80, max: 150, status: 'open' }
    ],
    'intramuros-walled-city': [
      { id: 'im-1', time: '08:30 AM - 11:30 AM', booked: 98, max: 120, status: 'near-full' },
      { id: 'im-2', time: '11:30 AM - 02:30 PM', booked: 116, max: 120, status: 'near-full' },
      { id: 'im-3', time: '02:30 PM - 05:30 PM', booked: 75, max: 120, status: 'open' }
    ],
    'white-beach-boracay': [
      { id: 'wb-1', time: '06:00 AM - 10:00 AM', booked: 120, max: 200, status: 'open' },
      { id: 'wb-2', time: '10:00 AM - 02:00 PM', booked: 194, max: 200, status: 'near-full' },
      { id: 'wb-3', time: '02:00 PM - 06:00 PM', booked: 188, max: 200, status: 'near-full' }
    ],
    'pahiyas-festival': [
      { id: 'pf-1', time: '07:00 AM - 12:00 PM', booked: 295, max: 300, status: 'at-capacity' },
      { id: 'pf-2', time: '12:00 PM - 05:00 PM', booked: 280, max: 300, status: 'near-full' },
      { id: 'pf-3', time: '05:00 PM - 10:00 PM', booked: 200, max: 300, status: 'open' }
    ],
    'el-nido-big-lagoon': [
      { id: 'en-1', time: '07:00 AM - 10:00 AM', booked: 78, max: 90, status: 'near-full' },
      { id: 'en-2', time: '10:00 AM - 01:00 PM', booked: 88, max: 90, status: 'near-full' },
      { id: 'en-3', time: '01:00 PM - 04:00 PM', booked: 25, max: 90, status: 'open' }
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

  // Default Seed Data: Announcements & Advisories (Synchronized with Supabase)
  const DEFAULT_ANNOUNCEMENTS = [
    {
      id: 1,
      title: 'Severe Weather Advisory: Signal No. 1',
      type: 'weather',
      priority: 'urgent',
      target: 'White Beach Eco-Tourism Reserve',
      text: 'Typhoon approaching coastal Luzon. Outdoor activities in Boracay may be suspended if warning elevates.',
      author: 'Operations Desk',
      timestamp: 'Today',
      active: true
    },
    {
      id: 2,
      title: 'Extended Operating Hours for Rizal Park',
      type: 'schedule',
      priority: 'normal',
      target: 'Rizal Monument & Luneta Park',
      text: 'Luneta heritage grounds will remain open until 10:00 PM on Friday for the cultural laser light showcase.',
      author: 'Park Administration',
      timestamp: 'Today',
      active: true
    },
    {
      id: 3,
      title: 'Pahiyas Festival Float Parade Registration',
      type: 'event',
      priority: 'normal',
      target: 'Pahiyas Harvest Festival',
      text: 'Registration for the grand street float procession is now officially open for accredited cultural delegations.',
      author: 'Cultural Affairs Committee',
      timestamp: 'Today',
      active: true
    },
    {
      id: 7,
      title: 'Test Broadcast Advisory',
      type: 'announcement',
      priority: 'normal',
      target: 'System Operations',
      text: 'Testing connection from TourismHub integration',
      author: 'System Operations',
      timestamp: 'Recent',
      active: true
    },
    {
      id: 8,
      title: 'TESTING 1',
      type: 'event',
      priority: 'urgent',
      target: 'Pahiyas Harvest Festival',
      text: 'TESTING TESTING TESTING',
      author: 'Pahiyas Harvest Festival',
      timestamp: 'Recent',
      active: true
    },
    {
      id: 10,
      title: 'TEST 3',
      type: 'event',
      priority: 'normal',
      target: 'Broadcast to All Attractions',
      text: 'TESTING TESTINGTESTING TESTINGTESTING TESTINGTESTING TESTING',
      author: 'Broadcast to All Attractions',
      timestamp: 'Recent',
      active: true
    },
    {
      id: 11,
      title: 'BEEP BEEP',
      type: 'event',
      priority: 'urgent',
      target: 'Broadcast to All Attractions',
      text: 'aaaaa',
      author: 'Broadcast to All Attractions',
      timestamp: 'Recent',
      active: true
    }
  ];

  // Default Seed Data: Pre-registered Tourist Passes (Exact Supabase Data)
  const DEFAULT_PASSES = {
    'TEST-PROBE-001': {
      code: 'TEST-PROBE-001',
      visitorName: 'Test Visitor',
      visitorEmail: 'test.visitor@email.ph',
      partySize: 1,
      attractionId: 'rizal-monument',
      attraction: 'Rizal Monument',
      slot: '09:00 AM - 12:00 PM',
      passType: 'Standard Admission',
      status: 'valid',
      amount: '₱0.00',
      validDate: '2026-11-10'
    },
    'PASS-8448-BEA': {
      code: 'PASS-8448-BEA',
      userId: '39c673f7-433a-4259-9569-8deb1904688f',
      visitorName: 'Maria Santos',
      visitorEmail: 'maria.santos@email.com',
      bookedByUserId: '39c673f7-433a-4259-9569-8deb1904688f',
      bookedByEmail: 'maria.santos@email.com',
      partySize: 1,
      attractionId: 'el-nido-big-lagoon',
      attraction: 'Big Lagoon Marine Sanctuary',
      slot: '09:00 AM - 12:00 PM',
      passType: 'Eco-Tour Permit',
      status: 'valid',
      amount: '₱45.00',
      validDate: '2026-10-20'
    }
  };

  // Default Check-in Logs
  const DEFAULT_LOGS = [
    { time: '11:24 AM', pass: 'TEST-PROBE-001', visitor: 'Test Visitor', attraction: 'Rizal Monument', party: '1 pax', result: 'Approved' },
    { time: '10:15 AM', pass: 'PASS-8448-BEA', visitor: 'Maria Santos', attraction: 'Big Lagoon Marine Sanctuary', party: '1 pax', result: 'Approved' }
  ];

  // Helper Functions for Safe LocalStorage
  function getItem(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.warn('TourismHubStore: Failed to read from localStorage', e);
      return defaultVal;
    }
  }

  function setItem(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      // Dispatch a synthetic storage event for same-window listeners
      window.dispatchEvent(new CustomEvent('tourismhub:sync', { detail: { key, val } }));
    } catch (e) {
      console.warn('TourismHubStore: Failed to write to localStorage', e);
    }
  }

  // Initialize store if keys don't exist
  if (!localStorage.getItem(KEYS.CATALOG)) {
    setItem(KEYS.CATALOG, DEFAULT_CATALOG);
  }
  if (!localStorage.getItem(KEYS.CAPACITY)) {
    setItem(KEYS.CAPACITY, DEFAULT_CAPACITY);
  }
  if (!localStorage.getItem(KEYS.ANNOUNCEMENTS)) {
    setItem(KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
  }
  if (!localStorage.getItem(KEYS.PASSES)) {
    setItem(KEYS.PASSES, DEFAULT_PASSES);
  }
  if (!localStorage.getItem(KEYS.LOGS)) {
    setItem(KEYS.LOGS, DEFAULT_LOGS);
  }

  // Purge legacy mock profile avatars and non-Peso defaults from localStorage
  (function sanitizeCachedStoreState() {
    try {
      localStorage.removeItem('tourismhub_setting_currency');

      const sanitizeUser = (u) => {
        if (!u || typeof u !== 'object') return u;
        if (isMockAvatarUrl(u.avatar) || (typeof u.avatar === 'string' && u.avatar.includes('font-weight%3D%22800%22'))) {
          return { ...u, avatar: '' };
        }
        return u;
      };

      const rawUsers = getItem(KEYS.CLIENT_USERS, null);
      if (Array.isArray(rawUsers)) {
        const cleanedUsers = rawUsers.map(sanitizeUser);
        localStorage.setItem(KEYS.CLIENT_USERS, JSON.stringify(cleanedUsers));
      }

      const rawClientAuth = getItem(KEYS.CLIENT_AUTH, null);
      if (rawClientAuth) {
        localStorage.setItem(KEYS.CLIENT_AUTH, JSON.stringify(sanitizeUser(rawClientAuth)));
      }

      const rawAdminAuth = getItem(KEYS.ADMIN_AUTH, null);
      if (rawAdminAuth) {
        localStorage.setItem(KEYS.ADMIN_AUTH, JSON.stringify(sanitizeUser(rawAdminAuth)));
      }

      const rawCatalog = getItem(KEYS.CATALOG, null);
      if (Array.isArray(rawCatalog)) {
        const pesoCatalog = rawCatalog.map(item => {
          let imgs = (Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []))
            .filter(url => url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-'))
            .slice(0, 5);

          const rawImg = item.image && !String(item.image).includes('images.unsplash.com/photo-')
            ? item.image
            : (imgs[0] || 'assets/no-image.svg');

          if (imgs.length <= 1) {
            const defItem = DEFAULT_CATALOG.find(d => d.id === item.id);
            if (defItem && Array.isArray(defItem.images) && defItem.images.length > imgs.length) {
              imgs = [...defItem.images];
            }
          }

          if (imgs.length === 0) imgs = [rawImg];

          return {
            ...item,
            image: rawImg,
            images: imgs,
            priceLabel: typeof item.priceLabel === 'string' ? item.priceLabel.replace(/\$(\d+)/g, '₱$1') : item.priceLabel,
            admission: typeof item.admission === 'string' ? item.admission.replace(/\$(\d+)/g, '₱$1') : item.admission
          };
        });
        localStorage.setItem(KEYS.CATALOG, JSON.stringify(pesoCatalog));
      }

      const rawPasses = getItem(KEYS.PASSES, null);
      if (rawPasses && typeof rawPasses === 'object') {
        Object.values(rawPasses).forEach(p => {
          if (!p) return;
          if (typeof p.amount === 'string' && p.amount.startsWith('$')) {
            p.amount = '₱' + p.amount.slice(1);
          }
          if (p.code === 'PASS-8448-BEA' && (!p.userId || p.visitorEmail === 'maria.santos@traveler.ph')) {
            p.userId = '39c673f7-433a-4259-9569-8deb1904688f';
            p.visitorEmail = 'maria.santos@email.com';
            p.bookedByUserId = '39c673f7-433a-4259-9569-8deb1904688f';
            p.bookedByEmail = 'maria.santos@email.com';
          }
        });
        localStorage.setItem(KEYS.PASSES, JSON.stringify(rawPasses));
      }
    } catch (e) {}
  })();

  // Public Store API
  const TourismHubStore = {
    // 1. Catalog
    getCatalog() {
      return getItem(KEYS.CATALOG, DEFAULT_CATALOG);
    },
    saveCatalog(catalog) {
      setItem(KEYS.CATALOG, catalog);
    },
    addAttraction(item) {
      if (!Array.isArray(item.images) || item.images.length === 0) {
        item.images = item.image ? [item.image] : ['assets/no-image.svg'];
      }
      item.images = item.images.filter(u => u && !String(u).includes('images.unsplash.com/photo-')).slice(0, 5);
      if (item.images.length === 0) item.images = ['assets/no-image.svg'];
      item.image = item.images[0];

      const catalog = this.getCatalog();
      catalog.unshift(item);
      this.saveCatalog(catalog);

      // Also generate default capacity slots for this attraction
      const capacity = this.getCapacityData();
      if (!capacity[item.id]) {
        const slotLimit = item.capacityPerSlot || 150;
        capacity[item.id] = [
          { id: `${item.id}-1`, time: '08:00 AM - 11:00 AM', booked: 0, max: slotLimit, status: 'open' },
          { id: `${item.id}-2`, time: '11:00 AM - 02:00 PM', booked: 0, max: slotLimit, status: 'open' },
          { id: `${item.id}-3`, time: '02:00 PM - 05:00 PM', booked: 0, max: slotLimit, status: 'open' }
        ];
        this.saveCapacityData(capacity);
      }

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.upsertCatalogItem === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.upsertCatalogItem(item).catch(err => console.warn('[Store] Supabase addAttraction sync error:', err));
      }

      return catalog;
    },
    updateAttraction(id, updates) {
      const catalog = this.getCatalog();
      const idx = catalog.findIndex(a => a.id === id);
      if (idx !== -1) {
        const merged = { ...catalog[idx], ...updates };
        if (Array.isArray(merged.images)) {
          merged.images = merged.images.filter(u => u && !String(u).includes('images.unsplash.com/photo-')).slice(0, 5);
          if (merged.images.length === 0) merged.images = ['assets/no-image.svg'];
          if (!updates.image) merged.image = merged.images[0];
        }
        catalog[idx] = merged;
        this.saveCatalog(catalog);

        // Online Supabase Sync
        if (window.TourismHubSupabase && typeof TourismHubSupabase.upsertCatalogItem === 'function' && TourismHubSupabase.isReady()) {
          TourismHubSupabase.upsertCatalogItem(catalog[idx]).catch(err => console.warn('[Store] Supabase updateAttraction sync error:', err));
        }
      }
      return catalog;
    },
    deleteAttraction(id) {
      let catalog = this.getCatalog();
      catalog = catalog.filter(a => a.id !== id);
      this.saveCatalog(catalog);

      const capacity = this.getCapacityData();
      delete capacity[id];
      this.saveCapacityData(capacity);

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.deleteCatalogItem === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.deleteCatalogItem(id).catch(err => console.warn('[Store] Supabase deleteAttraction sync error:', err));
      }

      return catalog;
    },

    // 2. Capacity & Schedules
    getCapacityData() {
      return getItem(KEYS.CAPACITY, DEFAULT_CAPACITY);
    },
    saveCapacityData(capacity) {
      setItem(KEYS.CAPACITY, capacity);
    },
    updateSlot(attrId, slotId, updates) {
      const capacity = this.getCapacityData();
      if (capacity[attrId]) {
        const slot = capacity[attrId].find(s => s.id === slotId);
        if (slot) {
          Object.assign(slot, updates);
          this.saveCapacityData(capacity);
        }
      }
      return capacity;
    },
    recordSlotWalkIn(attrId, slotId, delta = 1) {
      const capacity = this.getCapacityData();
      if (capacity[attrId]) {
        const slot = capacity[attrId].find(s => s.id === slotId);
        if (slot) {
          slot.booked = Math.max(0, slot.booked + delta);
          this.saveCapacityData(capacity);
        }
      }
      return capacity;
    },

    // 3. Announcements & Advisories
    getAnnouncements() {
      return getItem(KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    },
    saveAnnouncements(list) {
      setItem(KEYS.ANNOUNCEMENTS, list);
    },
    addAnnouncement(ann) {
      const list = this.getAnnouncements();
      list.unshift(ann);
      this.saveAnnouncements(list);

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.insertAnnouncement === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.insertAnnouncement(ann).then(res => {
          if (res && res.success && res.data && res.data.id) {
            const curList = this.getAnnouncements();
            const targetItem = curList.find(a => a.id === ann.id || (a.title === ann.title && a.text === ann.text));
            if (targetItem) {
              targetItem.id = res.data.id;
              this.saveAnnouncements(curList);
            }
          }
        }).catch(err => console.warn('[Store] Supabase addAnnouncement sync error:', err));
      }

      return list;
    },
    dismissAnnouncement(id) {
      let list = this.getAnnouncements();
      list = list.filter(a => a.id !== id);
      this.saveAnnouncements(list);

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.deleteAnnouncement === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.deleteAnnouncement(id).catch(err => console.warn('[Store] Supabase dismissAnnouncement sync error:', err));
      }

      return list;
    },

    // 4. Tourist Passes
    getPasses() {
      return getItem(KEYS.PASSES, DEFAULT_PASSES);
    },
    getPassesArray() {
      const p = this.getPasses();
      return Array.isArray(p) ? p : Object.values(p || {});
    },
    isPassOwnedByUser(pass, user) {
      if (!pass || !user) return false;
      const activeUserId = user.id ? String(user.id).trim() : '';
      const passUserId = (pass.bookedByUserId || pass.userId) ? String(pass.bookedByUserId || pass.userId).trim() : '';
      if (activeUserId && passUserId && activeUserId === passUserId) return true;

      const activeEmail = (user.email || '').toLowerCase().trim();
      const bookedEmail = (pass.bookedByEmail || pass.visitorEmail || '').toLowerCase().trim();
      return Boolean(activeEmail && bookedEmail && activeEmail === bookedEmail);
    },
    getUserPasses(user) {
      const activeUser = user || this.getClientAuth() || this.getAdminAuth();
      if (!activeUser) return [];
      return this.getPassesArray().filter(pass => this.isPassOwnedByUser(pass, activeUser));
    },
    savePasses(passes) {
      setItem(KEYS.PASSES, passes);
    },
    addPass(pass) {
      const passes = this.getPasses();
      const code = String(pass.code || '').toUpperCase().trim();
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const enrichedPass = {
        ...pass,
        code,
        userId: pass.userId || activeUser?.id || null,
        bookedByUserId: pass.bookedByUserId || pass.userId || activeUser?.id || null,
        bookedByEmail: pass.bookedByEmail || activeUser?.email || pass.visitorEmail || '',
        visitorEmail: pass.visitorEmail || activeUser?.email || ''
      };
      passes[code] = enrichedPass;
      this.savePasses(passes);

      // If tied to an attraction, update capacity booked count
      if (pass.attractionId) {
        const capacity = this.getCapacityData();
        const slots = capacity[pass.attractionId];
        if (slots && slots.length > 0) {
          // Add to first matching or open slot
          slots[0].booked = (slots[0].booked || 0) + (pass.partySize || 1);
          this.saveCapacityData(capacity);
        }
      }

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.insertPass === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.insertPass(enrichedPass).catch(err => console.warn('[Store] Supabase addPass sync error:', err));
      }

      return enrichedPass;
    },
    validatePass(code) {
      const cleanCode = String(code || '').toUpperCase().trim();
      const passes = this.getPasses();
      const pass = passes[cleanCode];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const activeOperator = this.getAdminAuth();
      const scannedBy = activeOperator ? `${activeOperator.name} (${activeOperator.terminal || 'Express Gate'})` : 'Digital Gate Scanner';

      if (!pass) {
        this.addLog({
          time: nowTime,
          pass: cleanCode,
          visitor: 'Unknown Visitor',
          attraction: 'Unknown',
          party: '1 pax',
          result: 'Invalid (Unregistered)'
        });
        return { valid: false, status: 'invalid', message: 'Pass not found in system database' };
      }

      if (pass.status === 'expired') {
        this.addLog({
          time: nowTime,
          pass: cleanCode,
          visitor: pass.visitorName,
          attraction: pass.attraction,
          party: `${pass.partySize || 1} pax`,
          result: 'Denied (Expired)'
        });
        return { valid: false, status: 'expired', pass, message: 'Pass time-window expired' };
      }

      if (pass.status === 'already_used' || pass.status === 'already-used' || pass.status === 'used') {
        this.addLog({
          time: nowTime,
          pass: cleanCode,
          visitor: pass.visitorName,
          attraction: pass.attraction,
          party: `${pass.partySize || 1} pax`,
          result: 'Duplicate Denied'
        });
        return { valid: false, status: 'already_used', pass, message: 'Pass already scanned previously' };
      }

      // Mark pass as used locally
      pass.status = 'already_used';
      pass.checkedInAt = nowTime;
      this.savePasses(passes);

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.updatePassScanStatus === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.updatePassScanStatus(cleanCode, 'already_used', scannedBy).catch(err => console.warn('[Store] Supabase updatePassScanStatus error:', err));
      }

      this.addLog({
        time: nowTime,
        pass: cleanCode,
        visitor: pass.visitorName,
        attraction: pass.attraction,
        party: `${pass.partySize || 1} pax`,
        result: 'Approved'
      });

      return { valid: true, status: 'valid', pass, message: 'Access Granted • Attendance Logged' };
    },
    async validatePassAsync(code) {
      const cleanCode = String(code || '').toUpperCase().trim();
      // 1. Check live Supabase first if online so newly created passes on other devices are recognized immediately
      if (window.TourismHubSupabase && typeof TourismHubSupabase.getPassByCode === 'function' && TourismHubSupabase.isReady()) {
        try {
          const remotePass = await TourismHubSupabase.getPassByCode(cleanCode);
          if (remotePass) {
            const localPasses = this.getPasses();
            localPasses[cleanCode] = remotePass;
            this.savePasses(localPasses);
          }
        } catch (err) {
          console.warn('[Store] Live pass lookup warning:', err);
        }
      }
      return this.validatePass(cleanCode);
    },

    // 5. Entry Logs
    getLogs() {
      return getItem(KEYS.LOGS, DEFAULT_LOGS);
    },
    saveLogs(logs) {
      setItem(KEYS.LOGS, logs);
    },
    addLog(log) {
      const logs = this.getLogs();
      logs.unshift(log);
      if (logs.length > 50) logs.pop();
      this.saveLogs(logs);
      return logs;
    },

    // 6. Cross-Tab Real-Time Sync Listener
    onSync(callback) {
      window.addEventListener('storage', (e) => {
        if (Object.values(KEYS).includes(e.key)) {
          callback(e.key, e.newValue);
        }
      });
      window.addEventListener('tourismhub:sync', (e) => {
        callback(e.detail.key, e.detail.val);
      });
    },

    // 7. Authentication APIs
    getAdminUsers() {
      return DEFAULT_ADMIN_USERS;
    },
    getClientUsers() {
      const users = getItem(KEYS.CLIENT_USERS, DEFAULT_CLIENT_USERS);
      return Array.isArray(users) ? users.map(u => (isMockAvatarUrl(u?.avatar) ? { ...u, avatar: '' } : u)) : DEFAULT_CLIENT_USERS;
    },
    getAdminAuth() {
      const admin = getItem(KEYS.ADMIN_AUTH, null);
      if (admin && isMockAvatarUrl(admin.avatar)) {
        admin.avatar = '';
      }
      return admin;
    },
    setAdminAuth(user) {
      setItem(KEYS.ADMIN_AUTH, user);
    },
    getUserAvatar(user) {
      if (user && !isMockAvatarUrl(user.avatar)) {
        return user.avatar;
      }
      return this.generateInitialsAvatar(user && user.name ? user.name : 'User');
    },
    async adminLogin(email, password) {
      // 1. Try online Supabase profiles database first if connected
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          const onlineRes = await TourismHubSupabase.loginUser(email, password);
          if (onlineRes && onlineRes.success) {
            if (isMockAvatarUrl(onlineRes.user?.avatar)) {
              onlineRes.user.avatar = '';
            }
            this.setAdminAuth(onlineRes.user);
            return onlineRes;
          } else if (onlineRes && !onlineRes.success) {
            return onlineRes;
          }
        } catch (e) {
          console.warn('[Store] Online admin authentication error, checking local store:', e);
        }
      }

      // 2. Temporary local storage authentication fallback
      const users = this.getAdminUsers();
      const match = users.find(u => (u.email || '').toLowerCase().trim() === (email || '').toLowerCase().trim());
      if (!match) {
        return { success: false, message: 'Operator ID or email address not found in system directory.' };
      }
      const pwdOverrides = getItem(KEYS.ADMIN_PASSWORDS, {});
      const expectedPassword = (pwdOverrides && pwdOverrides[match.email.toLowerCase()]) || match.password;
      if (expectedPassword !== password) {
        return { success: false, message: 'Incorrect operator password. Please re-enter credentials.' };
      }
      const sessionUser = { ...match };
      delete sessionUser.password;
      sessionUser.authenticatedAt = new Date().toISOString();
      this.setAdminAuth(sessionUser);
      return { success: true, user: sessionUser };
    },
    adminLogout() {
      setItem(KEYS.ADMIN_AUTH, null);
      return { success: true };
    },
    getClientAuth() {
      const client = getItem(KEYS.CLIENT_AUTH, null);
      if (client && isMockAvatarUrl(client.avatar)) {
        client.avatar = '';
      }
      return client;
    },
    setClientAuth(user) {
      setItem(KEYS.CLIENT_AUTH, user);
    },
    async clientLogin(email, password) {
      // 1. Try online Supabase profiles database first if connected
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          const onlineRes = await TourismHubSupabase.loginUser(email, password);
          if (onlineRes && onlineRes.success) {
            if (isMockAvatarUrl(onlineRes.user?.avatar)) {
              onlineRes.user.avatar = '';
            }
            this.setClientAuth(onlineRes.user);
            return onlineRes;
          } else if (onlineRes && !onlineRes.success) {
            return onlineRes;
          }
        } catch (e) {
          console.warn('[Store] Online client authentication error, checking local store:', e);
        }
      }

      // 2. Temporary local storage authentication fallback
      const users = this.getClientUsers();
      const match = users.find(u => (u.email || '').toLowerCase().trim() === (email || '').toLowerCase().trim());
      if (!match) {
        return { success: false, message: 'No registered tourist account found with this email.' };
      }
      if (match.password !== password) {
        return { success: false, message: 'Invalid password. Please check your spelling and try again.' };
      }
      const sessionUser = { ...match };
      delete sessionUser.password;
      sessionUser.authenticatedAt = new Date().toISOString();
      this.setClientAuth(sessionUser);
      return { success: true, user: sessionUser };
    },
    async clientRegister(name, email, password, country, phone) {
      // 1. Try online Supabase profiles database first if connected
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          const onlineRes = await TourismHubSupabase.registerTourist(name, email, password, country, phone);
          if (onlineRes && onlineRes.success) {
            if (isMockAvatarUrl(onlineRes.user?.avatar)) {
              onlineRes.user.avatar = '';
            }
            this.setClientAuth(onlineRes.user);
            return onlineRes;
          } else if (onlineRes && !onlineRes.success) {
            return onlineRes;
          }
        } catch (e) {
          console.warn('[Store] Online client registration error, falling back to local store:', e);
        }
      }

      // 2. Temporary local storage registration fallback
      const users = this.getClientUsers();
      const existing = users.find(u => (u.email || '').toLowerCase().trim() === (email || '').toLowerCase().trim());
      if (existing) {
        return { success: false, message: 'An account with this email address already exists. Please log in.' };
      }
      const newUser = {
        id: 'client-' + Date.now(),
        name: (name || '').trim(),
        email: (email || '').trim().toLowerCase(),
        password: password,
        country: country || 'Philippines',
        phone: phone || '',
        badge: 'New Tourist Member',
        avatar: ''
      };
      users.push(newUser);
      setItem(KEYS.CLIENT_USERS, users);
      const sessionUser = { ...newUser };
      delete sessionUser.password;
      sessionUser.authenticatedAt = new Date().toISOString();
      this.setClientAuth(sessionUser);
      return { success: true, user: sessionUser };
    },
    clientLogout() {
      setItem(KEYS.CLIENT_AUTH, null);
      return { success: true };
    },
    generateInitialsAvatar(name) {
      const parts = String(name || 'User').trim().split(/\s+/).filter(Boolean);
      const initials = (parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : (parts[0] || 'U').slice(0, 2)).toUpperCase();
      const safeInitials = initials.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
      })[char]);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#0369a1"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(#grad)"/><text x="64" y="73" font-family="sans-serif" font-size="44" font-weight="400" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${safeInitials}</text></svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    },
    async changePassword(currentPassword, newPassword) {
      const admin = this.getAdminAuth();
      const client = this.getClientAuth();
      const activeUser = admin || client;
      if (!activeUser) {
        return { success: false, message: 'Sign in before changing your password.' };
      }

      const current = String(currentPassword || '');
      const next = String(newPassword || '');
      if (!current) {
        return { success: false, message: 'Enter your current password.' };
      }
      if (next.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters.' };
      }
      if (current === next) {
        return { success: false, message: 'New password must be different from your current password.' };
      }

      let synced = false;
      if (window.TourismHubSupabase && TourismHubSupabase.isReady() && typeof TourismHubSupabase.updateUserPassword === 'function') {
        const remoteRes = await TourismHubSupabase.updateUserPassword(activeUser.id || activeUser.email, current, next);
        if (remoteRes && !remoteRes.success && !remoteRes.notFound) {
          return remoteRes;
        }
        if (remoteRes && remoteRes.success) {
          synced = true;
        }
      }

      const emailLower = (activeUser.email || '').toLowerCase().trim();
      if (admin) {
        const pwdOverrides = getItem(KEYS.ADMIN_PASSWORDS, {}) || {};
        const adminSeed = DEFAULT_ADMIN_USERS.find(u => u.email.toLowerCase() === emailLower);
        const currentStored = pwdOverrides[emailLower] || (adminSeed ? adminSeed.password : null);
        if (!synced && currentStored !== null && currentStored !== current) {
          return { success: false, message: 'Current password is incorrect.' };
        }
        pwdOverrides[emailLower] = next;
        setItem(KEYS.ADMIN_PASSWORDS, pwdOverrides);
      } else {
        const users = this.getClientUsers();
        const match = users.find(u => (u.email || '').toLowerCase().trim() === emailLower || u.id === activeUser.id);
        if (match) {
          if (!synced && match.password !== current) {
            return { success: false, message: 'Current password is incorrect.' };
          }
          match.password = next;
          setItem(KEYS.CLIENT_USERS, users);
        } else if (!synced) {
          return { success: false, message: 'Account record could not be verified locally.' };
        }
      }

      return {
        success: true,
        synced,
        message: synced
          ? 'Password updated and synced to your account.'
          : 'Password updated successfully for this device.'
      };
    },
    async updateProfileAvatar(avatarUrl) {
      if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('data:image/')) {
        return { success: false, message: 'Choose a valid image before saving your profile photo.' };
      }

      const admin = this.getAdminAuth();
      const client = this.getClientAuth();
      const activeUser = admin || client;
      if (!activeUser) {
        return { success: false, message: 'Sign in before updating your profile photo.' };
      }

      const updatedUser = { ...activeUser, avatar: avatarUrl };
      if (admin) {
        this.setAdminAuth(updatedUser);
      } else {
        this.setClientAuth(updatedUser);
        const users = this.getClientUsers();
        const match = users.find(user => user.email === activeUser.email || user.id === activeUser.id);
        if (match) {
          match.avatar = avatarUrl;
          setItem(KEYS.CLIENT_USERS, users);
        }
      }

      let synced = false;
      let message = 'Profile photo saved on this device.';
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        const result = await TourismHubSupabase.updateUserProfileAvatar(activeUser.id || activeUser.email, avatarUrl);
        if (!result || !result.success) {
          message = `Photo saved on this device, but cloud sync failed: ${result && result.message ? result.message : 'Unknown database error'}`;
        } else {
          synced = true;
          message = 'Profile photo saved and synced.';
        }
      }

      window.dispatchEvent(new CustomEvent('tourismhub:avatarUpdated', {
        detail: { avatar: avatarUrl, user: updatedUser }
      }));
      return { success: true, avatar: avatarUrl, synced, message };
    },

    // =========================================================================
    // FAVORITES / WISHLIST MANAGEMENT
    // =========================================================================
    getFavorites() {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allFavs = getItem(KEYS.FAVORITES) || {};
      return Array.isArray(allFavs[userKey]) ? allFavs[userKey] : [];
    },

    isFavorite(attractionId) {
      if (!attractionId) return false;
      const favs = this.getFavorites();
      return favs.includes(attractionId);
    },

    toggleFavorite(attractionId) {
      if (!attractionId) return { isFavorite: false, favorites: [] };
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allFavs = getItem(KEYS.FAVORITES) || {};
      let userFavs = Array.isArray(allFavs[userKey]) ? [...allFavs[userKey]] : [];

      const idx = userFavs.indexOf(attractionId);
      let isFav = false;
      if (idx > -1) {
        userFavs.splice(idx, 1);
        isFav = false;
      } else {
        userFavs.push(attractionId);
        isFav = true;
      }

      allFavs[userKey] = userFavs;
      setItem(KEYS.FAVORITES, allFavs);
      return { isFavorite: isFav, favorites: userFavs };
    },

    removeFavorite(attractionId) {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allFavs = getItem(KEYS.FAVORITES) || {};
      let userFavs = Array.isArray(allFavs[userKey]) ? [...allFavs[userKey]] : [];

      const idx = userFavs.indexOf(attractionId);
      if (idx > -1) {
        userFavs.splice(idx, 1);
        allFavs[userKey] = userFavs;
        setItem(KEYS.FAVORITES, allFavs);
      }
      return userFavs;
    },

    // =========================================================================
    // ONLINE SUPABASE SYNCHRONIZATION (Catalog & Announcements)
    // =========================================================================
    async initOnlineSync() {
      if (!window.TourismHubSupabase || typeof TourismHubSupabase.isReady !== 'function' || !TourismHubSupabase.isReady()) {
        console.info('ℹ️ [Store] Running in offline mode (Supabase not configured or offline).');
        return;
      }

      try {
        console.log('⚡ [Store] Connecting to Supabase for live catalog and announcements synchronization...');

        // 1. Fetch live catalog from Supabase
        const remoteCatalog = await TourismHubSupabase.fetchCatalog();
        if (Array.isArray(remoteCatalog) && remoteCatalog.length > 0) {
          const localCatalog = getItem(KEYS.CATALOG, DEFAULT_CATALOG);
          const catalogMap = new Map();
          localCatalog.forEach(item => catalogMap.set(item.id, item));
          remoteCatalog.forEach(item => catalogMap.set(item.id, item));
          const merged = Array.from(catalogMap.values());
          setItem(KEYS.CATALOG, merged);
          console.log(`⚡ [Store] Catalog synchronized (${merged.length} items from Supabase & local cache).`);
        }

        // 2. Fetch live announcements from Supabase
        const remoteAnnouncements = await TourismHubSupabase.fetchAnnouncements();
        if (Array.isArray(remoteAnnouncements) && remoteAnnouncements.length > 0) {
          setItem(KEYS.ANNOUNCEMENTS, remoteAnnouncements);
          console.log(`⚡ [Store] Announcements synchronized (${remoteAnnouncements.length} broadcasts from Supabase).`);
        }

        // 3. Fetch live passes from Supabase
        const remotePasses = await TourismHubSupabase.fetchPasses();
        if (remotePasses && typeof remotePasses === 'object' && Object.keys(remotePasses).length > 0) {
          const localPasses = getItem(KEYS.PASSES, DEFAULT_PASSES);
          const mergedPasses = { ...localPasses, ...remotePasses };
          setItem(KEYS.PASSES, mergedPasses);
          console.log(`⚡ [Store] Passes synchronized (${Object.keys(mergedPasses).length} passes from Supabase & local cache).`);
        }

        // 4. Real-time subscription to postgres changes
        TourismHubSupabase.subscribeToChanges({
          onCatalogChange: async () => {
            const freshCatalog = await TourismHubSupabase.fetchCatalog();
            if (Array.isArray(freshCatalog) && freshCatalog.length > 0) {
              const localCatalog = getItem(KEYS.CATALOG, DEFAULT_CATALOG);
              const map = new Map();
              localCatalog.forEach(item => map.set(item.id, item));
              freshCatalog.forEach(item => map.set(item.id, item));
              setItem(KEYS.CATALOG, Array.from(map.values()));
            }
          },
          onAnnouncementChange: async () => {
            const freshAnnouncements = await TourismHubSupabase.fetchAnnouncements();
            if (Array.isArray(freshAnnouncements)) {
              setItem(KEYS.ANNOUNCEMENTS, freshAnnouncements);
            }
          },
          onPassChange: async () => {
            const freshPasses = await TourismHubSupabase.fetchPasses();
            if (freshPasses && typeof freshPasses === 'object') {
              const localPasses = getItem(KEYS.PASSES, DEFAULT_PASSES);
              setItem(KEYS.PASSES, { ...localPasses, ...freshPasses });
            }
          }
        });

        window.dispatchEvent(new CustomEvent('supabaseSyncComplete'));
      } catch (err) {
        console.warn('⚠️ [Store] Supabase synchronization warning:', err.message || err);
      }
    },

    // Reset to initial seed state
    resetAll() {
      setItem(KEYS.CATALOG, DEFAULT_CATALOG);
      setItem(KEYS.CAPACITY, DEFAULT_CAPACITY);
      setItem(KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
      setItem(KEYS.PASSES, DEFAULT_PASSES);
      setItem(KEYS.LOGS, DEFAULT_LOGS);
      setItem(KEYS.ADMIN_AUTH, null);
      setItem(KEYS.CLIENT_AUTH, null);
      setItem(KEYS.CLIENT_USERS, DEFAULT_CLIENT_USERS);
      setItem(KEYS.FAVORITES, {});
    }
  };

  window.TourismHubStore = TourismHubStore;

  // Auto-initialize Supabase sync on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        TourismHubStore.initOnlineSync();
      });
    } else {
      setTimeout(() => TourismHubStore.initOnlineSync(), 0);
    }
  }

})(window);
