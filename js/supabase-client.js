// supabaseconnection

(function (window) {
  'use strict';

  const config = window.SUPABASE_CONFIG || {};
  let supabaseClient = null;

  // Validate configuration: check if URL and anonKey are populated and not default templates
  const isDummyConfig = !config.url ||
    config.url.includes('xxxxxxxxxxxxxxxxxxxx') ||
    !config.anonKey ||
    config.anonKey.includes('your-anon-key');

  if (window.supabase && typeof window.supabase.createClient === 'function' && !isDummyConfig) {
    try {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      console.log('⚡ [TourismHub] Supabase client connected to project:', config.url);
    } catch (err) {
      console.error('❌ [TourismHub] Failed to initialize Supabase client:', err);
    }
  } else {
    console.info('ℹ️ [TourismHub] Running in offline demo mode. Fill in credentials in js/supabase-config.js to connect to live Supabase.');
  }

  const TourismHubSupabase = {
    /**
     * Check if Supabase client is connected and configured
     */
    isReady() {
      return Boolean(supabaseClient);
    },

    getClient() {
      return supabaseClient;
    },

    /**
     * Test connection to the profiles table
     */
    async testConnection() {
      if (!supabaseClient) {
        return { success: false, message: 'Supabase client is not configured with live credentials in js/supabase-config.js.' };
      }
      try {
        const { data, error } = await supabaseClient.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        return { success: true, message: 'Connected to Supabase database successfully!' };
      } catch (err) {
        return { success: false, message: err.message || 'Database connection error' };
      }
    },

    // =========================================================================
    // USER PROFILE & AUTHENTICATION (Online Database Integration)
    // =========================================================================

    /**
     * Fetch user profile by email from Supabase `profiles` table
     */
    async getProfileByEmail(email) {
      if (!supabaseClient) return null;
      try {
        const cleanEmail = (email || '').trim().toLowerCase();
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (error) {
          console.warn('[Supabase] getProfileByEmail error:', error.message);
          return null;
        }
        return data;
      } catch (e) {
        console.error('[Supabase] Network error in getProfileByEmail:', e);
        return null;
      }
    },

    /**
     * Authenticate user credentials against Supabase `profiles` table
     */
    async loginUser(email, password) {
      if (!supabaseClient) {
        return null; // Return null so TourismHubStore falls back to local demo accounts
      }

      try {
        const cleanEmail = (email || '').trim().toLowerCase();
        const profile = await this.getProfileByEmail(cleanEmail);

        if (!profile) {
          return { 
            success: false, 
            message: 'No registered user profile found with this email in the database.' 
          };
        }

        if (profile.password_hash !== password) {
          return { 
            success: false, 
            message: 'Incorrect password. Please verify your credentials and try again.' 
          };
        }

        const roleKey = profile.role_key || profile.role || 'tourist';
        const rawAvatar = profile.avatar && !String(profile.avatar).includes('images.unsplash.com/photo-') ? profile.avatar : '';
        const sessionUser = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role || 'tourist',
          roleKey: roleKey,
          department: profile.department || '',
          badge: profile.badge || (roleKey === 'admin' ? 'Chief Operator' : roleKey === 'officer' ? 'Field Security' : 'Verified Tourist'),
          country: profile.country || 'Philippines',
          phone: profile.phone || '',
          avatar: rawAvatar,
          terminal: profile.terminal || null,
          authenticatedAt: new Date().toISOString()
        };

        return { success: true, user: sessionUser };
      } catch (err) {
        return { 
          success: false, 
          message: 'Database authentication error: ' + (err.message || 'Network failure') 
        };
      }
    },

    /**
     * Register new tourist user in Supabase `profiles` table
     */
    async registerTourist(name, email, password, country, phone) {
      if (!supabaseClient) {
        return null; // Return null to fall back to local demo registration
      }

      try {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanName = (name || '').trim();

        // 1. Check if profile already exists
        const existing = await this.getProfileByEmail(cleanEmail);
        if (existing) {
          return { 
            success: false, 
            message: 'An account with this email address already exists. Please sign in instead.' 
          };
        }

        // 2. Insert new profile into public.profiles
        const newProfile = {
          name: cleanName,
          email: cleanEmail,
          password_hash: password,
          role: 'tourist',
          role_key: 'tourist',
          country: country || 'Philippines',
          phone: phone || '',
          badge: 'New Tourist Member',
          avatar: ''
        };

        const { data, error } = await supabaseClient
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (error) {
          console.error('[Supabase] Registration insert error:', error);
          throw error;
        }

        const sessionUser = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role || 'tourist',
          roleKey: data.role_key || 'tourist',
          country: data.country,
          phone: data.phone,
          badge: data.badge || 'Verified Tourist',
          avatar: data.avatar,
          authenticatedAt: new Date().toISOString()
        };

        return { success: true, user: sessionUser };
      } catch (err) {
        return { 
          success: false, 
          message: 'Registration failed: ' + (err.message || 'Database error occurred') 
        };
      }
    },

    async updateUserProfileAvatar(emailOrId, avatarUrl) {
      if (!supabaseClient) {
        return { success: false, message: 'Database client is not connected.' };
      }
      if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('data:image/')) {
        return { success: false, message: 'The profile photo data is invalid.' };
      }

      try {
        const identity = String(emailOrId || '').trim();
        if (!identity) {
          return { success: false, message: 'The signed-in profile could not be identified.' };
        }

        let query = supabaseClient.from('profiles').select('id');
        query = identity.includes('@')
          ? query.ilike('email', identity.toLowerCase())
          : query.eq('id', identity);
        const { data: profile, error: lookupError } = await query.maybeSingle();
        if (lookupError) throw lookupError;
        if (!profile) {
          return { success: false, message: 'The profile was not found in the database.' };
        }

        const { data: updatedProfile, error: updateError } = await supabaseClient
          .from('profiles')
          .update({ avatar: avatarUrl, updated_at: new Date().toISOString() })
          .eq('id', profile.id)
          .select('id')
          .maybeSingle();
        if (updateError) throw updateError;
        if (!updatedProfile) {
          return { success: false, message: 'The database did not update this profile photo.' };
        }

        return { success: true, avatar: avatarUrl };
      } catch (error) {
        console.error('[Supabase] Profile photo update failed:', error);
        return { success: false, message: error.message || 'The database could not save the profile photo.' };
      }
    },

    async updateUserPassword(emailOrId, currentPassword, newPassword) {
      if (!supabaseClient) {
        return { success: false, message: 'Database client is not connected.' };
      }
      try {
        const identity = String(emailOrId || '').trim();
        if (!identity) {
          return { success: false, message: 'The signed-in profile could not be identified.' };
        }

        let query = supabaseClient.from('profiles').select('id, password_hash');
        query = identity.includes('@')
          ? query.ilike('email', identity.toLowerCase())
          : query.eq('id', identity);
        const { data: profile, error: lookupError } = await query.maybeSingle();
        if (lookupError) throw lookupError;
        if (!profile) {
          return { success: false, notFound: true, message: 'The profile was not found in the database.' };
        }

        if (profile.password_hash !== currentPassword) {
          return { success: false, message: 'Current password is incorrect.' };
        }

        const { data: updatedProfile, error: updateError } = await supabaseClient
          .from('profiles')
          .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
          .eq('id', profile.id)
          .select('id')
          .maybeSingle();
        if (updateError) throw updateError;
        if (!updatedProfile) {
          return { success: false, message: 'The database did not update the password.' };
        }

        return { success: true };
      } catch (error) {
        console.error('[Supabase] Password update failed:', error);
        return { success: false, message: error.message || 'Could not update password in database.' };
      }
    },

    // =========================================================================
    // CATALOG & ATTRACTIONS DATA (Supabase Sync)
    // =========================================================================

    /**
     * Map database row (snake_case) to client attraction object (camelCase)
     */
    mapCatalogFromDb(row) {
      if (!row) return null;
      return {
        id: row.id,
        title: row.title || '',
        category: row.category || 'Tourist Spot',
        type: row.type || 'attraction',
        status: row.status || 'active',
        rating: row.rating ? String(row.rating) : '4.8',
        reviews: row.reviews ? String(row.reviews) : '1.2k',
        price: row.price !== null && row.price !== undefined ? Number(row.price) : 20,
        priceLabel: (row.price_label ? String(row.price_label).replace(/\$(\d+)/g, '₱$1') : null) || (row.price ? `₱${row.price}` : 'Free'),
        admission: (row.admission ? String(row.admission).replace(/\$(\d+)/g, '₱$1') : 'Standard Admission'),
        operatingHours: row.operating_hours || '08:00 AM - 06:00 PM',
        capacityPerSlot: row.capacity_per_slot || 100,
        image: row.image || 'assets/hero-banner.jpg',
        location: row.location || 'Metro Manila',
        badge: row.badge || 'Featured',
        description: row.description || '',
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    },

    /**
     * Map client attraction object (camelCase) to database row (snake_case)
     */
    mapCatalogToDb(item) {
      if (!item) return null;
      const priceVal = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
      return {
        id: String(item.id || 'attraction-' + Date.now()),
        title: item.title || '',
        category: item.category || 'Tourist Spot',
        type: item.type || 'attraction',
        status: item.status || 'active',
        rating: String(item.rating || '4.8'),
        reviews: String(item.reviews || '100'),
        price: priceVal,
        price_label: item.priceLabel || item.price_label || (priceVal ? `₱${priceVal}` : 'Free'),
        admission: item.admission || 'Standard Admission',
        operating_hours: item.operatingHours || item.operating_hours || '08:00 AM - 06:00 PM',
        capacity_per_slot: Number(item.capacityPerSlot || item.capacity_per_slot || 100),
        image: item.image || 'assets/hero-banner.jpg',
        location: item.location || 'Metro Manila',
        badge: item.badge || 'Featured',
        description: item.description || ''
      };
    },

    /**
     * Fetch catalog items from Supabase `catalog` table
     */
    async fetchCatalog() {
      if (!supabaseClient) return null;
      try {
        const { data, error } = await supabaseClient
          .from('catalog')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!Array.isArray(data)) return [];
        return data.map(row => this.mapCatalogFromDb(row));
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to fetch catalog:', err.message);
        return null;
      }
    },

    /**
     * Save/Insert or Update an attraction in Supabase `catalog`
     */
    async upsertCatalogItem(item) {
      if (!supabaseClient) return null;
      try {
        const dbPayload = this.mapCatalogToDb(item);
        const { data, error } = await supabaseClient
          .from('catalog')
          .upsert([dbPayload], { onConflict: 'id' })
          .select();

        if (error) throw error;
        const saved = (data && data[0]) ? this.mapCatalogFromDb(data[0]) : item;
        console.log('⚡ [Supabase] Synced catalog item:', saved.title);
        return { success: true, data: saved };
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to upsert catalog item:', err.message);
        return { success: false, message: err.message };
      }
    },

    /**
     * Delete an attraction from Supabase `catalog`
     */
    async deleteCatalogItem(id) {
      if (!supabaseClient) return null;
      try {
        const { error } = await supabaseClient
          .from('catalog')
          .delete()
          .eq('id', id);

        if (error) throw error;
        console.log('⚡ [Supabase] Deleted catalog item:', id);
        return { success: true };
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to delete catalog item:', err.message);
        return { success: false, message: err.message };
      }
    },

    // =========================================================================
    // ANNOUNCEMENTS DATA (Supabase Sync)
    // =========================================================================

    /**
     * Map database row to client announcement object
     */
    mapAnnouncementFromDb(row) {
      if (!row) return null;

      // Compute relative timestamp
      let timeStr = 'Recently';
      if (row.created_at) {
        const diffMs = Date.now() - new Date(row.created_at).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) timeStr = 'Just now';
        else if (diffMins < 60) timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        else if (diffHours < 24) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        else timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }

      return {
        id: String(row.id),
        title: row.title || 'Broadcast Advisory',
        type: row.type || 'announcement',
        priority: row.priority || 'normal',
        target: row.author || 'All Visitors',
        author: row.author || 'Operations Desk',
        text: row.message || '',
        message: row.message || '',
        timestamp: timeStr,
        created_at: row.created_at,
        active: true
      };
    },

    /**
     * Map client announcement object to database row
     */
    mapAnnouncementToDb(ann) {
      if (!ann) return null;
      const payload = {
        title: ann.title || 'Broadcast Advisory',
        message: ann.text || ann.message || '',
        type: ann.type || 'announcement',
        priority: ann.priority || 'normal',
        author: ann.target || ann.author || 'Operations Desk'
      };
      if (typeof ann.id === 'number' || (typeof ann.id === 'string' && /^\d+$/.test(ann.id))) {
        payload.id = parseInt(ann.id, 10);
      }
      return payload;
    },

    /**
     * Fetch announcements from Supabase `announcements` table
     */
    async fetchAnnouncements() {
      if (!supabaseClient) return null;
      try {
        const { data, error } = await supabaseClient
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!Array.isArray(data)) return [];
        return data.map(row => this.mapAnnouncementFromDb(row));
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to fetch announcements:', err.message);
        return null;
      }
    },

    /**
     * Insert a new broadcast announcement into Supabase `announcements`
     */
    async insertAnnouncement(ann) {
      if (!supabaseClient) return null;
      try {
        const dbPayload = this.mapAnnouncementToDb(ann);
        const { data, error } = await supabaseClient
          .from('announcements')
          .insert([dbPayload])
          .select()
          .single();

        if (error) throw error;
        const saved = this.mapAnnouncementFromDb(data);
        console.log('⚡ [Supabase] Inserted announcement broadcast:', saved.title);
        return { success: true, data: saved };
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to insert announcement:', err.message);
        return { success: false, message: err.message };
      }
    },

    /**
     * Delete/Dismiss an announcement from Supabase `announcements`
     */
    async deleteAnnouncement(id) {
      if (!supabaseClient) return null;
      try {
        let query = supabaseClient.from('announcements').delete();
        if (/^\d+$/.test(String(id))) {
          query = query.eq('id', parseInt(id, 10));
        } else {
          query = query.eq('title', id);
        }
        const { error } = await query;
        if (error) throw error;
        console.log('⚡ [Supabase] Deleted announcement:', id);
        return { success: true };
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to delete announcement:', err.message);
        return { success: false, message: err.message };
      }
    },

    // =========================================================================
    // TOURIST PASSES & QR SCANNER INTEGRATION (Supabase Sync)
    // =========================================================================

    /**
     * Map database row from `passes` table to client pass object
     */
    mapPassFromDb(row) {
      if (!row || !row.pass_code) return null;
      const amtNum = row.amount_paid !== null && row.amount_paid !== undefined ? Number(row.amount_paid) : 0;
      let checkedInTime = null;
      if (row.scanned_at) {
        try {
          checkedInTime = new Date(row.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          checkedInTime = row.scanned_at;
        }
      }
      return {
        id: row.id,
        code: String(row.pass_code).toUpperCase().trim(),
        visitorName: row.visitor_name || 'Tourist Guest',
        touristName: row.visitor_name || 'Tourist Guest',
        visitorEmail: row.visitor_email || '',
        userId: row.user_id || null,
        attractionId: row.attraction_id || 'rizal-monument',
        attraction: row.attraction_title || 'Rizal Monument',
        partySize: Number(row.party_size || 1),
        pax: Number(row.party_size || 1),
        validDate: row.pass_date || 'Today',
        date: row.pass_date || 'Today',
        slot: row.time_slot || '09:00 AM - 12:00 PM',
        passType: 'Standard Tourist Pass',
        amount: `₱${amtNum.toFixed(2)}`,
        status: row.status || 'valid',
        checkedInAt: checkedInTime,
        scannedAt: row.scanned_at || null,
        scannedBy: row.scanned_by || null,
        created_at: row.created_at
      };
    },

    /**
     * Map client pass object to database row for `passes` table
     */
    mapPassToDb(pass) {
      if (!pass) return null;
      const rawAmt = typeof pass.amount === 'number'
        ? pass.amount
        : parseFloat(String(pass.amount || '0').replace(/[^0-9.-]+/g, '')) || 0;
      return {
        pass_code: String(pass.code || '').toUpperCase().trim(),
        visitor_name: pass.visitorName || pass.touristName || 'Tourist Guest',
        visitor_email: pass.visitorEmail || null,
        user_id: pass.userId || null,
        attraction_id: pass.attractionId || null,
        attraction_title: pass.attraction || 'Attraction Entry',
        party_size: Number(pass.partySize || pass.pax || 1),
        pass_date: pass.validDate || pass.date || new Date().toISOString().split('T')[0],
        time_slot: pass.slot || '09:00 AM - 12:00 PM',
        amount_paid: rawAmt,
        status: pass.status || 'valid'
      };
    },

    /**
     * Fetch all passes from Supabase `passes` table
     */
    async fetchPasses() {
      if (!supabaseClient) return null;
      try {
        const { data, error } = await supabaseClient
          .from('passes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!Array.isArray(data)) return {};
        const passesMap = {};
        data.forEach(row => {
          const mapped = this.mapPassFromDb(row);
          if (mapped && mapped.code) {
            passesMap[mapped.code] = mapped;
          }
        });
        return passesMap;
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to fetch passes:', err.message);
        return null;
      }
    },

    /**
     * Fetch a single pass by its pass_code directly from Supabase `passes` table
     */
    async getPassByCode(code) {
      if (!supabaseClient || !code) return null;
      try {
        const cleanCode = String(code).trim().toUpperCase();
        const { data, error } = await supabaseClient
          .from('passes')
          .select('*')
          .ilike('pass_code', cleanCode)
          .maybeSingle();

        if (error) throw error;
        return data ? this.mapPassFromDb(data) : null;
      } catch (err) {
        console.warn('⚠️ [Supabase] getPassByCode error:', err.message);
        return null;
      }
    },

    /**
     * Insert or upsert a newly booked pass into Supabase `passes` table
     */
    async insertPass(pass) {
      if (!supabaseClient || !pass) return null;
      try {
        const dbPayload = this.mapPassToDb(pass);
        const { data, error } = await supabaseClient
          .from('passes')
          .insert([dbPayload])
          .select()
          .single();

        if (error) throw error;
        const saved = this.mapPassFromDb(data);
        console.log('⚡ [Supabase] Saved new tourist pass:', saved.code);
        return { success: true, data: saved };
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to insert pass:', err.message);
        return { success: false, message: err.message };
      }
    },

    /**
     * Update pass status in Supabase `passes` table when scanned at entrance gate
     */
    async updatePassScanStatus(code, status, scannedBy = 'Digital Gate Scanner') {
      if (!supabaseClient || !code) return null;
      try {
        const cleanCode = String(code).trim().toUpperCase();
        const { data, error } = await supabaseClient
          .from('passes')
          .update({
            status: status,
            scanned_at: new Date().toISOString(),
            scanned_by: scannedBy
          })
          .ilike('pass_code', cleanCode)
          .select()
          .maybeSingle();

        if (error) throw error;
        const updated = data ? this.mapPassFromDb(data) : null;
        console.log(`⚡ [Supabase] Updated pass ${cleanCode} status to "${status}"`);
        return { success: true, data: updated };
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to update pass scan status:', err.message);
        return { success: false, message: err.message };
      }
    },

    /**
     * Subscribe to real-time changes on public catalog, announcements, and passes
     */
    subscribeToChanges(callbacks = {}) {
      if (!supabaseClient) return null;
      try {
        const channel = supabaseClient
          .channel('tourismhub-realtime-feed')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog' }, (payload) => {
            console.log('⚡ [Supabase Realtime] Catalog table event:', payload.eventType);
            if (typeof callbacks.onCatalogChange === 'function') callbacks.onCatalogChange(payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
            console.log('⚡ [Supabase Realtime] Announcements table event:', payload.eventType);
            if (typeof callbacks.onAnnouncementChange === 'function') callbacks.onAnnouncementChange(payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'passes' }, (payload) => {
            console.log('⚡ [Supabase Realtime] Passes table event:', payload.eventType);
            if (typeof callbacks.onPassChange === 'function') callbacks.onPassChange(payload);
          })
          .subscribe();

        return channel;
      } catch (err) {
        console.warn('⚠️ [Supabase Realtime] Failed to subscribe:', err.message);
        return null;
      }
    }
  };

  window.TourismHubSupabase = TourismHubSupabase;

})(window);
