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
          avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
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
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
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

    // =========================================================================
    // CATALOG & ATTRACTIONS DATA
    // =========================================================================

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
        return data;
      } catch (err) {
        console.warn('[Supabase] Failed to fetch catalog:', err.message);
        return null;
      }
    },

    /**
     * Save/Insert or Update an attraction in Supabase `catalog`
     */
    async upsertCatalogItem(item) {
      if (!supabaseClient) return null;
      try {
        const { data, error } = await supabaseClient
          .from('catalog')
          .upsert([item])
          .select();
        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        return { success: false, message: err.message };
      }
    },

    // =========================================================================
    // ANNOUNCEMENTS DATA
    // =========================================================================

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
        return data;
      } catch (err) {
        console.warn('[Supabase] Failed to fetch announcements:', err.message);
        return null;
      }
    }
  };

  window.TourismHubSupabase = TourismHubSupabase;

})(window);
