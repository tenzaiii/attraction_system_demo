# GEMINI.md — TourismHub Agent Rules & Project Directives

This document defines persistent rules, workspace conventions, and operating guidelines for Google Antigravity / Gemini sessions operating on the **TourismHub** project.

---

## 1. Primary Directives

1. **Always Consult `CLAUDE.md`**:
   - For all tasks, feature implementations, and refactors, reference [`CLAUDE.md`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/CLAUDE.md) as the detailed architecture and directory reference.
   - Respect the established directory inventory, file structure, design tokens, and state management models.

2. **Zero Framework Dependencies**:
   - Maintain pure vanilla JavaScript (ES6+), HTML5, and CSS3.
   - Do not introduce React, Vue, Angular, Tailwind, Webpack, or Vite unless explicitly instructed by the user.

3. **Supabase & State Synchronization Rules**:
   - Primary database is **Supabase (PostgreSQL)** (`profiles`, `catalog`, `capacity_slots`, `passes`, `announcements`).
   - `localStorage` functions as a temporary local cache and session manager (`tourismhub_temp_*` keys).
   - Data mutations must go through `TourismHubStore` / `TourismHubSupabase` helper methods to maintain bidirectional multi-tab real-time sync.

4. **Navigation & UI Principles**:
   - Centralize sidebar drawer behavior in [`js/sidebar.js`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/js/sidebar.js).
   - The sidebar navigation must feature **Profile** (`profile.html`), not legacy Settings.
   - The navbar profile icon navigates directly to the dedicated [`profile.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/profile.html) tab (which houses user identity, compiled turnstile QR passes, settings, and the dark mode switch).
   - Unauthenticated visitors attempting to book passes must be redirected to [`login.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/login.html) with a return redirect URL.

5. **Dark Mode Compatibility**:
   - All new HTML/CSS components must respect CSS custom properties (`var(--bg-page)`, `var(--bg-card)`, `var(--text-main)`, `var(--border)`) and work seamlessly under `[data-theme="dark"]`.

6. **Pre-Completion Code Validation**:
   - Always run Node.js syntax verification on modified scripts before reporting completion:
     ```powershell
     node -c js/store.js js/app.js js/login.js js/admin.js js/admin-login.js js/sidebar.js js/portal-sync.js js/profile-dropdown.js js/supabase-client.js js/supabase-config.js
     ```

