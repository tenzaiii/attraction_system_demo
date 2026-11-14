(function (window) {
  'use strict';

  // Temporary local cache keys
  const KEYS = {
    CATALOG: 'tourismhub_temp_catalog_v1',
    EVENTS: 'tourismhub_temp_events_v1',
    CAPACITY: 'tourismhub_temp_capacity_v1',
    ANNOUNCEMENTS: 'tourismhub_temp_announcements_v1',
    PASSES: 'tourismhub_temp_passes_v1',
    LOGS: 'tourismhub_temp_logs_v1',
    MAP_EMBEDS: 'tourismhub_temp_map_embeds_v1',
    ADMIN_AUTH: 'tourismhub_temp_admin_auth_v1',
    ADMIN_PASSWORDS: 'tourismhub_temp_admin_passwords_v1',
    CLIENT_AUTH: 'tourismhub_temp_client_auth_v1',
    CLIENT_USERS: 'tourismhub_temp_client_users_v1',
    FAVORITES: 'tourismhub_temp_favorites_v1'
  };

  const LEGACY_REMOVED_IDS = new Set(['pahiyas-festival', 'testing-testing', 'bayan-glori']);

  function formatLocalDateKey(dateObj) {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseNumericPriceFromLabel(label, fallbackPrice = 0) {
    if (typeof label === 'string') {
      const cleaned = label.replace(/,/g, '').trim();
      const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        return isNaN(val) ? 0 : val;
      }
      if (/\bfree\b/i.test(cleaned)) {
        return 0;
      }
    }
    if (typeof fallbackPrice === 'number' && !isNaN(fallbackPrice)) {
      return fallbackPrice;
    }
    const parsedFallback = parseFloat(fallbackPrice);
    return isNaN(parsedFallback) ? 0 : parsedFallback;
  }

  function normalizeMapEmbedUrl(rawInput, title = '', location = 'Manila') {
    const fallbackQuery = `${title || 'Metro Manila Attraction'}, ${location || 'Manila'}, Philippines`;
    const buildSearchEmbed = (q) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    if (!rawInput || typeof rawInput !== 'string') {
      return buildSearchEmbed(fallbackQuery);
    }

    let candidate = rawInput.trim();
    if (!candidate) {
      return buildSearchEmbed(fallbackQuery);
    }

    // Extract iframe src if full <iframe ...> HTML snippet was pasted
    const iframeMatch = candidate.match(/<iframe[^>]*src=["']([^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) {
      candidate = iframeMatch[1].replace(/&amp;/g, '&').trim();
    }

    // Reject unsafe protocols
    if (/^(javascript|data|vbscript):/i.test(candidate)) {
      return buildSearchEmbed(fallbackQuery);
    }

    if (/^https?:\/\//i.test(candidate)) {
      const lower = candidate.toLowerCase();
      if (lower.includes('/maps/embed') || lower.includes('output=embed')) {
        return candidate.replace(/^http:\/\//i, 'https://');
      }
      const coordMatch = candidate.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        return buildSearchEmbed(`${coordMatch[1]},${coordMatch[2]}`);
      }
      const placeMatch = candidate.match(/\/maps\/place\/([^/@?#]+)/i);
      if (placeMatch && placeMatch[1]) {
        return buildSearchEmbed(decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')));
      }
      try {
        const parsedUrl = new URL(candidate);
        const qParam = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query');
        if (qParam) return buildSearchEmbed(qParam);
      } catch (_) {}
      return buildSearchEmbed(fallbackQuery);
    }

    return buildSearchEmbed(candidate);
  }

  function extractEventDateKey(item) {
    if (!item) return '';
    const direct = typeof item === 'string' ? item : (item.eventDate || item.event_date || '');
    if (typeof direct === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(direct.trim())) {
      return direct.trim();
    }
    const priceDate = typeof item === 'object' ? (item.priceLabel || item.price_label || '') : '';
    if (typeof priceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(priceDate.trim())) {
      return priceDate.trim();
    }
    const text = typeof item === 'string' ? item : (item.operatingHours || item.schedule || '');
    if (!text) return '';

    const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const monthMap = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
      aug: 7, august: 7, sep: 8, sept: 8, september: 8,
      oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
    };
    const textDateMatch = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?/i);
    if (textDateMatch) {
      const mIdx = monthMap[textDateMatch[1].toLowerCase()];
      const day = parseInt(textDateMatch[2], 10);
      const year = textDateMatch[3] ? parseInt(textDateMatch[3], 10) : new Date().getFullYear();
      if (mIdx !== undefined && day >= 1 && day <= 31) {
        return formatLocalDateKey(new Date(year, mIdx, day));
      }
    }
    return '';
  }

  function normalizeLocation(loc) {
    const s = String(loc || '').toLowerCase();
    if (s.includes('quezon city') || s.includes('q.c.') || /\bqc\b/.test(s) || s.includes('diliman') || s.includes('bayan')) {
      return 'Quezon City';
    }
    return 'Manila';
  }

  function mapCategoryToType(category, fallbackType) {
    const key = String(category || fallbackType || '').toLowerCase();
    if (key.includes('historical')) return 'historical';
    if (key.includes('park') || key.includes('nature') || key.includes('eco')) return 'park';
    if (key.includes('museum') || key.includes('gallery')) return 'museum';
    if (key.includes('event') || key.includes('festival')) return 'event';
    return 'spot';
  }

  function normalizeCategoryLabel(category, type) {
    const key = String(category || type || '').toLowerCase();
    if (key.includes('historical')) return 'Historical Site';
    if (key.includes('park') || key.includes('nature') || key.includes('eco')) return 'Park & Nature';
    if (key.includes('museum') || key.includes('gallery')) return 'Museum & Gallery';
    return 'Tourist Spot';
  }

  function extractSingleImage(item) {
    const candidates = Array.isArray(item && item.images)
      ? item.images
      : (item && item.image ? [item.image] : []);
    const clean = candidates
      .filter(url => url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-'))
      .slice(0, 1);
    const primary = item && item.image && !String(item.image).includes('images.unsplash.com/photo-')
      ? item.image
      : (clean[0] || 'assets/no-image.svg');
    const images = clean.length > 0 ? clean : [primary];
    return { image: images[0], images };
  }

  function normalizeAttractionItem(item) {
    const { image, images } = extractSingleImage(item);
    const normalizedType = mapCategoryToType(item.category, item.type);
    const normalizedCategory = normalizeCategoryLabel(item.category, normalizedType);
    const normalizedLocation = normalizeLocation(item.location);

    const rawAdmissionInput = (typeof item.admission === 'string' && item.admission.trim())
      ? item.admission.trim()
      : ((typeof item.priceLabel === 'string' && item.priceLabel.trim()) ? item.priceLabel.trim() : '');
    const numericPrice = parseNumericPriceFromLabel(rawAdmissionInput, item.price);
    const syncedAdmission = (rawAdmissionInput || (numericPrice > 0 ? `₱${numericPrice}` : 'Free Admission'))
      .replace(/\$(\d+)/g, '₱$1');

    const localMaps = getItem(KEYS.MAP_EMBEDS, {});
    const localMapEntry = (item.id && localMaps && typeof localMaps === 'object') ? localMaps[item.id] : null;
    const hasExplicitRaw = typeof item.rawMapEmbed === 'string';
    const rawMapInput = hasExplicitRaw
      ? item.rawMapEmbed.trim()
      : String(item.mapEmbed || item.map_embed || (localMapEntry && (localMapEntry.raw || localMapEntry.embed)) || '').trim();
    const resolvedMapEmbed = normalizeMapEmbedUrl(rawMapInput, item.title || '', normalizedLocation);

    return {
      ...item,
      category: normalizedCategory,
      type: normalizedType,
      location: normalizedLocation,
      image,
      images,
      price: numericPrice,
      priceLabel: syncedAdmission,
      admission: syncedAdmission,
      rawMapEmbed: rawMapInput,
      mapEmbed: resolvedMapEmbed
    };
  }

  function persistLocalMapEmbed(attraction) {
    if (!attraction || !attraction.id) return;
    const localMaps = getItem(KEYS.MAP_EMBEDS, {});
    const next = (localMaps && typeof localMaps === 'object') ? { ...localMaps } : {};
    if (attraction.rawMapEmbed) {
      next[attraction.id] = {
        raw: attraction.rawMapEmbed,
        embed: attraction.mapEmbed || normalizeMapEmbedUrl(attraction.rawMapEmbed, attraction.title, attraction.location)
      };
    } else {
      delete next[attraction.id];
    }
    setItem(KEYS.MAP_EMBEDS, next);
  }

  function normalizeEventItem(item) {
    const { image, images } = extractSingleImage(item);
    const eventDate = extractEventDateKey(item);
    const rawAdmissionInput = (typeof item.admission === 'string' && item.admission.trim())
      ? item.admission.trim()
      : 'Free Entry';
    const syncedAdmission = rawAdmissionInput.replace(/\$(\d+)/g, '₱$1');
    const numericPrice = parseNumericPriceFromLabel(syncedAdmission, item.price);

    return {
      ...item,
      type: 'event',
      parentAttractionId: item.parentAttractionId || item.badge || '',
      attractionTitle: item.attractionTitle || item.category || 'Attraction Event',
      category: item.attractionTitle || item.category || 'Attraction Event',
      badge: item.parentAttractionId || item.badge || '',
      location: normalizeLocation(item.location),
      eventDate,
      operatingHours: item.operatingHours || item.schedule || 'TBA',
      capacityPerSlot: Number(item.capacityPerSlot || item.capacity || 100),
      image,
      images,
      price: numericPrice,
      priceLabel: eventDate || (typeof item.priceLabel === 'string' ? item.priceLabel.replace(/\$(\d+)/g, '₱$1') : syncedAdmission),
      admission: syncedAdmission
    };
  }

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

  // Default Seed Data: Attractions Catalog (Strictly Attractions)
  const DEFAULT_CATALOG = [
    {
      id: 'rizal-monument',
      title: 'Rizal Monument & Luneta Park',
      category: 'Historical Site',
      type: 'historical',
      rating: '4.8',
      reviews: '1.2k',
      price: 15,
      priceLabel: 'Free Entry / Guided ₱15',
      admission: 'Free Entry / Guided ₱15',
      operatingHours: '06:00 AM - 09:00 PM',
      capacityPerSlot: 150,
      image: 'assets/rizal-monument.jpg',
      images: ['assets/rizal-monument.jpg'],
      badge: 'Iconic Landmark',
      location: 'Manila',
      status: 'active',
      rawMapEmbed: 'Rizal Monument & Luneta Park, Ermita, Manila, Philippines',
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
      priceLabel: 'Heritage Pass ₱20',
      admission: 'Heritage Pass ₱20',
      operatingHours: '08:00 AM - 06:00 PM',
      capacityPerSlot: 120,
      image: 'assets/rizal-monument.jpg',
      images: ['assets/rizal-monument.jpg'],
      badge: 'UNESCO Heritage',
      location: 'Manila',
      status: 'active',
      rawMapEmbed: 'Intramuros, Manila, Philippines',
      description: 'Centuries of Spanish colonial history featuring stone ramparts, Fort Santiago, cobblestone roadways, and museum plazas.'
    },
    {
      id: 'qc-memorial-circle',
      title: 'Quezon Memorial Circle & Park',
      category: 'Park & Nature',
      type: 'park',
      rating: '4.8',
      reviews: '1.6k',
      price: 0,
      priceLabel: 'Free Admission',
      admission: 'Free Admission',
      operatingHours: '05:00 AM - 09:00 PM',
      capacityPerSlot: 200,
      image: 'assets/qc-memorial-circle.jpg',
      images: ['assets/qc-memorial-circle.jpg'],
      badge: 'QC Landmark',
      location: 'Quezon City',
      status: 'active',
      rawMapEmbed: 'Quezon Memorial Circle, Diliman, Quezon City, Philippines',
      description: 'Iconic elliptical park and national shrine in Quezon City featuring museums, landscaped gardens, and recreational trails.'
    },
    {
      id: 'la-mesa-ecopark',
      title: 'La Mesa Eco Park & Nature Reserve',
      category: 'Park & Nature',
      type: 'park',
      rating: '4.7',
      reviews: '940',
      price: 50,
      priceLabel: 'Eco Pass ₱50',
      admission: 'Eco Pass ₱50',
      operatingHours: '07:00 AM - 04:00 PM',
      capacityPerSlot: 150,
      image: 'assets/hero-banner.jpg',
      images: ['assets/hero-banner.jpg'],
      badge: 'Eco Sanctuary',
      location: 'Quezon City',
      status: 'active',
      rawMapEmbed: 'La Mesa Eco Park, Greater Lagro, Quezon City, Philippines',
      description: 'Lush urban watershed reserve in Quezon City offering shaded canopy trails, picnic groves, and guided nature walks.'
    },
    {
      id: 'national-museum-manila',
      title: 'National Museum Complex Manila',
      category: 'Museum & Gallery',
      type: 'museum',
      rating: '4.9',
      reviews: '2.4k',
      price: 0,
      priceLabel: 'Free Admission (Timed Pass)',
      admission: 'Free Admission (Timed Pass)',
      operatingHours: '09:00 AM - 06:00 PM',
      capacityPerSlot: 180,
      image: 'assets/hero-banner.jpg',
      images: ['assets/hero-banner.jpg'],
      badge: 'Cultural Gem',
      location: 'Manila',
      status: 'active',
      rawMapEmbed: 'National Museum of Fine Arts, Ermita, Manila, Philippines',
      description: 'Premier museum cluster in Manila showcasing fine arts, anthropology, and natural history collections.'
    }
  ];

  // Default Seed Data: Events (Strictly separate from Attractions; zero mock events)
  const DEFAULT_EVENTS = [];

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
    'qc-memorial-circle': [
      { id: 'qc-1', time: '06:00 AM - 10:00 AM', booked: 110, max: 200, status: 'open' },
      { id: 'qc-2', time: '10:00 AM - 02:00 PM', booked: 155, max: 200, status: 'open' },
      { id: 'qc-3', time: '02:00 PM - 06:00 PM', booked: 185, max: 200, status: 'near-full' }
    ],
    'la-mesa-ecopark': [
      { id: 'lm-1', time: '07:00 AM - 10:00 AM', booked: 95, max: 150, status: 'open' },
      { id: 'lm-2', time: '10:00 AM - 01:00 PM', booked: 132, max: 150, status: 'near-full' },
      { id: 'lm-3', time: '01:00 PM - 04:00 PM', booked: 60, max: 150, status: 'open' }
    ],
    'national-museum-manila': [
      { id: 'nm-1', time: '09:00 AM - 12:00 PM', booked: 120, max: 180, status: 'open' },
      { id: 'nm-2', time: '12:00 PM - 03:00 PM', booked: 168, max: 180, status: 'near-full' },
      { id: 'nm-3', time: '03:00 PM - 06:00 PM', booked: 90, max: 180, status: 'open' }
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
  if (!localStorage.getItem(KEYS.EVENTS)) {
    setItem(KEYS.EVENTS, DEFAULT_EVENTS);
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
        const cleanedCatalog = rawCatalog
          .filter(item => item && item.id && item.type !== 'event' && item.type !== 'festival' && !LEGACY_REMOVED_IDS.has(item.id))
          .map(normalizeAttractionItem);
        localStorage.setItem(KEYS.CATALOG, JSON.stringify(cleanedCatalog));
      }

      const rawEvents = getItem(KEYS.EVENTS, null);
      if (Array.isArray(rawEvents)) {
        const cleanedEvents = rawEvents
          .filter(item => item && item.id && !LEGACY_REMOVED_IDS.has(item.id) && (item.parentAttractionId || item.badge))
          .map(normalizeEventItem);
        localStorage.setItem(KEYS.EVENTS, JSON.stringify(cleanedEvents));
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

  function syncCatalogAndEventsFromRemote(remoteRows) {
    if (!Array.isArray(remoteRows)) return;
    const validRows = remoteRows.filter(item => item && item.id && !LEGACY_REMOVED_IDS.has(item.id) && item.type !== 'festival');
    const remoteAttractionsRaw = validRows.filter(item => item.type !== 'event');
    const remoteEvents = validRows.filter(item => item.type === 'event').map(normalizeEventItem);

    if (remoteAttractionsRaw.length > 0) {
      const localCatalog = getItem(KEYS.CATALOG, DEFAULT_CATALOG)
        .filter(item => item && item.id && item.type !== 'event' && item.type !== 'festival' && !LEGACY_REMOVED_IDS.has(item.id));
      const catalogMap = new Map();
      localCatalog.forEach(item => catalogMap.set(item.id, normalizeAttractionItem(item)));
      remoteAttractionsRaw.forEach(rawRemote => {
        const existingLocal = catalogMap.get(rawRemote.id);
        const mergedRaw = {
          ...(existingLocal || {}),
          ...rawRemote
        };
        if (!rawRemote.mapEmbed && !rawRemote.map_embed && !rawRemote.rawMapEmbed && existingLocal) {
          mergedRaw.rawMapEmbed = existingLocal.rawMapEmbed || existingLocal.mapEmbed || '';
        }
        const normalized = normalizeAttractionItem(mergedRaw);
        if (rawRemote.mapEmbed || rawRemote.map_embed || rawRemote.rawMapEmbed) {
          persistLocalMapEmbed(normalized);
        }
        catalogMap.set(rawRemote.id, normalized);
      });
      const mergedCatalog = Array.from(catalogMap.values());
      setItem(KEYS.CATALOG, mergedCatalog);
    }

    setItem(KEYS.EVENTS, remoteEvents);
  }

  // Public Store API
  const TourismHubStore = {
    // 1. Attractions Catalog
    getCatalog() {
      const raw = getItem(KEYS.CATALOG, DEFAULT_CATALOG);
      return Array.isArray(raw)
        ? raw.filter(item => item && item.id && item.type !== 'event' && item.type !== 'festival' && !LEGACY_REMOVED_IDS.has(item.id)).map(normalizeAttractionItem)
        : DEFAULT_CATALOG;
    },
    saveCatalog(catalog) {
      setItem(KEYS.CATALOG, catalog);
    },
    addAttraction(item) {
      const normalized = normalizeAttractionItem(item);
      persistLocalMapEmbed(normalized);
      const catalog = this.getCatalog();
      catalog.unshift(normalized);
      this.saveCatalog(catalog);

      // Also generate default capacity slots for this attraction
      const capacity = this.getCapacityData();
      if (!capacity[normalized.id]) {
        const slotLimit = normalized.capacityPerSlot || 150;
        capacity[normalized.id] = [
          { id: `${normalized.id}-1`, time: '08:00 AM - 11:00 AM', booked: 0, max: slotLimit, status: 'open' },
          { id: `${normalized.id}-2`, time: '11:00 AM - 02:00 PM', booked: 0, max: slotLimit, status: 'open' },
          { id: `${normalized.id}-3`, time: '02:00 PM - 05:00 PM', booked: 0, max: slotLimit, status: 'open' }
        ];
        this.saveCapacityData(capacity);
      }

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.upsertCatalogItem === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.upsertCatalogItem(normalized).catch(err => console.warn('[Store] Supabase addAttraction sync error:', err));
      }

      return catalog;
    },
    updateAttraction(id, updates) {
      const catalog = this.getCatalog();
      const idx = catalog.findIndex(a => a.id === id);
      if (idx !== -1) {
        const merged = normalizeAttractionItem({ ...catalog[idx], ...updates });
        persistLocalMapEmbed(merged);
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
      persistLocalMapEmbed({ id, rawMapEmbed: '' });

      // Cascade delete any events belonging to this attraction
      const existingEvents = this.getEvents();
      const removedEvents = existingEvents.filter(ev => ev.parentAttractionId === id);
      if (removedEvents.length > 0) {
        this.saveEvents(existingEvents.filter(ev => ev.parentAttractionId !== id));
      }

      const capacity = this.getCapacityData();
      delete capacity[id];
      this.saveCapacityData(capacity);

      // Online Supabase Sync
      if (window.TourismHubSupabase && typeof TourismHubSupabase.deleteCatalogItem === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.deleteCatalogItem(id).catch(err => console.warn('[Store] Supabase deleteAttraction sync error:', err));
        removedEvents.forEach(ev => {
          TourismHubSupabase.deleteCatalogItem(ev.id).catch(err => console.warn('[Store] Supabase cascade deleteEvent error:', err));
        });
      }

      return catalog;
    },

    // 1b. Attraction Events (Separated from Attractions)
    getEvents(attractionId = null) {
      const raw = getItem(KEYS.EVENTS, DEFAULT_EVENTS);
      const list = Array.isArray(raw)
        ? raw.filter(item => item && item.id && !LEGACY_REMOVED_IDS.has(item.id)).map(normalizeEventItem)
        : [];
      if (attractionId) {
        return list.filter(ev => ev.parentAttractionId === attractionId);
      }
      return list;
    },
    getEventsByDate(dateStr) {
      if (!dateStr) return this.getEvents();
      return this.getEvents().filter(ev => extractEventDateKey(ev) === dateStr);
    },
    formatLocalDateKey,
    parseNumericPriceFromLabel,
    normalizeMapEmbedUrl,
    extractEventDateKey,
    saveEvents(events) {
      setItem(KEYS.EVENTS, events);
    },
    addEvent(eventItem) {
      const normalized = normalizeEventItem(eventItem);
      const events = this.getEvents();
      events.unshift(normalized);
      this.saveEvents(events);

      if (window.TourismHubSupabase && typeof TourismHubSupabase.upsertCatalogItem === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.upsertCatalogItem(normalized).catch(err => console.warn('[Store] Supabase addEvent sync error:', err));
      }
      return events;
    },
    updateEvent(id, updates) {
      const events = this.getEvents();
      const idx = events.findIndex(e => e.id === id);
      if (idx !== -1) {
        const merged = normalizeEventItem({ ...events[idx], ...updates });
        events[idx] = merged;
        this.saveEvents(events);

        if (window.TourismHubSupabase && typeof TourismHubSupabase.upsertCatalogItem === 'function' && TourismHubSupabase.isReady()) {
          TourismHubSupabase.upsertCatalogItem(merged).catch(err => console.warn('[Store] Supabase updateEvent sync error:', err));
        }
      }
      return events;
    },
    deleteEvent(id) {
      let events = this.getEvents();
      events = events.filter(e => e.id !== id);
      this.saveEvents(events);

      if (window.TourismHubSupabase && typeof TourismHubSupabase.deleteCatalogItem === 'function' && TourismHubSupabase.isReady()) {
        TourismHubSupabase.deleteCatalogItem(id).catch(err => console.warn('[Store] Supabase deleteEvent sync error:', err));
      }
      return events;
    },
    normalizeLocation,
    mapCategoryToType,

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

        // 1. Fetch live catalog (attractions & events) from Supabase
        const remoteCatalog = await TourismHubSupabase.fetchCatalog();
        if (Array.isArray(remoteCatalog)) {
          syncCatalogAndEventsFromRemote(remoteCatalog);
          console.log(`⚡ [Store] Attractions & Events synchronized (${remoteCatalog.length} Supabase records).`);
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
            if (Array.isArray(freshCatalog)) {
              syncCatalogAndEventsFromRemote(freshCatalog);
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
      setItem(KEYS.EVENTS, DEFAULT_EVENTS);
      setItem(KEYS.CAPACITY, DEFAULT_CAPACITY);
      setItem(KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
      setItem(KEYS.PASSES, DEFAULT_PASSES);
      setItem(KEYS.LOGS, DEFAULT_LOGS);
      setItem(KEYS.ADMIN_AUTH, null);
      setItem(KEYS.CLIENT_AUTH, null);
      setItem(KEYS.CLIENT_USERS, DEFAULT_CLIENT_USERS);
      setItem(KEYS.FAVORITES, {});
      setItem(KEYS.MAP_EMBEDS, {});
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
