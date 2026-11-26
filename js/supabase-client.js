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

        const roleKey = profile.role || 'tourist';
        const rawAvatar = profile.avatar && !String(profile.avatar).includes('images.unsplash.com/photo-') ? profile.avatar : '';
        const sessionUser = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: roleKey,
          roleKey: roleKey,
          city: profile.city || 'Manila',
          favorites: Array.isArray(profile.favorites) ? profile.favorites : undefined,
          itinerary: Array.isArray(profile.itinerary) ? profile.itinerary : undefined,
          avatar: rawAvatar,
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

    async cancelPass(code) {
      if (!supabaseClient || !code) return { success: false };
      try {
        const { error } = await supabaseClient
          .from('passes')
          .update({ status: 'cancelled' })
          .eq('code', String(code).toUpperCase().trim());
        return { success: !error, message: error ? error.message : 'Pass cancelled.' };
      } catch (e) {
        return { success: false, message: e.message };
      }
    },

    async updateUserLists(userId, lists) {
      if (!supabaseClient || !userId || !lists) return { success: false };
      try {
        const payload = {};
        if (Array.isArray(lists.favorites)) payload.favorites = lists.favorites;
        if (Array.isArray(lists.itinerary)) payload.itinerary = lists.itinerary;
        if (Object.keys(payload).length === 0) return { success: true };
        const { error } = await supabaseClient
          .from('profiles')
          .update(payload)
          .eq('id', userId);
        return { success: !error };
      } catch (_) {
        return { success: false };
      }
    },

    async resetPasswordByEmail(email, city, newPassword) {
      if (!supabaseClient) return { success: false, message: 'Offline mode: cannot verify cloud account.' };
      try {
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanCity = String(city || '').trim().toLowerCase();
        const profile = await this.getProfileByEmail(cleanEmail);
        if (!profile) return { success: false, message: 'No account found with that email address.' };
        if (profile.city && cleanCity && String(profile.city).trim().toLowerCase() !== cleanCity) {
          return { success: false, message: 'City does not match our records for this account.' };
        }
        const { error } = await supabaseClient
          .from('profiles')
          .update({ password_hash: newPassword })
          .eq('id', profile.id);
        if (error) return { success: false, message: error.message };
        return { success: true, message: 'Password reset successfully! You can now sign in.' };
      } catch (e) {
        return { success: false, message: e.message || 'Password reset failed.' };
      }
    },

    /**
     * Register new tourist user in Supabase `profiles` table
     */
    async registerTourist(name, email, password, city) {
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
          city: city || 'Manila',
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
          roleKey: data.role || 'tourist',
          city: data.city || city || 'Manila',
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

      // Extract and sanitize images array (filter out any legacy mock Unsplash links)
      let parsedImages = [];
      if (Array.isArray(row.images)) {
        parsedImages = row.images;
      } else if (typeof row.images === 'string' && row.images.trim().startsWith('[')) {
        try { parsedImages = JSON.parse(row.images); } catch (_) { parsedImages = []; }
      }
      parsedImages = parsedImages
        .filter(url => url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-'))
        .slice(0, 1);

      const rawImage = row.image && !String(row.image).includes('images.unsplash.com/photo-')
        ? row.image
        : (parsedImages[0] || 'assets/no-image.svg');

      if (parsedImages.length === 0) {
        parsedImages = [rawImage];
      }

      const isEvent = row.type === 'event';
      const rawAdmission = row.admission ? String(row.admission).replace(/\$(\d+)/g, '₱$1') : '';
      const rawPriceLabel = row.price_label ? String(row.price_label).replace(/\$(\d+)/g, '₱$1') : '';
      const syncedLabel = rawAdmission || rawPriceLabel || (row.price ? `₱${row.price}` : 'Free Admission');
      const eventDate = (isEvent && /^\d{4}-\d{2}-\d{2}$/.test(rawPriceLabel.trim())) ? rawPriceLabel.trim() : undefined;

      return {
        id: row.id,
        title: row.title || '',
        category: row.category || 'Tourist Spot',
        type: row.type || 'attraction',
        parentAttractionId: isEvent ? (row.badge || '') : undefined,
        attractionTitle: isEvent ? (row.category || 'Attraction Event') : undefined,
        eventDate,
        status: row.status || 'active',
        rating: row.rating ? String(row.rating) : '4.8',
        reviews: row.reviews ? String(row.reviews) : '1.2k',
        price: row.price !== null && row.price !== undefined ? Number(row.price) : 0,
        priceLabel: isEvent ? (rawPriceLabel || '') : syncedLabel,
        admission: rawAdmission || syncedLabel,
        operatingHours: row.operating_hours || '08:00 AM - 06:00 PM',
        capacityPerSlot: row.capacity_per_slot || 100,
        image: rawImage,
        images: parsedImages,
        location: row.location || 'Manila',
        badge: row.badge || 'Featured',
        description: row.description || '',
        ...(row.map_embed ? { mapEmbed: row.map_embed, rawMapEmbed: row.map_embed } : {}),
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    },

    /**
     * Map client attraction object (camelCase) to database row (snake_case)
     */
    mapCatalogToDb(item) {
      if (!item) return null;
      const priceVal = typeof item.price === 'number' && !isNaN(item.price) ? item.price : (parseFloat(item.price) || 0);
      const isEvent = item.type === 'event';
      const syncedAdmission = item.admission || item.priceLabel || (priceVal ? `₱${priceVal}` : 'Free Admission');

      // Ensure max 1 picture and purge any mock unsplash links
      let cleanImages = (Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []))
        .filter(url => url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-'))
        .slice(0, 1);

      if (cleanImages.length === 0) {
        cleanImages = ['assets/no-image.svg'];
      }

      const primaryImg = cleanImages[0];

      return {
        id: String(item.id || (isEvent ? 'event-' : 'attraction-') + Date.now()),
        title: item.title || '',
        category: isEvent ? (item.attractionTitle || item.category || 'Attraction Event') : (item.category || 'Tourist Spot'),
        type: item.type || 'attraction',
        status: item.status || 'active',
        rating: String(item.rating || '4.8'),
        reviews: String(item.reviews || '100'),
        price: priceVal,
        price_label: isEvent ? (item.eventDate || item.priceLabel || '') : syncedAdmission,
        admission: syncedAdmission,
        operating_hours: item.operatingHours || item.operating_hours || '08:00 AM - 06:00 PM',
        capacity_per_slot: Number(item.capacityPerSlot || item.capacity_per_slot || 100),
        image: primaryImg,
        images: cleanImages,
        location: item.location || 'Manila',
        badge: isEvent ? (item.parentAttractionId || item.badge || '') : (item.badge || 'Featured'),
        map_embed: item.rawMapEmbed || item.mapEmbed || '',
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
        let { data, error } = await supabaseClient
          .from('catalog')
          .upsert([dbPayload], { onConflict: 'id' })
          .select();

        // Graceful fallback if optional columns (`images`, `map_embed`) are missing in live Supabase schema
        let fallbackPayload = { ...dbPayload };
        let attempts = 0;
        while (error && error.message && attempts < 2) {
          const msg = error.message.toLowerCase();
          let stripped = false;
          if (msg.includes('images') && Object.prototype.hasOwnProperty.call(fallbackPayload, 'images')) {
            console.warn('⚠️ [Supabase] Retrying catalog upsert without `images` column...');
            delete fallbackPayload.images;
            stripped = true;
          }
          if (msg.includes('map_embed') && Object.prototype.hasOwnProperty.call(fallbackPayload, 'map_embed')) {
            console.warn('⚠️ [Supabase] Retrying catalog upsert without `map_embed` column...');
            delete fallbackPayload.map_embed;
            stripped = true;
          }
          if (!stripped) break;
          attempts++;
          const retryRes = await supabaseClient
            .from('catalog')
            .upsert([fallbackPayload], { onConflict: 'id' })
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }

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

    /**
     * Fetch a single attraction item from Supabase `catalog`
     */
    async fetchCatalogItem(id) {
      if (!supabaseClient || !id) return null;
      try {
        const { data, error } = await supabaseClient
          .from('catalog')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data ? this.mapCatalogFromDb(data) : null;
      } catch (err) {
        console.warn(`⚠️ [Supabase] Failed to fetch catalog item ${id}:`, err.message);
        return null;
      }
    },

    // =========================================================================
    // STORAGE BUCKET: ATTRACTION PHOTOS (Organized by Attraction Folder)
    // =========================================================================

    /**
     * Upload an attraction image to Supabase Storage bucket 'attractions'
     * Separated into a folder for each attraction: `attractions/{attractionId}/photo_{timestamp}_{index}.jpg`
     */
    async uploadAttractionImage(attractionId, fileOrBlob, index = 1) {
      if (!supabaseClient) {
        return { success: false, message: 'Supabase client is offline.' };
      }

      try {
        const cleanFolder = String(attractionId || 'general')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-')
          .replace(/-+/g, '-');

        let blobToUpload = fileOrBlob;
        let ext = 'jpg';

        // If a data URL string is passed, convert to Blob
        if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
          const parts = fileOrBlob.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          ext = mime.split('/')[1] || 'jpg';
          const binary = atob(parts[1]);
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
          }
          blobToUpload = new Blob([array], { type: mime });
        } else if (fileOrBlob && fileOrBlob.name) {
          const nameParts = fileOrBlob.name.split('.');
          if (nameParts.length > 1) ext = nameParts.pop().toLowerCase();
        }

        const fileName = `photo_${Date.now()}_${index}.${ext}`;
        const filePath = `${cleanFolder}/${fileName}`;

        console.log(`⚡ [Supabase Storage] Uploading photo to folder "${cleanFolder}": ${fileName}`);

        const { data, error } = await supabaseClient.storage
          .from('attractions')
          .upload(filePath, blobToUpload, {
            cacheControl: '3600',
            upsert: true,
            contentType: blobToUpload.type || 'image/jpeg'
          });

        if (error) throw error;

        // Obtain public URL for the uploaded photo in bucket
        const { data: urlData } = supabaseClient.storage
          .from('attractions')
          .getPublicUrl(filePath);

        const publicUrl = urlData ? urlData.publicUrl : '';
        console.log(`⚡ [Supabase Storage] Uploaded to bucket successfully:`, publicUrl);

        return {
          success: true,
          publicUrl,
          filePath,
          folder: cleanFolder
        };
      } catch (err) {
        console.warn('⚠️ [Supabase Storage] Failed to upload attraction image:', err.message);
        return { success: false, message: err.message };
      }
    },

    /**
     * Fetch list of pictures stored in the Supabase Storage bucket under the attraction's folder:
     * `attractions/{attractionId}/*`
     */
    async fetchAttractionImagesFromBucket(attractionId) {
      if (!supabaseClient || !attractionId) return [];

      try {
        const cleanFolder = String(attractionId)
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-')
          .replace(/-+/g, '-');

        const { data, error } = await supabaseClient.storage
          .from('attractions')
          .list(cleanFolder, {
            limit: 10,
            sortBy: { column: 'name', order: 'desc' }
          });

        if (error) throw error;
        if (!Array.isArray(data) || data.length === 0) return [];

        const publicUrls = data
          .filter(file => file.name && !file.name.startsWith('.'))
          .map(file => {
            const { data: urlData } = supabaseClient.storage
              .from('attractions')
              .getPublicUrl(`${cleanFolder}/${file.name}`);
            return urlData ? urlData.publicUrl : '';
          })
          .filter(Boolean)
          .slice(0, 1);

        return publicUrls;
      } catch (err) {
        console.warn(`⚠️ [Supabase Storage] Could not list bucket folder "${attractionId}":`, err.message);
        return [];
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
      const rawUserId = pass.userId || pass.bookedByUserId || null;
      const validUuid = rawUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawUserId))
        ? String(rawUserId)
        : null;
      return {
        pass_code: String(pass.code || '').toUpperCase().trim(),
        visitor_name: pass.visitorName || pass.touristName || 'Tourist Guest',
        visitor_email: pass.bookedByEmail || pass.visitorEmail || null,
        user_id: validUuid,
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
     * Fetch capacity slots grouped by attraction_id from Supabase `capacity_slots` table
     */
    async fetchCapacitySlots() {
      if (!supabaseClient) return null;
      try {
        const { data, error } = await supabaseClient
          .from('capacity_slots')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        const grouped = {};
        (data || []).forEach(row => {
          const attrId = row.attraction_id || row.attractionId;
          if (!attrId) return;
          if (!grouped[attrId]) grouped[attrId] = [];
          grouped[attrId].push({
            id: String(row.id),
            time: row.slot_time || row.time || '09:00 AM - 12:00 PM',
            booked: Number(row.booked_count ?? row.booked ?? 0),
            max: Number(row.max_capacity ?? row.max ?? 100),
            status: row.status || 'open'
          });
        });
        return grouped;
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to fetch capacity_slots:', err.message);
        return null;
      }
    },

    /**
     * Upsert a capacity slot into Supabase `capacity_slots` table
     */
    async upsertCapacitySlot(attractionId, slot) {
      if (!supabaseClient || !attractionId || !slot || !slot.id) return null;
      try {
        const payload = {
          id: String(slot.id),
          attraction_id: String(attractionId),
          slot_time: slot.time || '09:00 AM - 12:00 PM',
          booked_count: Number(slot.booked || 0),
          max_capacity: Number(slot.max || 100),
          status: slot.status || (Number(slot.booked || 0) >= Number(slot.max || 100) ? 'sold-out' : 'open')
        };
        const { data, error } = await supabaseClient
          .from('capacity_slots')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .maybeSingle();
        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        console.warn('⚠️ [Supabase] Failed to upsert capacity slot:', err.message);
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
