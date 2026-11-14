# CLAUDE.md — TourismHub Codebase Documentation

> **TourismHub** is a centralized, real-time attraction and visitor management system designed for Philippine tourism operations (heritage sites, eco-sanctuaries, cultural festivals, and resort amenities). It bridges public tourist discovery, digital pass reservations, and express digital gate check-in with an operator admin control console.

---

## 1. High-Level Architecture & Technical Stack

- **Stack**: Pure Vanilla Web Technologies — HTML5, CSS3, ES6+ JavaScript.
- **Build System**: None / Zero-dependency. Does not require Webpack, Vite, npm, or Babel. All files run natively in any modern browser.
- **Database & Backend**:
  - Primary Online Database: **Supabase** (PostgreSQL) accessed via REST / `@supabase/supabase-js` CDN client bridge.
  - Relational tables with Row Level Security (RLS) policies: `profiles`, `catalog`, `capacity_slots`, `passes`, `announcements`.
  - Database schema scripts located in `database/supabase_schema.sql` (PostgreSQL / Supabase) and `database/schema.sql` (MySQL reference).
- **State Management & Persistence**:
  - `TourismHubStore` (`js/store.js`) manages state and coordinates with `TourismHubSupabase` (`js/supabase-client.js`).
  - Online database is the primary system of record; `window.localStorage` serves as a temporary local cache and session manager.
- **Real-Time Cross-Tab & Multi-Page Synchronization**:
  - Leverages browser `storage` events across different tabs.
  - Dispatches custom in-tab `tourismhub:sync` events (`CustomEvent`) so changes within the same tab update immediately.
  - Any operator change in `admin.html` propagates in real time across open client portal pages without full page reloads.
- **Theming System**:
  - Full Light and Dark Mode theme support via `[data-theme="dark"]` attribute on `<html>`.
  - Persistent preference stored in `localStorage` (`tourismhub_theme`).
- **Authentication & Role-Based Routing**:
  - Landing gateway at `login.html` with 1-click demo profiles, form validation, password confirmation, and registration.
  - Smart role routing: **Operators / Admins** route to `admin.html`; **Tourists** route to `index.html` (or `?redirect=` destination).
  - Unauthenticated bookings automatically redirect to `login.html` with a return parameter.

---

## 2. Directory Structure & File Inventory

```
attraction_system_demo/
├── .env                      # Supabase Project API keys and PostgreSQL DB connection settings
├── .gitignore                # Git ignore rules
├── index.html                # Public Tourist Portal (Hero, category search, featured catalog, booking modal)
├── login.html                # Primary Landing & Authentication Portal (Tourist & Operator login/registration)
├── admin-login.html          # Legacy operator login page (auto-redirects to login.html)
├── admin.html                # Operator Admin Dashboard (Catalog CRUD, capacity sliders, gate scanner, analytics)
├── attraction-details.html   # Dedicated Attraction Details Page (Gallery carousel, capacity, booking, favorites, related)
├── attractions.html          # Public Sub-Page: Attractions & Events Catalog Browser + Modal
├── capacity.html             # Public Sub-Page: Real-Time Capacity & Schedule Availability Monitor
├── notifications.html        # Public Sub-Page: Tourist Advisories & Notification Center
├── profile.html              # Dedicated User Profile Tab: Account & Security, Favorites, QR Passes, settings, dark mode, signout
├── scanner.html              # Public Sub-Page: Entry Pass QR Scanner (Viewfinder simulation)
├── README.md                 # Project overview & quick start guide
├── CLAUDE.md                 # Comprehensive architecture, directory tree, & developer reference guide
├── todo.txt                  # Operational task log and implementation notes
├── assets/
│   ├── hero-banner.jpg       # Hero showcase banner
│   ├── pahiyas-festival.jpg  # Lucban Pahiyas Festival media asset
│   ├── qc-memorial-circle.jpg# Quezon Memorial Circle media asset
│   ├── rizal-monument.jpg    # Rizal Monument & Luneta Park media asset
│   └── white-beach.jpg       # White Beach Boracay media asset
├── css/
│   ├── styles.css            # Main portal styling, CSS custom properties, dark mode tokens, modal & pass styles
│   ├── login.css             # Split-screen responsive authentication UI styling
│   ├── admin.css             # Operator Admin console styling (dark navy rail, analytics widgets)
│   ├── admin-login.css       # Security terminal styling (legacy admin login)
│   └── portal-pages.css      # Shared styling for sub-pages (top bar, tables, stat cards, scanner reticle, dark mode)
├── database/
│   ├── supabase_schema.sql   # PostgreSQL / Supabase schema (UUIDs, RLS policies, seed profiles, catalog, passes)
│   └── schema.sql            # MySQL / MariaDB relational reference schema
└── js/
    ├── admin.js              # Operator console logic (tab routing, catalog CRUD, capacity sliders, logs)
    ├── admin-login.js        # Legacy admin terminal login script
    ├── app.js                # Main tourist portal controller (catalog filters, booking gate, toast engine)
    ├── login.js              # Unified authentication, session handling, 1-click demo quick-fill, validations
    ├── portal-sync.js        # Multi-tab bidirectional sync engine for standalone portal pages
    ├── profile-dropdown.js   # Universal profile navigation controller & dark mode bootstrapper
    ├── sidebar.js            # Universal responsive sidebar drawer controller (single source of truth)
    ├── store.js              # State store (CRUD, Supabase-first auth, temporary cache, storage listeners)
    ├── supabase-client.js    # Supabase client bridge (query helpers for profiles, catalog, passes, announcements)
    └── supabase-config.js    # Client-side Supabase credentials config with step-by-step setup tutorial
```

---

## 3. Core Modules & Functionality

### 3.1 Primary Landing & Authentication Portal ([`login.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/login.html))
- **Primary Landing Gateway**: Unauthenticated users are introduced through `login.html`, with an **"Explore as Guest"** option leading directly into `index.html`.
- **Role-Based Redirection**:
  - Checks entered credentials against Supabase `public.profiles` (falling back to temporary store).
  - Operators / Admins (`admin`, `officer`) -> redirected to `admin.html`.
  - Tourists (`tourist`) -> redirected to `index.html` or preserved `?redirect=` return URL.
- **1-Click Demo Profiles**:
  - **Tourists**: `maria.santos@email.com` / `tourist123` (Resident), `alex.tan@visitor.sg` / `tourist123` (International).
  - **Operators**: `admin@tourismhub.gov.ph` / `admin123` (Chief Operator), `turnstile@tourismhub.gov.ph` / `gate2026` (Receptionist).
- **Registration**: Full name, email format validation, password matching with confirmation (`regPasswordConfirm`), country, and auto-login into the session upon registration.

### 3.2 Public Tourist Portal ([`index.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/index.html))
- **Hero & Search**: Keyword search, category dropdown filter, suggestion tags.
- **Featured Catalog**: Card grid with real-time badges, pricing, ratings, and wishlist toggles.
- **Pass Reservation Modal & Booking Gate**:
  - Date picker, guest party counter, dynamic pricing calculation.
  - If guest is unauthenticated, clicking "Book" redirects to `login.html?redirect=index.html#featuredAttractions`.
- **Navbar Header**:
  - When authenticated, the "Sign In" button is hidden.
  - Clicking the navbar profile avatar navigates directly to `profile.html`.
- **Mobile Bottom Navigation Bar**: Fixed bottom navigation on viewports `< 768px`.

### 3.3 Standalone Public Sub-Pages
Connected to the universal sidebar navigation drawer:
1. **Attractions & Events ([`attractions.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/attractions.html))**:
   - Filter tabs (`All`, `Attractions`, `Events`, `Amenities`), keyword search, area filter.
   - Dynamic top metric cards (Total Attractions, Live Events, Active Slots, Visitor Attendance).
   - "+ Add Attraction" modal to submit new listings directly to `TourismHubStore` / Supabase.
2. **Capacity & Schedule Management ([`capacity.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/capacity.html))**:
   - Real-time slot availability table with status badges (`Normal`, `Near Full`, `Full`).
   - Slot occupancy counters (`booked / max`) synchronized with admin controls.
   - "+ Add Schedule" modal to create new time slots.
3. **Announcement & Notification Dispatch ([`notifications.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/notifications.html))**:
   - Live stream of official operator broadcasts with type tabs (`Alert`, `Announcement`, `Event`).
   - Priority indicators (Urgent vs Normal, Weather Warnings, Extended Hours).
   - "+ New Announcement" modal to dispatch announcements across tabs.
4. **QR Tourist Pass Scanner ([`scanner.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/scanner.html))**:
   - Camera viewfinder simulation with animated laser scan beam and reticle brackets.
   - Manual pass code verification input (`PASS-8842-MNL`, `PASS-5120-BCY`, etc.).
   - Instant verification outcome (Valid / Expired / Already Scanned / Unregistered) with recent scans log.
5. **Dedicated Profile & Preferences Tab ([`profile.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/profile.html))**:
   - **Hero Identity Card**: High-res avatar, user name, email, badge, country, and contact info.
   - **Tab 1: Account & Security (Primary Default Front Tab)**: User identity metadata and interactive **Change Password** interface.
   - **Tab 2: Saved Favorites**: Wishlisted destinations and quick-access attractions.
   - **Tab 3: My QR Passes**: All issued passes compiled into an interactive grid with encrypted QR codes, ref IDs, dates, party sizes, and Apple/Google Wallet actions.
   - **Tab 4: Settings & Preferences**:
     - **Dark Mode Theme Toggle**: Switches theme between light and dark (`data-theme="dark"`).
     - **Display Currency**: Philippine Peso (₱ / PHP).
     - **Audio Chimes**: Acoustic tone toggle on gate pass verification.
     - **Sync Status**: Live cloud realtime sync indicator.
   - **Sign Out**: Clean 1-click session sign-out action.
6. **Attraction Details Page ([`attraction-details.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/attraction-details.html))**:
   - Dedicated deep-dive view accessed via `?id=<attraction-id>`.
   - **Left Column**: Interactive picture carousel gallery with previous/next controls, slide counter, and clickable thumbnail strip.
   - **Right Column**: Comprehensive destination summary, location coordinates/address, operating hours, real-time live capacity progress meter, "Book Pass" modal trigger, and "Save to Favorites" toggle.
   - **Pass Booking Modal**: Party size selection, date picker, visitor name, dynamic PHP calculation, and pass issuance into `TourismHubStore`.
   - **Bottom Section**: "Other Locations Available" card grid presenting alternative catalog destinations with direct detail links.

### 3.4 Operator Admin Dashboard ([`admin.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/admin.html))
Tabbed Single-Page Application (SPA) console for park managers:
- **Overview & Control (`#overview`)**: High-level KPI counters, digital gate throughput, quick actions.
- **Attraction Catalog (`#catalog`)**: Full CRUD (Add new attraction, edit modal, delete, status toggle `Active` / `Maintenance`).
- **Capacity & Schedule (`#capacity`)**: Interactive slot capacity sliders to alter booked visitor counts in real time.
- **QR Scanner (`#scanner`)**: Express gate scanner with 1-click test buttons for valid, expired, and duplicate passes.
- **Analytics & Reports (`#analytics`)**: Hourly peak attendance graph, category distribution bars, scan success rates.
- **Announcements & Advisories (`#announcements`)**: Broadcast dispatcher for storm warnings, gate extensions, and park advisories.
- **Session & Sign Out**: Displays operator credentials and logs out securely to `login.html`.

### 3.5 Universal Sidebar Navigation ([`js/sidebar.js`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/js/sidebar.js))
- Manages the off-canvas drawer navigation across all public pages.
- Sidebar menu items:
  1. Dashboard (`index.html`)
  2. Attractions & Events (`attractions.html`)
  3. Capacity & Schedule (`capacity.html`)
  4. QR Scanner (`scanner.html`)
  5. Notifications (`notifications.html`)
  6. **Profile** (`profile.html` — replaces legacy settings item)
- Listens for `#sidebarToggleBtn`, `#sidebarCollapseBtn`, `#sidebarBackdrop`, and the `Escape` key.
- **Auto-Close Behavior**: Automatically closes the sidebar whenever a user clicks any navigation link or modal action.
- **Initialization Guard**: Uses `sideNav.dataset.sidebarInitialized = 'true'` to ensure event listeners are never bound more than once.

---

## 4. State Management & Storage Schema

### Supabase Database Tables (`database/supabase_schema.sql`)
| Table Name | Primary Key | Description |
|---|---|---|
| `public.profiles` | `id` (UUID) | Tourist and Operator account profiles (name, email, password_hash, role, badge, country, avatar) |
| `public.catalog` | `id` (TEXT) | Attractions, events, and amenities catalog items |
| `public.capacity_slots` | `id` (BIGSERIAL) | Time slot capacity allocations linked to catalog items |
| `public.passes` | `id` (BIGSERIAL) | Digital tourist passes with unique `pass_code`, party size, and scan status |
| `public.announcements` | `id` (BIGSERIAL) | Official operator bulletins, weather advisories, and event announcements |

### LocalStorage Keys (`js/store.js` Temporary Cache & Preferences)
| Key | Identifier | Purpose |
|---|---|---|
| `tourismhub_temp_catalog_v1` | `KEYS.CATALOG` | Temporary cached array of attraction catalog objects |
| `tourismhub_temp_capacity_v1` | `KEYS.CAPACITY` | Temporary cached dictionary mapping attraction IDs to time slots |
| `tourismhub_temp_announcements_v1` | `KEYS.ANNOUNCEMENTS` | Temporary cached array of operator announcements |
| `tourismhub_temp_passes_v1` | `KEYS.PASSES` | Temporary cached dictionary of issued tourist passes |
| `tourismhub_temp_logs_v1` | `KEYS.LOGS` | Array of recent gate entry scan log records |
| `tourismhub_temp_admin_auth_v1` | `KEYS.ADMIN_AUTH` | Active operator session object |
| `tourismhub_temp_client_auth_v1` | `KEYS.CLIENT_AUTH` | Active tourist session object |
| `tourismhub_temp_client_users_v1` | `KEYS.CLIENT_USERS` | Temporary cached registered tourist user accounts |
| `tourismhub_theme` | `localStorage` | Active theme preference (`'dark'` or `'light'`) |

---

## 5. Development Workflow & Commands

### Running Locally
Because TourismHub is a client-side web application, any static HTTP server can serve the project.

**Using Python**:
```powershell
python -m http.server 3000
```
Then navigate to:
- Landing Gateway: `http://localhost:3000/login.html`
- Tourist Portal: `http://localhost:3000/index.html`
- User Profile: `http://localhost:3000/profile.html`
- Operator Admin: `http://localhost:3000/admin.html`

**Using Node.js**:
```powershell
npx serve . -p 3000
```

### Validating JavaScript Syntax
Verify all JavaScript files with Node before committing changes:
```powershell
node -c js/store.js js/app.js js/login.js js/admin.js js/admin-login.js js/sidebar.js js/portal-sync.js js/profile-dropdown.js js/supabase-client.js js/supabase-config.js
```

---

## 6. Design System & UI Tokens

Defined in [`css/styles.css`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/css/styles.css) under `:root` and `[data-theme="dark"]`:

| Token | Light Mode Value | Dark Mode Value | Semantic Meaning |
|---|---|---|---|
| `--primary` | `#0284c7` | `#0284c7` | Brand Sky Blue (interactive links, buttons, focus outlines) |
| `--primary-hover` | `#0369a1` | `#0284c7` | Dark Blue hover state |
| `--primary-light` | `#e0f2fe` | `#0c4a6e` | Soft Sky Blue / dark pill background |
| `--secondary` | `#10b981` | `#10b981` | Emerald Green (success states, open slot badges) |
| `--bg-page` | `#f8fafc` | `#0b1120` | Page backdrop |
| `--bg-card` | `#ffffff` | `#1e293b` | Card container background |
| `--bg-subtle` | `#f1f5f9` | `#131d31` | Nested sections, inputs, subtle areas |
| `--text-main` | `#0f172a` | `#f8fafc` | Primary headings and high-contrast text |
| `--text-muted` | `#64748b` | `#94a3b8` | Secondary captions, subheadings, labels |
| `--border` | `#e2e8f0` | `#334155` | Hairline border dividers |
| `--font-heading` | `Plus Jakarta Sans`, sans-serif | — | Prominent headers, brand titles, metric values |
| `--font-body` | `Inter`, sans-serif | — | Form controls, description copy, table data |

---

## 7. Development Guidelines & Important Rules

1. **No External Frameworks**: Maintain pure vanilla JavaScript, HTML, and CSS. Avoid adding React, Vue, or Tailwind unless explicitly requested.
2. **Preserve Single Source of Truth for Navigation**:
   - Sidebar drawer logic must remain centralized inside [`js/sidebar.js`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/js/sidebar.js).
   - Profile tab navigation logic belongs in [`js/profile-dropdown.js`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/js/profile-dropdown.js).
3. **Database Integration**:
   - Database operations should route through `TourismHubStore` / `TourismHubSupabase`.
   - Update credentials in `js/supabase-config.js` following the tutorial at the top of that file.
4. **Dark Mode Integrity**:
   - Ensure new components adhere to CSS custom properties (`var(--bg-page)`, `var(--bg-card)`, `var(--text-main)`, `var(--border)`) so they automatically adapt to dark mode.
5. **Role Separation**:
   - Operator controls belong in `admin.html`.
   - The public portal (`index.html`, `attractions.html`, etc.) must not expose raw admin credentials or direct destructive database controls.
   - All role-based authentication flows route through `login.html`.
