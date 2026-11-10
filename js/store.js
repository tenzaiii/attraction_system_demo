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
    CLIENT_AUTH: 'tourismhub_temp_client_auth_v1',
    CLIENT_USERS: 'tourismhub_temp_client_users_v1',
    FAVORITES: 'tourismhub_temp_favorites_v1'
  };

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
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
      terminal: 'MNL-HQ-01'
    },
    {
      id: 'admin-002',
      name: 'Carlos Mendoza',
      email: 'turnstile@tourismhub.gov.ph',
      password: 'gate2026',
      role: 'Receptionist',
      roleKey: 'officer',
      department: 'Luneta & Intramuros Entry Stations',
      badge: 'Field Security',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      terminal: 'GATE-01'
    }
  ];

  // Default Seed Client / Tourist Accounts
  const DEFAULT_CLIENT_USERS = [
    {
      id: 'client-001',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      password: 'tourist123',
      country: 'Philippines',
      phone: '+63 917 555 0192',
      badge: 'Verified Resident Tourist',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'
    },
    {
      id: 'client-002',
      name: 'Alex Tan',
      email: 'alex.tan@visitor.sg',
      password: 'tourist123',
      country: 'Singapore',
      phone: '+65 9123 4567',
      badge: 'International Explorer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
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
      price: 150,
      priceLabel: 'Free / Guided ₱150',
      admission: 'Free Entry / Guided ₱150',
      operatingHours: '06:00 AM - 09:00 PM',
      capacityPerSlot: 150,
      image: 'assets/rizal-monument.jpg',
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
      price: 200,
      priceLabel: 'Pass from ₱200',
      admission: 'Heritage Pass ₱200',
      operatingHours: '08:00 AM - 06:00 PM',
      capacityPerSlot: 120,
      image: 'assets/rizal-monument.jpg',
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
      price: 250,
      priceLabel: 'Day Pass ₱250',
      admission: 'Environmental Pass ₱250',
      operatingHours: '05:30 AM - 10:00 PM',
      capacityPerSlot: 200,
      image: 'assets/white-beach.jpg',
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
      price: 350,
      priceLabel: 'Event Access ₱350',
      admission: 'Special Event Access ₱350',
      operatingHours: '07:00 AM - 11:00 PM',
      capacityPerSlot: 300,
      image: 'assets/pahiyas-festival.jpg',
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
      price: 450,
      priceLabel: 'Tour Pass ₱450',
      admission: 'Eco-Tour Permit ₱450',
      operatingHours: '06:00 AM - 05:00 PM',
      capacityPerSlot: 90,
      image: 'assets/hero-banner.jpg',
      badge: 'World Wonder',
      location: 'El Nido, Palawan',
      status: 'active',
      description: 'Emerald lagoon surrounded by towering karst limestone cliffs with strictly monitored eco-kayak time limits.'
    },
    {
      id: 'sinulog-festival',
      title: 'Sinulog Grand Mardi Gras',
      category: 'Festival',
      type: 'festival',
      rating: '4.9',
      reviews: '1.5k',
      price: 300,
      priceLabel: 'Grandstand ₱300',
      admission: 'Grandstand Pass ₱300',
      operatingHours: '07:00 AM - 09:00 PM',
      capacityPerSlot: 250,
      image: 'assets/pahiyas-festival.jpg',
      badge: 'Cultural Fiesta',
      location: 'Cebu City, Cebu',
      status: 'active',
      description: 'The country\'s grandest cultural and religious celebration with synchronized street dancing and traditional beats.'
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
    'sinulog-festival': [
      { id: 'sn-1', time: '08:00 AM - 01:00 PM', booked: 240, max: 250, status: 'near-full' },
      { id: 'sn-2', time: '01:00 PM - 06:00 PM', booked: 248, max: 250, status: 'at-capacity' }
    ]
  };

  // Default Seed Data: Announcements & Advisories
  const DEFAULT_ANNOUNCEMENTS = [
    {
      id: 'ann-1',
      title: 'Tropical Storm Advisory: Gale Warning in Visayas',
      type: 'weather',
      priority: 'urgent',
      target: 'White Beach Eco-Tourism Reserve',
      text: 'Water activities temporarily suspended until 02:00 PM due to high swell alerts. Shoreline walkway remains open.',
      timestamp: '15 mins ago',
      active: true
    },
    {
      id: 'ann-2',
      title: 'Schedule Notice: Fort Santiago Evening Illumination Tour',
      type: 'schedule',
      priority: 'notice',
      target: 'Intramuros Walled City Heritage',
      text: 'Special historic twilight walk starts at 06:30 PM tonight at Plaza Roma gate. Passes valid at gate.',
      timestamp: '1 hour ago',
      active: true
    },
    {
      id: 'ann-3',
      title: 'Traffic Advisory: Lucban Town Perimeter Regulated',
      type: 'event',
      priority: 'warning',
      target: 'Pahiyas Harvest Festival',
      text: 'Designated tourist shuttle park-and-ride lot active at Diversion Road to prevent historic center congestion.',
      timestamp: '3 hours ago',
      active: true
    }
  ];

  // Default Seed Data: Pre-registered Tourist Passes
  const DEFAULT_PASSES = {
    'PASS-8842-MNL': {
      code: 'PASS-8842-MNL',
      visitorName: 'Juan Dela Cruz',
      visitorEmail: 'juan.delacruz@email.ph',
      partySize: 2,
      attractionId: 'rizal-monument',
      attraction: 'Rizal Monument & Luneta Park',
      slot: '11:00 AM - 02:00 PM',
      passType: 'Standard VIP Access',
      status: 'valid',
      amount: '₱300.00',
      validDate: 'Today'
    },
    'PASS-5120-BCY': {
      code: 'PASS-5120-BCY',
      visitorName: 'Maria Santos',
      visitorEmail: 'maria.s@worldmail.com',
      partySize: 1,
      attractionId: 'white-beach-boracay',
      attraction: 'White Beach Eco-Tourism Reserve',
      slot: '02:00 PM - 06:00 PM',
      passType: 'Eco Day Pass',
      status: 'valid',
      amount: '₱250.00',
      validDate: 'Today'
    },
    'PASS-9912-EXP': {
      code: 'PASS-9912-EXP',
      visitorName: 'Carlos Mendoza',
      visitorEmail: 'carlos.m@example.com',
      partySize: 3,
      attractionId: 'intramuros-walled-city',
      attraction: 'Intramuros Walled City Heritage',
      slot: '08:30 AM - 11:30 AM',
      passType: 'Morning Heritage Walk',
      status: 'expired',
      amount: '₱600.00',
      validDate: 'Yesterday (Expired)'
    },
    'PASS-3310-USD': {
      code: 'PASS-3310-USD',
      visitorName: 'Elena Rostova',
      visitorEmail: 'elena.rostova@travel.org',
      partySize: 2,
      attractionId: 'el-nido-big-lagoon',
      attraction: 'Big Lagoon Marine Sanctuary',
      slot: '07:00 AM - 10:00 AM',
      passType: 'Eco Kayak Permit',
      status: 'already_used',
      amount: '₱900.00',
      validDate: 'Today (Checked In 07:15 AM)'
    }
  };

  // Default Check-in Logs
  const DEFAULT_LOGS = [
    { time: '11:24 AM', pass: 'PASS-8842-MNL', visitor: 'Juan Dela Cruz', attraction: 'Rizal Monument', party: '2 pax', result: 'Approved' },
    { time: '11:15 AM', pass: 'PASS-7721-BCY', visitor: 'Grace Tan', attraction: 'White Beach', party: '4 pax', result: 'Approved' },
    { time: '10:58 AM', pass: 'PASS-9912-EXP', visitor: 'Carlos Mendoza', attraction: 'Intramuros', party: '3 pax', result: 'Denied (Expired)' },
    { time: '10:42 AM', pass: 'PASS-3310-USD', visitor: 'Elena Rostova', attraction: 'Big Lagoon', party: '2 pax', result: 'Duplicate Denied' },
    { time: '10:30 AM', pass: 'PASS-2210-PHS', visitor: 'Mateo Gomez', attraction: 'Pahiyas Festival', party: '1 pax', result: 'Approved' }
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
        catalog[idx] = { ...catalog[idx], ...updates };
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
    savePasses(passes) {
      setItem(KEYS.PASSES, passes);
    },
    addPass(pass) {
      const passes = this.getPasses();
      passes[pass.code] = pass;
      this.savePasses(passes);

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.insertPass === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.insertPass(pass).catch(err => console.warn('[Store] Supabase insertPass sync error:', err));
      }

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
      return pass;
    },
    validatePass(code) {
      const passes = this.getPasses();
      const pass = passes[code];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!pass) {
        this.addLog({
          time: nowTime,
          pass: code,
          visitor: 'Unknown Visitor',
          attraction: 'Unknown',
          party: '1 pax',
          result: 'Invalid (Unregistered)'
        });
        return { status: 'invalid', message: 'Pass not found in system database' };
      }

      if (pass.status === 'expired') {
        this.addLog({
          time: nowTime,
          pass: code,
          visitor: pass.visitorName,
          attraction: pass.attraction,
          party: `${pass.partySize} pax`,
          result: 'Denied (Expired)'
        });
        return { status: 'expired', pass, message: 'Pass time-window expired' };
      }

      if (pass.status === 'already_used') {
        this.addLog({
          time: nowTime,
          pass: code,
          visitor: pass.visitorName,
          attraction: pass.attraction,
          party: `${pass.partySize} pax`,
          result: 'Duplicate Denied'
        });
        return { status: 'already_used', pass, message: 'Pass already scanned previously' };
      }

      // Mark pass as used
      pass.status = 'already_used';
      pass.checkedInAt = nowTime;
      this.savePasses(passes);

      // Online Supabase Status Update
      if (window.TourismHubSupabase && typeof TourismHubSupabase.updatePassStatus === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.updatePassStatus(code, 'already_used').catch(err => console.warn('[Store] Supabase updatePassStatus sync error:', err));
      }

      this.addLog({
        time: nowTime,
        pass: code,
        visitor: pass.visitorName,
        attraction: pass.attraction,
        party: `${pass.partySize} pax`,
        result: 'Approved'
      });

      return { status: 'valid', pass, message: 'Access Granted • Attendance Logged' };
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
      return getItem(KEYS.CLIENT_USERS, DEFAULT_CLIENT_USERS);
    },
    getAdminAuth() {
      try {
        const data = sessionStorage.getItem(KEYS.ADMIN_AUTH) || localStorage.getItem(KEYS.ADMIN_AUTH);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },
    setAdminAuth(user) {
      try {
        if (user) {
          sessionStorage.setItem(KEYS.ADMIN_AUTH, JSON.stringify(user));
          localStorage.setItem(KEYS.ADMIN_AUTH, JSON.stringify(user));
        } else {
          sessionStorage.removeItem(KEYS.ADMIN_AUTH);
          localStorage.removeItem(KEYS.ADMIN_AUTH);
        }
        window.dispatchEvent(new CustomEvent('tourismhub:sync', { detail: { key: KEYS.ADMIN_AUTH, val: user } }));
      } catch (e) {}
    },
    async adminLogin(email, password) {
      // 1. Authenticate against Supabase profiles table
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          const onlineRes = await TourismHubSupabase.loginUser(email, password);
          if (onlineRes && onlineRes.success) {
            this.setAdminAuth(onlineRes.user);
            return onlineRes;
          } else if (onlineRes && !onlineRes.success) {
            return onlineRes;
          }
        } catch (e) {
          console.warn('[Store] Supabase admin authentication error:', e);
        }
      }

      // 2. Default directory fallback if Supabase not reached
      const users = this.getAdminUsers();
      const match = users.find(u => (u.email || '').toLowerCase().trim() === (email || '').toLowerCase().trim());
      if (!match) {
        return { success: false, message: 'Operator ID or email address not found in system directory.' };
      }
      if (match.password !== password) {
        return { success: false, message: 'Incorrect operator password. Please re-enter credentials.' };
      }
      const sessionUser = { ...match };
      delete sessionUser.password;
      sessionUser.authenticatedAt = new Date().toISOString();
      this.setAdminAuth(sessionUser);
      return { success: true, user: sessionUser };
    },
    adminLogout() {
      this.setAdminAuth(null);
      return { success: true };
    },
    getClientAuth() {
      try {
        const data = sessionStorage.getItem(KEYS.CLIENT_AUTH) || localStorage.getItem(KEYS.CLIENT_AUTH);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },
    setClientAuth(user) {
      try {
        if (user) {
          sessionStorage.setItem(KEYS.CLIENT_AUTH, JSON.stringify(user));
          localStorage.setItem(KEYS.CLIENT_AUTH, JSON.stringify(user));
        } else {
          sessionStorage.removeItem(KEYS.CLIENT_AUTH);
          localStorage.removeItem(KEYS.CLIENT_AUTH);
        }
        window.dispatchEvent(new CustomEvent('tourismhub:sync', { detail: { key: KEYS.CLIENT_AUTH, val: user } }));
      } catch (e) {}
    },
    async clientLogin(email, password) {
      // 1. Authenticate against Supabase profiles table
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          const onlineRes = await TourismHubSupabase.loginUser(email, password);
          if (onlineRes && onlineRes.success) {
            this.setClientAuth(onlineRes.user);
            return onlineRes;
          } else if (onlineRes && !onlineRes.success) {
            return onlineRes;
          }
        } catch (e) {
          console.warn('[Store] Supabase client authentication error:', e);
        }
      }

      // 2. Default directory fallback if Supabase not reached
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
      // 1. Register new user directly in Supabase profiles table
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          const onlineRes = await TourismHubSupabase.registerTourist(name, email, password, country, phone);
          if (onlineRes && onlineRes.success) {
            this.setClientAuth(onlineRes.user);
            return onlineRes;
          } else if (onlineRes && !onlineRes.success) {
            return onlineRes;
          }
        } catch (e) {
          console.warn('[Store] Supabase client registration error:', e);
        }
      }

      // 2. Fallback registration
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
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
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
      this.setClientAuth(null);
      return { success: true };
    },

    /**
     * Change user password across active session and Supabase profiles table
     */
    async changePassword(currentPassword, newPassword) {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      if (!activeUser) {
        return { success: false, message: 'You must be signed in to change your password.' };
      }

      if (!currentPassword) {
        return { success: false, message: 'Please enter your current password.' };
      }

      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long.' };
      }

      if (currentPassword === newPassword) {
        return { success: false, message: 'New password must be different from current password.' };
      }

      // 1. Try Supabase update
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          const res = await TourismHubSupabase.updateUserPassword(
            activeUser.id || activeUser.email,
            currentPassword,
            newPassword
          );
          if (res && res.success) {
            return res;
          } else if (res && !res.success) {
            return res;
          }
        } catch (e) {
          console.warn('[Store] Supabase password update warning:', e);
        }
      }

      // 2. Offline fallback check
      if (activeUser.roleKey === 'admin' || activeUser.roleKey === 'officer') {
        const admins = this.getAdminUsers();
        const match = admins.find(a => a.email === activeUser.email);
        if (match && match.password !== currentPassword) {
          return { success: false, message: 'Current password is incorrect.' };
        }
      } else {
        const clients = this.getClientUsers();
        const match = clients.find(c => c.email === activeUser.email);
        if (match && match.password !== currentPassword) {
          return { success: false, message: 'Current password is incorrect.' };
        }
        if (match) {
          match.password = newPassword;
          setItem(KEYS.CLIENT_USERS, clients);
        }
      }

      return { success: true, message: 'Password updated successfully!' };
    },

    /**
     * Generate initials SVG data URI from user's full name (e.g. Maria Santos -> MS)
     */
    generateInitialsAvatar(name) {
      const cleanName = String(name || 'User').trim();
      const parts = cleanName.split(/\s+/).filter(Boolean);
      let initials = 'U';
      if (parts.length === 1) {
        initials = parts[0].substring(0, 2).toUpperCase();
      } else if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }

      // Generate SVG data URI
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#grad)"/>
        <text x="64" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="46" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="1.5">${initials}</text>
      </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    },

    /**
     * Update user profile photo across session, local store, and Supabase profiles table
     */
    async updateProfileAvatar(avatarUrl) {
      const client = this.getClientAuth();
      const admin = this.getAdminAuth();
      const activeUser = admin || client;

      if (!activeUser) {
        return { success: false, message: 'No active session found.' };
      }

      activeUser.avatar = avatarUrl;
      if (admin) {
        this.setAdminAuth(activeUser);
      } else {
        this.setClientAuth(activeUser);
        // Also update local cached directory
        const clients = this.getClientUsers();
        const match = clients.find(c => c.email === activeUser.email || c.id === activeUser.id);
        if (match) {
          match.avatar = avatarUrl;
          setItem(KEYS.CLIENT_USERS, clients);
        }
      }

      // Sync to Supabase profiles table
      if (window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        try {
          await TourismHubSupabase.updateUserProfileAvatar(
            activeUser.id || activeUser.email,
            avatarUrl
          );
        } catch (e) {
          console.warn('[Store] Supabase avatar sync error:', e);
        }
      }

      // Broadcast update event so all open pages & tabs refresh their avatars immediately
      window.dispatchEvent(new CustomEvent('tourismhub:avatarUpdated', { detail: { avatar: avatarUrl, user: activeUser } }));
      window.dispatchEvent(new CustomEvent('tourismhub:sync', { detail: { type: 'avatar', user: activeUser } }));

      return { success: true, avatar: avatarUrl };
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

        // 1. Fetch live catalog from Supabase (sole source of truth)
        const remoteCatalog = await TourismHubSupabase.fetchCatalog();
        if (Array.isArray(remoteCatalog) && remoteCatalog.length > 0) {
          setItem(KEYS.CATALOG, remoteCatalog);
          console.log(`⚡ [Store] Catalog synchronized (${remoteCatalog.length} items directly from Supabase).`);
        }

        // 2. Fetch live announcements from Supabase
        const remoteAnnouncements = await TourismHubSupabase.fetchAnnouncements();
        if (Array.isArray(remoteAnnouncements)) {
          setItem(KEYS.ANNOUNCEMENTS, remoteAnnouncements);
          console.log(`⚡ [Store] Announcements synchronized (${remoteAnnouncements.length} broadcasts from Supabase).`);
        }

        // 3. Fetch live passes from Supabase
        if (typeof TourismHubSupabase.fetchPasses === 'function') {
          const remotePasses = await TourismHubSupabase.fetchPasses();
          if (Array.isArray(remotePasses)) {
            const passMap = {};
            remotePasses.forEach(p => {
              if (p && p.code) passMap[p.code] = p;
            });
            setItem(KEYS.PASSES, passMap);
            console.log(`⚡ [Store] Passes synchronized (${remotePasses.length} records from Supabase).`);
          }
        }

        // 4. Real-time subscription to postgres changes
        TourismHubSupabase.subscribeToChanges({
          onCatalogChange: async () => {
            const freshCatalog = await TourismHubSupabase.fetchCatalog();
            if (Array.isArray(freshCatalog) && freshCatalog.length > 0) {
              setItem(KEYS.CATALOG, freshCatalog);
            }
          },
          onAnnouncementChange: async () => {
            const freshAnnouncements = await TourismHubSupabase.fetchAnnouncements();
            if (Array.isArray(freshAnnouncements)) {
              setItem(KEYS.ANNOUNCEMENTS, freshAnnouncements);
            }
          },
          onPassChange: async () => {
            if (typeof TourismHubSupabase.fetchPasses === 'function') {
              const freshPasses = await TourismHubSupabase.fetchPasses();
              if (Array.isArray(freshPasses)) {
                const passMap = {};
                freshPasses.forEach(p => {
                  if (p && p.code) passMap[p.code] = p;
                });
                setItem(KEYS.PASSES, passMap);
              }
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
