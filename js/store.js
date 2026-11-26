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
    FEE_TIERS: 'tourismhub_temp_fee_tiers_v1',
    ADMIN_AUTH: 'tourismhub_temp_admin_auth_v1',
    ADMIN_PASSWORDS: 'tourismhub_temp_admin_passwords_v1',
    CLIENT_AUTH: 'tourismhub_temp_client_auth_v1',
    CLIENT_USERS: 'tourismhub_temp_client_users_v1',
    FAVORITES: 'tourismhub_temp_favorites_v1',
    ITINERARY: 'tourismhub_temp_itinerary_v1'
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

    const localFeeTiers = getItem(KEYS.FEE_TIERS, {});
    const resolvedFeeTiers = (Array.isArray(item.feeTiers) && item.feeTiers.length > 0)
      ? item.feeTiers
      : ((item.id && localFeeTiers && Array.isArray(localFeeTiers[item.id])) ? localFeeTiers[item.id] : []);
    if (item.id && Array.isArray(item.feeTiers) && item.feeTiers.length > 0) {
      const currentStored = localFeeTiers && localFeeTiers[item.id];
      if (JSON.stringify(currentStored) !== JSON.stringify(item.feeTiers)) {
        const nextTiers = (localFeeTiers && typeof localFeeTiers === 'object') ? { ...localFeeTiers } : {};
        nextTiers[item.id] = item.feeTiers;
        setItem(KEYS.FEE_TIERS, nextTiers);
      }
    }

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
      feeTiers: resolvedFeeTiers,
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

    const localFeeTiers = getItem(KEYS.FEE_TIERS, {});
    const resolvedFeeTiers = (Array.isArray(item.feeTiers) && item.feeTiers.length > 0)
      ? item.feeTiers
      : ((item.id && localFeeTiers && Array.isArray(localFeeTiers[item.id])) ? localFeeTiers[item.id] : []);
    if (item.id && Array.isArray(item.feeTiers) && item.feeTiers.length > 0) {
      const currentStored = localFeeTiers && localFeeTiers[item.id];
      if (JSON.stringify(currentStored) !== JSON.stringify(item.feeTiers)) {
        const nextTiers = (localFeeTiers && typeof localFeeTiers === 'object') ? { ...localFeeTiers } : {};
        nextTiers[item.id] = item.feeTiers;
        setItem(KEYS.FEE_TIERS, nextTiers);
      }
    }

    return {
      ...item,
      type: 'event',
      parentAttractionId: item.parentAttractionId || item.badge || '',
      attractionTitle: item.attractionTitle || item.category || 'Attraction Event',
      category: item.attractionTitle || item.category || 'Attraction Event',
      feeTiers: resolvedFeeTiers,
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

  // Default Seed Data (Zero mock records — populated live from Supabase)
  const DEFAULT_CATALOG = [];
  const DEFAULT_EVENTS = [];
  const DEFAULT_CAPACITY = {};
  const DEFAULT_ANNOUNCEMENTS = [];
  const DEFAULT_PASSES = {};
  const DEFAULT_LOGS = [];

  // In-memory fallback cache for when localStorage quota is exceeded (e.g. large base64 images)
  const memoryCache = new Map();

  // Persistent image cache for storing large Supabase base64 image strings across reloads
  const IMAGE_CACHE_PREFIX = 'tourismhub_img_';
  function saveCachedImage(id, dataUrl) {
    if (!id || !dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return;
    try {
      sessionStorage.setItem(IMAGE_CACHE_PREFIX + id, dataUrl);
    } catch (_) {}
  }
  function getCachedImage(id) {
    if (!id) return null;
    try {
      return sessionStorage.getItem(IMAGE_CACHE_PREFIX + id);
    } catch (_) {
      return null;
    }
  }

  // Helper Functions for Safe LocalStorage
  function getItem(key, defaultVal) {
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }
    try {
      const data = localStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : defaultVal;
      // Re-hydrate any stripped base64 images from sessionStorage
      if (key === KEYS.CATALOG && Array.isArray(parsed)) {
        const hydrated = parsed.map(item => {
          if (item && item.id && (!item.image || item.image === 'assets/no-image.svg')) {
            const cached = getCachedImage(item.id);
            if (cached) {
              return { ...item, image: cached, images: [cached] };
            }
          }
          return item;
        });
        if (data) memoryCache.set(key, hydrated);
        return hydrated;
      }
      if (data) memoryCache.set(key, parsed);
      return parsed;
    } catch (e) {
      console.warn('TourismHubStore: Failed to read from localStorage', e);
      return defaultVal;
    }
  }

  function setItem(key, val) {
    memoryCache.set(key, val);

    // If saving catalog with base64 images, save full image strings to sessionStorage first
    if (key === KEYS.CATALOG && Array.isArray(val)) {
      val.forEach(item => {
        if (item && item.id && item.image && item.image.startsWith('data:')) {
          saveCachedImage(item.id, item.image);
        }
      });
    }

    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('TourismHubStore: Failed to write to localStorage (relying on memory cache):', e);
      // Try stripped storage if catalog exceeds quota: store without large data URLs
      if (key === KEYS.CATALOG && Array.isArray(val)) {
        try {
          const stripped = val.map(item => ({
            ...item,
            image: (item.image && item.image.startsWith('data:')) ? 'assets/no-image.svg' : item.image,
            images: (Array.isArray(item.images))
              ? item.images.map(img => (img && img.startsWith('data:')) ? 'assets/no-image.svg' : img)
              : ['assets/no-image.svg']
          }));
          localStorage.setItem(key, JSON.stringify(stripped));
        } catch (_) {}
      }
    }
    // Dispatch a synthetic storage event for same-window listeners
    window.dispatchEvent(new CustomEvent('tourismhub:sync', { detail: { key, val } }));
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
        setItem(KEYS.CATALOG, cleanedCatalog);
      }

      const rawEvents = getItem(KEYS.EVENTS, null);
      if (Array.isArray(rawEvents)) {
        const cleanedEvents = rawEvents
          .filter(item => item && item.id && !LEGACY_REMOVED_IDS.has(item.id) && (item.parentAttractionId || item.badge))
          .map(normalizeEventItem);
        setItem(KEYS.EVENTS, cleanedEvents);
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
      const localCatalog = getItem(KEYS.CATALOG, [])
        .filter(item => item && item.id && item.type !== 'event' && item.type !== 'festival' && !LEGACY_REMOVED_IDS.has(item.id));
      const localMapById = new Map();
      localCatalog.forEach(item => localMapById.set(item.id, normalizeAttractionItem(item)));

      const catalogMap = new Map();
      remoteAttractionsRaw.forEach(rawRemote => {
        const existingLocal = localMapById.get(rawRemote.id);
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
      preloadAttractionImages(mergedCatalog);
    }

    setItem(KEYS.EVENTS, remoteEvents);
    preloadAttractionImages(remoteEvents);
  }

  // Preload image assets into browser cache to prevent layout jumps & sluggish rendering
  const preloadedImageUrls = new Set();
  function preloadImages(urls) {
    if (typeof window === 'undefined' || !Array.isArray(urls)) return;
    urls.forEach(url => {
      if (!url || typeof url !== 'string' || preloadedImageUrls.has(url)) return;
      preloadedImageUrls.add(url);
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      } catch (_) {}
    });
  }

  function preloadAttractionImages(items) {
    if (!Array.isArray(items)) return;
    const urls = [];
    items.forEach(item => {
      if (!item) return;
      if (item.image && typeof item.image === 'string' && !item.image.includes('images.unsplash.com/photo-')) {
        urls.push(item.image);
      }
      if (Array.isArray(item.images)) {
        item.images.forEach(img => {
          if (img && typeof img === 'string' && !img.includes('images.unsplash.com/photo-')) {
            urls.push(img);
          }
        });
      }
    });
    preloadImages(urls);
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
    preloadImages,
    preloadAttractionImages,
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
    // ITINERARY MANAGEMENT
    // =========================================================================
    getItinerary() {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allItin = getItem(KEYS.ITINERARY) || {};
      return Array.isArray(allItin[userKey]) ? allItin[userKey] : [];
    },

    isInItinerary(attractionId) {
      if (!attractionId) return false;
      return this.getItinerary().includes(attractionId);
    },

    toggleItinerary(attractionId) {
      if (!attractionId) return { inItinerary: false, itinerary: [] };
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allItin = getItem(KEYS.ITINERARY) || {};
      let userItin = Array.isArray(allItin[userKey]) ? [...allItin[userKey]] : [];

      const idx = userItin.indexOf(attractionId);
      let inItinerary = false;
      if (idx > -1) {
        userItin.splice(idx, 1);
        inItinerary = false;
      } else {
        userItin.push(attractionId);
        inItinerary = true;
      }

      allItin[userKey] = userItin;
      setItem(KEYS.ITINERARY, allItin);
      if (activeUser && activeUser.id && window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        TourismHubSupabase.updateUserLists(activeUser.id, { itinerary: userItin }).catch(() => {});
      }
      return { inItinerary, itinerary: userItin };
    },

    cancelPass(code) {
      const cleanCode = String(code || '').toUpperCase().trim();
      if (!cleanCode) return { success: false, message: 'Invalid pass code.' };
      const passes = this.getPasses();
      const target = passes.find(p => String(p.code || '').toUpperCase().trim() === cleanCode);
      if (!target) return { success: false, message: 'Pass not found.' };
      target.status = 'cancelled';
      setItem(KEYS.PASSES, passes);
      if (window.TourismHubSupabase && TourismHubSupabase.isReady() && typeof TourismHubSupabase.cancelPass === 'function') {
        TourismHubSupabase.cancelPass(cleanCode).catch(() => {});
      }
      return { success: true, pass: target };
    },

    removeFromItinerary(attractionId) {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allItin = getItem(KEYS.ITINERARY) || {};
      let userItin = Array.isArray(allItin[userKey]) ? [...allItin[userKey]] : [];
      const idx = userItin.indexOf(attractionId);
      if (idx > -1) {
        userItin.splice(idx, 1);
        allItin[userKey] = userItin;
        setItem(KEYS.ITINERARY, allItin);
      }
      return userItin;
    },

    moveItineraryItem(attractionId, direction) {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allItin = getItem(KEYS.ITINERARY) || {};
      let userItin = Array.isArray(allItin[userKey]) ? [...allItin[userKey]] : [];
      const idx = userItin.indexOf(attractionId);
      if (idx === -1) return userItin;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= userItin.length) return userItin;
      const temp = userItin[idx];
      userItin[idx] = userItin[targetIdx];
      userItin[targetIdx] = temp;
      allItin[userKey] = userItin;
      setItem(KEYS.ITINERARY, allItin);
      return userItin;
    },

    reorderItinerary(fromIdx, toIdx) {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allItin = getItem(KEYS.ITINERARY) || {};
      let userItin = Array.isArray(allItin[userKey]) ? [...allItin[userKey]] : [];
      if (fromIdx < 0 || toIdx < 0 || fromIdx >= userItin.length || toIdx >= userItin.length || fromIdx === toIdx) return userItin;
      const [moved] = userItin.splice(fromIdx, 1);
      userItin.splice(toIdx, 0, moved);
      allItin[userKey] = userItin;
      setItem(KEYS.ITINERARY, allItin);
      if (activeUser && activeUser.id && window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        TourismHubSupabase.updateUserLists(activeUser.id, { itinerary: userItin }).catch(() => {});
      }
      return userItin;
    },

    clearItinerary() {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allItin = getItem(KEYS.ITINERARY) || {};
      allItin[userKey] = [];
      setItem(KEYS.ITINERARY, allItin);
      const allVisited = getItem('tourismhub_temp_itinerary_visited_v1') || {};
      allVisited[userKey] = [];
      setItem('tourismhub_temp_itinerary_visited_v1', allVisited);
      if (activeUser && activeUser.id && window.TourismHubSupabase && TourismHubSupabase.isReady()) {
        TourismHubSupabase.updateUserLists(activeUser.id, { itinerary: [] }).catch(() => {});
      }
      return [];
    },

    getVisitedItinerary() {
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allVisited = getItem('tourismhub_temp_itinerary_visited_v1') || {};
      return Array.isArray(allVisited[userKey]) ? allVisited[userKey] : [];
    },

    toggleItineraryVisited(attractionId) {
      if (!attractionId) return [];
      const activeUser = this.getClientAuth() || this.getAdminAuth();
      const userKey = activeUser ? (activeUser.email || activeUser.id) : 'guest';
      const allVisited = getItem('tourismhub_temp_itinerary_visited_v1') || {};
      let list = Array.isArray(allVisited[userKey]) ? [...allVisited[userKey]] : [];
      const idx = list.indexOf(attractionId);
      if (idx > -1) list.splice(idx, 1);
      else list.push(attractionId);
      allVisited[userKey] = list;
      setItem('tourismhub_temp_itinerary_visited_v1', allVisited);
      return list;
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

    // =========================================================================
    // SYSTEM VERSION & CHANGELOG METADATA (Synced with todo.txt)
    // =========================================================================
    getSystemVersion() {
      return {
        version: 'v1.5.0',
        build: 'Build 2026.11.15',
        fullLabel: 'v1.5.0 (Build 2026.11.15)',
        releaseDate: 'November 15, 2026',
        channel: 'Production Stable'
      };
    },

    parseTodoTxtChangelog(rawText) {
      if (!rawText || typeof rawText !== 'string') {
        return this.getChangelogData();
      }
      const versionByDate = {
        '11/15/26': { version: 'v1.5.0', title: 'Carousels, Maps, Events Calendar & Portal Polish' },
        '11/14/26': { version: 'v1.4.0', title: 'Attraction Details, Storage Bucket & Portal Navigation' },
        '11/11/26': { version: 'v1.3.0', title: 'QR Ownership, Photo Cropper & Notifications' },
        '11/10/26': { version: 'v1.2.0', title: 'Supabase Synchronization, Peso Currency & Profile UI' },
        '11/07/26': { version: 'v1.1.0', title: 'Analytics Dashboard, Dark Mode & Admin Controls' }
      };

      const lines = rawText.split(/\r?\n/);
      const todoItems = [];
      const releasesMap = new Map();
      let inTodoSection = false;
      let currentRelease = null;
      let currentAuthor = '';

      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('------LEGEND')) {
          inTodoSection = false;
          continue;
        }
        if (trimmed === '#############################') {
          inTodoSection = false;
          continue;
        }
        if (/^TO-DO:/i.test(trimmed)) {
          inTodoSection = true;
          continue;
        }

        const doneMatch = trimmed.match(/^DONE\s+([0-9/]+)\s*-\s*(.+)$/i);
        if (doneMatch) {
          inTodoSection = false;
          const dateStr = doneMatch[1].trim();
          currentAuthor = doneMatch[2].trim();
          if (!releasesMap.has(dateStr)) {
            const meta = versionByDate[dateStr] || { version: 'v1.0.0', title: `Release ${dateStr}` };
            releasesMap.set(dateStr, {
              version: meta.version,
              date: dateStr,
              title: meta.title,
              authors: [currentAuthor],
              items: []
            });
          } else {
            const existing = releasesMap.get(dateStr);
            if (!existing.authors.includes(currentAuthor)) {
              existing.authors.push(currentAuthor);
            }
          }
          currentRelease = releasesMap.get(dateStr);
          continue;
        }

        const kindChar = trimmed[0];
        if (kindChar === '+' || kindChar === '-' || kindChar === '*') {
          const text = trimmed.slice(1).trim();
          if (!text) continue;
          const kind = kindChar === '+' ? 'add' : (kindChar === '-' ? 'remove' : 'change');
          if (inTodoSection) {
            todoItems.push({ kind, text });
          } else if (currentRelease) {
            currentRelease.items.push({ kind, text, author: currentAuthor });
          }
        }
      }

      const releases = Array.from(releasesMap.values());
      if (releases.length === 0) {
        return this.getChangelogData();
      }
      return {
        versionInfo: this.getSystemVersion(),
        todoItems,
        releases
      };
    },

    getChangelogData() {
      return {
        versionInfo: this.getSystemVersion(),
        todoItems: [
          { kind: 'add', text: 'NEW LOGO AND THEME' },
          { kind: 'add', text: 'QR PASSES (SUBJECT FOR INTEGRATION)' },
          { kind: 'add', text: 'USER PROFILE DATA (SUBJECT FOR INTEGRATION)' },
          { kind: 'add', text: 'MOBILE UI FRIENDLY' },
          { kind: 'change', text: 'FORGOT PASSWORD FIX' }
        ],
        releases: [
          {
            version: 'v1.5.0',
            date: '11/15/26',
            title: 'Carousels, Maps, Events Calendar & Portal Polish',
            authors: ['JACOB'],
            items: [
              { kind: 'add', text: 'ADMIN EVENT MANAGEMENT FOR EACH ATTRACTION', author: 'JACOB' },
              { kind: 'add', text: 'ADDED FEATURED EVENTS BANNER CAROUSEL AT TOP OF FEATURED ATTRACTIONS', author: 'JACOB' },
              { kind: 'add', text: 'ABOUT PAGE WITH OFFICIAL LOGO, PURPOSE, FEATURES & TEAM CREDITS', author: 'JACOB' },
              { kind: 'add', text: 'PROFILE NAVBAR DROPDOWN MENU WITH CLICKABLE AVATAR ICON', author: 'JACOB' },
              { kind: 'add', text: 'NOTIFICATIONS POPOVER DROPDOWN ACROSS ALL PAGES', author: 'JACOB' },
              { kind: 'add', text: 'TOURISMHUB BRAND & LOGO IMPLEMENTED ON NAVIGATION BAR OF ALL PAGES', author: 'JACOB' },
              { kind: 'add', text: 'GOOGLE MAPS EMBED ATTACHMENT IN ADMIN & LEFT-COLUMN INTERACTIVE MAP ON ATTRACTION DETAILS PAGE', author: 'JACOB' },
              { kind: 'add', text: 'INTERACTIVE MONTHLY EVENTS CALENDAR & DAILY SCHEDULE IN CAPACITY & SCHEDULE MANAGEMENT (PORTAL & ADMIN)', author: 'JACOB' },
              { kind: 'add', text: 'AUTOMATIC FEATURED LOCATIONS HERO CAROUSEL ON MAIN PAGE', author: 'JACOB' },
              { kind: 'add', text: 'ADMIN DASHBOARD CHANGELOG VIEW SYNCED WITH todo.txt & SYSTEM VERSION IN SETTINGS', author: 'JACOB' },
              { kind: 'remove', text: 'REMOVED PORTAL USER ROLE DISPLAYS ACROSS PORTAL HEADERS, DROPDOWNS & PROFILE PAGE', author: 'JACOB' },
              { kind: 'remove', text: 'REMOVED CALENDAR DROPDOWN FROM CAPACITY & SCHEDULE MANAGEMENT HEADER', author: 'JACOB' },
              { kind: 'remove', text: 'REMOVED USER NAME LABEL BESIDE NAVBAR PROFILE ICON ACROSS ALL PAGES', author: 'JACOB' },
              { kind: 'remove', text: 'REMOVED BADGE NUMBERS ON ADMIN NAVIGATION (ATTRACTION CATALOG, DISPATCH & ALERTS, HEADER BELL)', author: 'JACOB' },
              { kind: 'remove', text: 'CLEARED MOCK UPCOMING EVENTS & MOCK PORTAL CARDS; RENDERED LIVE EVENTS', author: 'JACOB' },
              { kind: 'change', text: 'SEPARATED ATTRACTIONS FROM EVENTS IN STORE & SUPABASE CATALOG', author: 'JACOB' },
              { kind: 'change', text: 'STANDARDIZED LOCATIONS TO MANILA OR QUEZON CITY & COMBINED CATEGORY FIELD', author: 'JACOB' },
              { kind: 'change', text: 'ENFORCED 1 PICTURE LIMIT PER ATTRACTION/EVENT', author: 'JACOB' },
              { kind: 'change', text: 'RENAMED DASHBOARD TO HOME IN ALL PORTAL SIDEBARS', author: 'JACOB' },
              { kind: 'change', text: 'FIXED ADMIN DASHBOARD BUTTONS IN DARK MODE & APPLIED BLUE HOVER THEME', author: 'JACOB' },
              { kind: 'change', text: 'ALIGNED NEW ANNOUNCEMENT BUTTON WITH ANNOUNCEMENTS & NOTIFICATIONS HEADER', author: 'JACOB' },
              { kind: 'change', text: 'SYNCED ATTRACTION DETAILS ADMISSION RATES & BOOKING MODAL FEES WITH ADMIN ADMISSION LABEL', author: 'JACOB' },
              { kind: 'change', text: 'CHANGED CAPACITY PAGE ADD SCHEDULE BUTTON & MODAL TO ADD EVENT', author: 'JACOB' },
              { kind: 'change', text: 'MOVED CAPACITY PAGE SORT DROPDOWN BESIDE FILTER TAB BUTTONS', author: 'JACOB' },
              { kind: 'change', text: 'LINKED CAPACITY VIEW MODAL BOOK TOURIST PASS BUTTON DIRECTLY TO ATTRACTION DETAILS PAGE', author: 'JACOB' }
            ]
          },
          {
            version: 'v1.4.0',
            date: '11/14/26',
            title: 'Attraction Details, Storage Bucket & Portal Navigation',
            authors: ['JACOB'],
            items: [
              { kind: 'add', text: 'ADD NO-IMAGE DEFAULT PICTURE', author: 'JACOB' },
              { kind: 'add', text: 'ADMIN FUNCTIONALITY TO UPLOAD IMAGES FOR LOCATIONS STORED AT SUPABASE', author: 'JACOB' },
              { kind: 'remove', text: 'REMOVED UNUSED LEGACY ADMIN-LOGIN ASSETS & MOCK UNSPLASH PICTURES', author: 'JACOB' },
              { kind: 'remove', text: 'REMOVED ACTIONS COLUMN IN ANNOUNCEMENTS AND NOTIFICATIONS', author: 'JACOB' },
              { kind: 'change', text: 'ATTRACTIONS CAROUSEL SUPABASE STORAGE BUCKET INTEGRATION', author: 'JACOB' },
              { kind: 'change', text: 'MADE ATTRACTION CARDS CLICKABLE TO VIEW DETAILS', author: 'JACOB' }
            ]
          },
          {
            version: 'v1.3.0',
            date: '11/11/26',
            title: 'QR Ownership, Photo Cropper & Notifications',
            authors: ['REPAS', 'JACOB'],
            items: [
              { kind: 'add', text: 'QR SCANNER SYSTEM', author: 'REPAS' },
              { kind: 'add', text: 'PROFILE PHOTO UPLOAD WITH INTERACTIVE CROPPER & 5MB LIMIT', author: 'JACOB' },
              { kind: 'add', text: 'DEFAULT INITIALS AVATAR BASED ON USER FIRST AND LAST NAME', author: 'JACOB' },
              { kind: 'add', text: 'SUPABASE PROFILES TABLE AVATAR SYNCHRONIZATION', author: 'JACOB' },
              { kind: 'add', text: 'EVENT BACKGROUND PHOTO UPLOAD FUNCTION WITH 5MB LIMIT & LIVE PREVIEW', author: 'JACOB' },
              { kind: 'change', text: 'FIXED QR PASS BEING DISPLAYED ON ALL USERS (OWNER-SCOPED)', author: 'JACOB' },
              { kind: 'change', text: 'LIMITED RECENT NOTIFICATIONS TO 4 WITH SEE MORE BUTTON TO NOTIFICATIONS PAGE', author: 'JACOB' }
            ]
          },
          {
            version: 'v1.2.0',
            date: '11/10/26',
            title: 'Supabase Synchronization, Peso Currency & Profile UI',
            authors: ['KELSEY', 'JACOB'],
            items: [
              { kind: 'add', text: 'CALENDAR SORT AND FILTER', author: 'KELSEY' },
              { kind: 'add', text: 'CLICKING PROFILE ICON AND NAME DIRECTS TO PROFILE PAGE', author: 'JACOB' },
              { kind: 'add', text: 'MORE SUPABASE INTEGRATIONS (CATALOG, ANNOUNCEMENTS)', author: 'JACOB' },
              { kind: 'add', text: 'CHANGE PASSWORD FUNCTION IN ACCOUNT AND SECURITY', author: 'JACOB' },
              { kind: 'remove', text: 'REMOVED MOCK ACCOUNTS, MOCK LOCATIONS & DISPLAY CURRENCY (PESO ONLY)', author: 'JACOB' },
              { kind: 'remove', text: 'REMOVED TURNSTILE INTEGRATION IN THE SYSTEM (NOT IN SCOPE)', author: 'JACOB' },
              { kind: 'change', text: 'FIXED FAQ DROPDOWN NOT WORKING & UPDATED PROFILE PAGE UI', author: 'JACOB' }
            ]
          },
          {
            version: 'v1.1.0',
            date: '11/07/26',
            title: 'Analytics Dashboard, Dark Mode & Admin Controls',
            authors: ['JACOB', 'REPAS'],
            items: [
              { kind: 'add', text: 'SIDEBAR IN PROFILE PAGE & PROFILE ICON IN HOMEPAGE', author: 'JACOB' },
              { kind: 'add', text: 'NEW BACKGROUND FOR LANDING PAGE', author: 'JACOB' },
              { kind: 'add', text: 'ADMIN DASHBOARD BUTTON & FAVORITES TAB IN PROFILE PAGE', author: 'REPAS' },
              { kind: 'add', text: 'WORKING ANALYTICS DASHBOARD (LIVE FIGURES, BREAKDOWN, CSV EXPORT)', author: 'REPAS' },
              { kind: 'add', text: 'TOP-RIGHT DARK MODE & LIGHT MODE TOGGLE BUTTON ACROSS PORTAL & ADMIN HEADERS', author: 'REPAS' },
              { kind: 'change', text: 'SUPABASE SYNCHRONIZATION FOR ANNOUNCEMENTS & CATALOG ITEMS', author: 'REPAS' },
              { kind: 'change', text: 'DARK MODE CONTRAST, INPUTS, MODALS & TABLE POLISH', author: 'REPAS' }
            ]
          }
        ]
      };
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

  // Auto-initialize Supabase sync and preload initial cached images on load
  if (typeof document !== 'undefined') {
    const triggerInitialPreload = () => {
      try {
        const cachedCatalog = TourismHubStore.getCatalog();
        const cachedEvents = TourismHubStore.getEvents();
        preloadAttractionImages(cachedCatalog);
        preloadAttractionImages(cachedEvents);
      } catch (_) {}
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        triggerInitialPreload();
        TourismHubStore.initOnlineSync();
      });
    } else {
      setTimeout(() => {
        triggerInitialPreload();
        TourismHubStore.initOnlineSync();
      }, 0);
    }
  }

})(window);


/* ==========================================================================
   Global On-Theme Modal Dialog Helper (Replaces native alert/confirm/prompt)
   ========================================================================== */
(function () {
  if (window.TourismHubDialog) return;

  function ensureDialogOverlay() {
    let overlay = document.getElementById('tourismHubDialogOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'tourismHubDialogOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:1rem;background:rgba(15,23,42,0.62);backdrop-filter:blur(4px);';
    overlay.innerHTML = `
      <div id="thDialogBox" style="width:100%;max-width:420px;background:var(--bg-card,#ffffff);color:var(--text-main,#0f172a);border:1px solid var(--border,#e2e8f0);border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,0.28);overflow:hidden;font-family:inherit;">
        <div style="padding:1.15rem 1.35rem 0.75rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;border-bottom:1px solid var(--border,#e2e8f0);">
          <h3 id="thDialogTitle" style="margin:0;font-size:1.05rem;font-weight:800;color:var(--text-main,#0f172a);">Notice</h3>
          <button type="button" id="thDialogCloseX" aria-label="Close" style="background:none;border:none;color:var(--text-muted,#64748b);font-size:1.4rem;line-height:1;cursor:pointer;padding:0.1rem 0.25rem;">&times;</button>
        </div>
        <div style="padding:1.15rem 1.35rem;">
          <p id="thDialogMessage" style="margin:0;font-size:0.92rem;line-height:1.55;color:var(--text-muted,#475569);white-space:pre-line;"></p>
          <input id="thDialogInput" type="text" style="display:none;width:100%;margin-top:0.9rem;padding:0.65rem 0.85rem;border:1px solid var(--border,#cbd5e1);border-radius:10px;background:var(--bg-page,#f8fafc);color:var(--text-main,#0f172a);font-family:inherit;font-size:0.92rem;box-sizing:border-box;" />
        </div>
        <div style="padding:0.85rem 1.35rem 1.15rem;display:flex;justify-content:flex-end;gap:0.6rem;">
          <button type="button" id="thDialogCancelBtn" style="padding:0.55rem 1.05rem;border-radius:10px;border:1px solid var(--border,#cbd5e1);background:var(--bg-page,#f8fafc);color:var(--text-main,#0f172a);font-weight:700;font-size:0.86rem;cursor:pointer;font-family:inherit;">Cancel</button>
          <button type="button" id="thDialogConfirmBtn" style="padding:0.55rem 1.15rem;border-radius:10px;border:none;background:#0284c7;color:#ffffff;font-weight:700;font-size:0.86rem;cursor:pointer;font-family:inherit;">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function openDialog(mode, message, opts) {
    const options = opts || {};
    return new Promise((resolve) => {
      const overlay = ensureDialogOverlay();
      const titleEl = overlay.querySelector('#thDialogTitle');
      const msgEl = overlay.querySelector('#thDialogMessage');
      const inputEl = overlay.querySelector('#thDialogInput');
      const cancelBtn = overlay.querySelector('#thDialogCancelBtn');
      const confirmBtn = overlay.querySelector('#thDialogConfirmBtn');
      const closeX = overlay.querySelector('#thDialogCloseX');

      titleEl.textContent = options.title || (mode === 'confirm' ? 'Confirm Action' : mode === 'prompt' ? 'Enter Value' : 'Notice');
      msgEl.textContent = String(message || '');

      if (mode === 'prompt') {
        inputEl.style.display = 'block';
        inputEl.type = options.inputType || 'text';
        inputEl.value = options.defaultValue !== undefined ? String(options.defaultValue) : '';
        inputEl.placeholder = options.placeholder || '';
      } else {
        inputEl.style.display = 'none';
        inputEl.value = '';
      }

      cancelBtn.style.display = mode === 'alert' ? 'none' : 'inline-flex';
      cancelBtn.textContent = options.cancelText || 'Cancel';
      confirmBtn.textContent = options.confirmText || (mode === 'alert' ? (options.okText || 'OK') : 'Confirm');
      confirmBtn.style.background = options.danger ? '#ef4444' : '#0284c7';

      let settled = false;
      function cleanup(val) {
        if (settled) return;
        settled = true;
        overlay.style.display = 'none';
        document.removeEventListener('keydown', onKeyDown);
        overlay.removeEventListener('click', onBackdropClick);
        cancelBtn.onclick = null;
        confirmBtn.onclick = null;
        closeX.onclick = null;
        resolve(val);
      }

      function onKeyDown(e) {
        if (e.key === 'Escape') {
          cleanup(mode === 'confirm' ? false : mode === 'prompt' ? null : undefined);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          cleanup(mode === 'confirm' ? true : mode === 'prompt' ? inputEl.value : undefined);
        }
      }

      function onBackdropClick(e) {
        if (e.target === overlay) {
          cleanup(mode === 'confirm' ? false : mode === 'prompt' ? null : undefined);
        }
      }

      cancelBtn.onclick = () => cleanup(mode === 'confirm' ? false : null);
      closeX.onclick = () => cleanup(mode === 'confirm' ? false : mode === 'prompt' ? null : undefined);
      confirmBtn.onclick = () => cleanup(mode === 'confirm' ? true : mode === 'prompt' ? inputEl.value : undefined);

      overlay.style.display = 'flex';
      document.addEventListener('keydown', onKeyDown);
      overlay.addEventListener('click', onBackdropClick);

      setTimeout(() => {
        if (mode === 'prompt') {
          inputEl.focus();
          inputEl.select();
        } else {
          confirmBtn.focus();
        }
      }, 20);
    });
  }

  window.TourismHubDialog = {
    alert: (message, options) => openDialog('alert', message, options),
    confirm: (message, options) => openDialog('confirm', message, options),
    prompt: (message, options) => openDialog('prompt', message, options)
  };
})();
