# CLAUDE.md — TourismHub Codebase Documentation

> **TourismHub** is a centralized, real-time attraction and visitor management system designed for Philippine tourism operations (heritage sites, eco-sanctuaries, cultural festivals, and resort amenities). It bridges public tourist discovery, digital pass reservations, and turnstile check-in with an operator admin control console.

---

## 1. High-Level Architecture & Technical Stack

- **Stack**: Pure Vanilla Web Technologies — HTML5, CSS3, ES6+ JavaScript.
- **Build System**: None / Zero-dependency. Does not require Webpack, Vite, npm, or Babel. All files run natively in any modern browser.
- **State Management & Persistence**: [`js/store.js`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/js/store.js) implements `TourismHubStore` via `window.localStorage`.
- **Real-Time Cross-Tab Synchronization**:
  - Leverages browser `storage` events across different tabs.
  - Dispatches custom in-tab `tourismhub:sync` events (`CustomEvent`) so changes within the same tab update immediately.
  - Any operator change in [`admin.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/admin.html) (adding attractions, updating slot capacity, broadcasting weather alerts) propagates in real-time to the public portal ([`index.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/index.html) and sub-pages) without page reload.
- **Authentication & Role-Based Routing**:
  - Unified entry point at [`login.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/login.html) with 1-click demo profiles and registration.
  - Auto-routes **Admin/Operators** to [`admin.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/admin.html) and **Tourists** to [`index.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/index.html).

---

## 2. Directory Structure & File Inventory

```
attraction_system_demo/
├── index.html            # Public Tourist Portal (Home, search, featured catalog, pass modal)
├── login.html            # Unified Authentication Portal (Tourist & Operator login/registration)
├── admin-login.html      # Legacy operator login page (auto-redirects to login.html)
├── admin.html            # Operator Admin Dashboard (Catalog, capacity, scanner, analytics, advisories)
├── attractions.html      # Public Sub-Page: Attractions & Events Catalog Browser + Modal
├── capacity.html         # Public Sub-Page: Real-Time Capacity & Schedule Availability Monitor
├── notifications.html    # Public Sub-Page: Tourist Advisories & Notification Center
├── scanner.html          # Public Sub-Page: Entry Pass QR Scanner (Viewfinder simulation)
├── README.md             # Project overview & quick start guide
├── CLAUDE.md             # This comprehensive architecture & developer reference guide
├── css/
│   ├── styles.css        # Main portal styles, layout, design tokens, responsive drawer
│   ├── login.css         # Split-screen responsive authentication UI styling
│   ├── admin.css         # Operator Admin console styling (dark navy rail, analytics widgets)
│   ├── admin-login.css   # Security terminal styling (legacy admin login)
│   └── portal-pages.css  # Shared styling for sub-pages (top bar, tables, stat cards, scanner reticle)
├── js/
│   ├── store.js          # Shared state store (CRUD, auth, pass validation, storage listeners)
│   ├── app.js            # Main tourist portal controller (catalog filters, booking modal, toasts)
│   ├── login.js          # Unified authentication, session handling, 1-click demo quick-fill
│   ├── admin.js          # Operator console logic (tab routing, catalog CRUD, capacity sliders, logs)
│   ├── admin-login.js    # Legacy admin terminal login script
│   ├── sidebar.js        # Universal responsive sidebar drawer controller (single source of truth)
│   └── portal-sync.js    # Multi-tab bidirectional sync engine for standalone portal pages
└── assets/
    ├── hero-banner.jpg   # Hero showcase banner
    ├── rizal-monument.jpg# Rizal Monument & Luneta Park media asset
    ├── white-beach.jpg   # White Beach Boracay media asset
    └── pahiyas-festival.jpg # Lucban Pahiyas Festival media asset
```

---

## 3. Core Modules & Functionality

### 3.1 Unified Authentication Portal ([`login.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/login.html))
- **Role-Based Redirection**:
  - Checks if entered email belongs to operator records (`TourismHubStore.getAdminUsers()`).
  - If operator -> invokes `adminLogin()`, grants clearance, and redirects to `admin.html`.
  - If tourist -> invokes `clientLogin()`, sets tourist session, and redirects to `index.html` (or `?redirect=` target).
- **1-Click Demo Profiles**:
  - **Tourists**: `maria.santos@email.com` / `tourist123` (Resident), `alex.tan@visitor.sg` / `tourist123` (International).
  - **Operators**: `admin@tourismhub.gov.ph` / `admin123` (Chief Operator), `turnstile@tourismhub.gov.ph` / `gate2026` (Turnstile Officer).
- **Account Registration**: Tab switcher enables guest visitor registration with instant session creation.

### 3.2 Public Tourist Portal ([`index.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/index.html))
- **Hero & Search**: Dynamic keyword search, category dropdown filter (Historical, Beach, Festival), and clickable suggestion tags.
- **Quick Action Grid**: 1-click category filtering for Attractions, Events, Capacity, and Notifications.
- **Featured Catalog**: Card grid with real-time badges, pricing, ratings, and wishlist toggles.
- **Pass Reservation Modal**: Date picker, guest party counter, dynamic total calculation, and pass issuance.
- **"My Digital Passes" Modal**: Generates digital pass with SVG QR code, holder metadata, and Apple/Google Wallet actions.
- **Mobile Bottom Navigation Bar**: Fixed bottom navigation on viewport `< 768px`.

### 3.3 Standalone Public Sub-Pages
Connected to the universal sidebar navigation drawer:
1. **Attractions & Events ([`attractions.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/attractions.html))**:
   - Filter tabs (`All`, `Attractions`, `Events`, `Amenities`), keyword search, and area filter.
   - Dynamic top metric cards (Total Attractions, Live Events, Active Slots, Visitor Attendance).
   - "+ Add Attraction" modal allowing visitors/partners to submit new listings directly to `TourismHubStore`.
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

### 3.4 Operator Admin Dashboard ([`admin.html`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/admin.html))
Tabbed Single-Page Application (SPA) console for park managers:
- **Overview & Control (`#overview`)**: High-level KPI counters, today's turnstile throughput, quick actions.
- **Attraction Catalog (`#catalog`)**: Full CRUD (Add new attraction, edit modal, delete, status toggle `Active` / `Maintenance`).
- **Capacity & Schedule (`#capacity`)**: Interactive slot capacity sliders to alter booked visitor counts in real time.
- **QR Scanner (`#scanner`)**: Turnstile gate scanner with 1-click test buttons for valid, expired, and duplicate passes.
- **Analytics & Reports (`#analytics`)**: Hourly peak attendance graph, category distribution bars, and scan success rates.
- **Announcements & Advisories (`#announcements`)**: Broadcast dispatcher for storm warnings, gate extensions, and park advisories.
- **Session & Sign Out**: Displays operator credentials and logs out securely to `login.html`.

### 3.5 Universal Sidebar Navigation ([`js/sidebar.js`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/js/sidebar.js))
- Manages the off-canvas drawer navigation across all public pages.
- Listens for `#sidebarToggleBtn`, `#sidebarCollapseBtn`, `#sidebarBackdrop`, and the `Escape` key.
- **Auto-Close Behavior**: Automatically closes the sidebar whenever a user clicks any navigation link or modal action.
- **Initialization Guard**: Uses `sideNav.dataset.sidebarInitialized = 'true'` to ensure event listeners are never bound more than once.

---

## 4. State Management & Storage Schema ([`js/store.js`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/js/store.js))

### LocalStorage Keys
| Key | Identifier | Purpose |
|---|---|---|
| `tourismhub_catalog_v1` | `KEYS.CATALOG` | Array of attraction and event catalog objects |
| `tourismhub_capacity_v1` | `KEYS.CAPACITY` | Dictionary mapping attraction IDs to arrays of time slots |
| `tourismhub_announcements_v1` | `KEYS.ANNOUNCEMENTS` | Array of operator announcements and advisories |
| `tourismhub_passes_v1` | `KEYS.PASSES` | Dictionary of issued tourist passes keyed by pass code |
| `tourismhub_logs_v1` | `KEYS.LOGS` | Array of recent turnstile scan log records |
| `tourismhub_admin_auth_v1` | `KEYS.ADMIN_AUTH` | Active operator session object |
| `tourismhub_client_auth_v1` | `KEYS.CLIENT_AUTH` | Active tourist session object |
| `tourismhub_client_users_v1` | `KEYS.CLIENT_USERS` | Array of registered tourist user accounts |

### Core Data Models

#### Attraction Object
```typescript
{
  id: string;               // e.g. "rizal-monument", "white-beach-boracay"
  title: string;            // Name of attraction or festival
  category: string;         // "Historical Site" | "Tourist Spot" | "Festival" | "Amenity"
  type: string;             // "historical" | "beach" | "festival" | "amenity"
  status: "active" | "maintenance";
  operatingHours: string;   // e.g. "06:00 AM - 09:00 PM"
  admission: string;        // e.g. "Free Entry / Guided $15"
  price: number;            // Numeric rate
  capacityPerSlot: number;  // Default visitor capacity per window
  image: string;            // Asset path or URL
  location: string;         // City / Province
  badge: string;            // Label tag (e.g. "Iconic Landmark")
  description: string;
}
```

#### Capacity Slot Object
```typescript
{
  id: string;               // e.g. "rm-1"
  time: string;             // e.g. "08:00 AM - 10:00 AM"
  booked: number;           // Current visitor count booked
  max: number;              // Maximum allowable capacity
  status: "open" | "near-full" | "sold-out";
}
```

#### Tourist Pass Object
```typescript
{
  code: string;             // e.g. "PASS-8842-MNL"
  attractionId: string;     // Reference to attraction ID
  attraction: string;       // Attraction title
  visitorName: string;      // Primary passholder name
  partySize: number;        // Number of visitors (pax)
  date: string;             // Date string (YYYY-MM-DD or readable)
  slot: string;             // Timeslot window
  status: "valid" | "expired" | "already_used";
  issuedAt: string;         // Timestamp
  checkedInAt?: string;     // Check-in timestamp when validated
}
```

#### Turnstile Pass Validation States
1. `valid` -> Access Granted; updates pass status to `already_used` and records entry in `KEYS.LOGS`.
2. `already_used` -> Duplicate Denied; logs rejected attempt with prior scan time.
3. `expired` -> Denied (Expired); logs rejection due to elapsed time-window.
4. `invalid` -> Invalid (Unregistered); pass code not located in database.

---

## 5. Development Workflow & Commands

### Running Locally
Because TourismHub is a client-side web application, any static HTTP server can serve the project.

**Using Python**:
```powershell
python -m http.server 3000
```
Then navigate to:
- Tourist Portal: `http://localhost:3000/index.html`
- Unified Login: `http://localhost:3000/login.html`
- Operator Admin: `http://localhost:3000/admin.html`

**Using Node.js**:
```powershell
npx serve . -p 3000
```

### Validating JavaScript Syntax
Verify all JavaScript files with Node before committing changes:
```powershell
node -c js/store.js js/app.js js/login.js js/admin.js js/admin-login.js js/sidebar.js js/portal-sync.js
```

### Testing Real-Time Synchronization
1. Open `http://localhost:3000/admin.html` in Tab 1.
2. Open `http://localhost:3000/index.html` (or `attractions.html` / `capacity.html`) in Tab 2.
3. In Tab 1, adjust capacity sliders, add a new attraction, or publish an emergency advisory.
4. Observe Tab 2 instantly updating its cards, metrics, and alert banners via `TourismHubStore.onSync`.

---

## 6. Design System & UI Tokens

Defined in [`css/styles.css`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/css/styles.css) under `:root`:

| Token | Value | Semantic Meaning |
|---|---|---|
| `--primary` | `#0284c7` | Brand Sky Blue (interactive links, buttons, focus outlines) |
| `--primary-dark` | `#0369a1` | Dark Blue (button hovers, active tabs) |
| `--primary-light` | `#e0f2fe` | Soft Sky Blue (subtle active pill backgrounds) |
| `--secondary` | `#10b981` | Emerald Green (success states, open slot badges, active indicators) |
| `--accent-coral` | `#f97316` | Coral Accent (festivals, urgent events, alerts) |
| `--accent-amber` | `#f59e0b` | Amber Warning (near-full capacity slots) |
| `--accent-rose` | `#f43f5e` | Crimson Rose (sold-out badges, rejected passes) |
| `--bg-dark` | `#08172b` | Deep Navy (navigation drawer background, operator console accents) |
| `--text-main` | `#0f172a` | Slate 900 (primary headings and body copy) |
| `--text-muted` | `#64748b` | Slate 500 (secondary captions and metadata labels) |
| `--font-heading` | `Plus Jakarta Sans`, sans-serif | Prominent headers, brand titles, metric values |
| `--font-body` | `Inter`, sans-serif | Form controls, description copy, table data |

---

## 7. Development Guidelines & Important Rules

1. **No External Frameworks**: Maintain pure vanilla JavaScript, HTML, and CSS. Avoid adding React, Vue, or Tailwind unless explicitly requested.
2. **Preserve Single Source of Truth for Navigation**:
   - Sidebar drawer logic must remain centralized inside [`js/sidebar.js`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/js/sidebar.js).
   - Never attach redundant click listeners to `#sidebarToggleBtn` inside page-specific scripts like `app.js` or `portal-sync.js`.
3. **Sidebar Auto-Close Requirement**:
   - Any link or actionable modal trigger inside `.sidebar-menu-link` must automatically close the sidebar drawer upon selection.
4. **Bidirectional State Sync**:
   - When modifying data models, always route through `TourismHubStore` helper methods (`addAttraction`, `saveCapacityData`, `addAnnouncement`, `addPass`, `validatePass`).
   - Do not manipulate raw `localStorage` directly in UI files.
5. **Role Separation**:
   - Operator controls belong in `admin.html`.
   - The public portal (`index.html`, `attractions.html`, etc.) must not expose raw admin credentials or direct destructive database controls.
   - All role-based authentication flows route through `login.html`.
