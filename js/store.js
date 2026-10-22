/**
 * TourismHub - Centralized Shared State Store (Local Storage & Multi-Tab Synchronization)
 * Connects the Operator Admin Dashboard (admin.html) and Client Portal (index.html) in real-time.
 */

(function(window) {
  'use strict';

  // Storage Keys
  const KEYS = {
    CATALOG: 'tourismhub_catalog_v1',
    CAPACITY: 'tourismhub_capacity_v1',
    ANNOUNCEMENTS: 'tourismhub_announcements_v1',
    PASSES: 'tourismhub_passes_v1',
    LOGS: 'tourismhub_logs_v1'
  };

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
      priceLabel: 'Free / Guided $15',
      admission: 'Free Entry / Guided $15',
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
      price: 20,
      priceLabel: 'Pass from $20',
      admission: 'Heritage Pass $20',
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
      price: 25,
      priceLabel: 'Day Pass $25',
      admission: 'Environmental Pass $25',
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
      price: 35,
      priceLabel: 'Event Access $35',
      admission: 'Special Event Access $35',
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
      price: 45,
      priceLabel: 'Tour Pass $45',
      admission: 'Eco-Tour Permit $45',
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
      price: 30,
      priceLabel: 'Grandstand $30',
      admission: 'Grandstand Pass $30',
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
      amount: '$30.00',
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
      amount: '$25.00',
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
      amount: '$60.00',
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
      amount: '$90.00',
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
      return catalog;
    },
    updateAttraction(id, updates) {
      const catalog = this.getCatalog();
      const idx = catalog.findIndex(a => a.id === id);
      if (idx !== -1) {
        catalog[idx] = { ...catalog[idx], ...updates };
        this.saveCatalog(catalog);
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
      return list;
    },
    dismissAnnouncement(id) {
      let list = this.getAnnouncements();
      list = list.filter(a => a.id !== id);
      this.saveAnnouncements(list);
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

    // Reset to initial seed state
    resetAll() {
      setItem(KEYS.CATALOG, DEFAULT_CATALOG);
      setItem(KEYS.CAPACITY, DEFAULT_CAPACITY);
      setItem(KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
      setItem(KEYS.PASSES, DEFAULT_PASSES);
      setItem(KEYS.LOGS, DEFAULT_LOGS);
    }
  };

  window.TourismHubStore = TourismHubStore;

})(window);
