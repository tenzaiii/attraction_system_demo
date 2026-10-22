# TourismHub — Centralized Attraction & Visitor Management System

A centralized platform for attraction operators to manage attraction profiles, events, visitor capacity, QR Tourist Pass validation, real-time analytics, and tourist notification dispatching.

---

## 🎯 Project Overview & Objectives

TourismHub provides attraction operators with tools to streamline entry processing, prevent overcrowding, and support data-driven tourism operations.

### Key Objectives & Modules

1. **Attraction & Event Cataloging Module**:
   - Digital profiles, operating hours, admission rates, descriptions, and media galleries for destinations, historical sites, festivals, and workshops.
2. **Capacity & Schedule Management Module**:
   - Real-time monitoring of scheduled time-slot allocations against maximum allowable limits to prevent overcrowding.
3. **QR Tourist Pass Scanning Module**:
   - Turnstile entry-point verification for visitor QR passes with instant status feedback and entry logging.
4. **Admin Analytics Dashboard Module**:
   - Reporting tools for operators to monitor peak visiting hours, daily attendance trends, and category distribution.
5. **Announcement & Notification Dispatch System**:
   - Broadcaster for weather advisories, schedule changes, and alerts to tourists.

---

## 📂 Project Structure

```
attraction_system_demo/
├── index.html            # Public Tourist Portal & Destination Discovery
├── login.html            # Unified Authentication Portal (Tourist & Admin Access)
├── admin.html            # Attraction Operator Admin Dashboard
├── attractions.html      # Attractions & Events Catalog Browser
├── capacity.html         # Real-time Capacity & Schedule Availability Monitor
├── notifications.html    # Tourist Advisories & Notification Center
├── scanner.html          # Public Entry Pass QR Verification Scanner
├── css/
│   ├── styles.css        # Main public portal stylesheets
│   ├── login.css         # Unified Portal login styling (split-screen responsive layout)
│   ├── admin.css         # Operator Admin Dashboard styles
│   └── portal-pages.css  # Sub-pages layout styling
├── js/
│   ├── app.js            # Public portal interactivity & pass generation
│   ├── login.js          # Unified authentication, role-based routing, & quick demo logic
│   ├── admin.js          # Admin dashboard controls, scanner, & capacity logic
│   ├── store.js          # Unified local storage real-time state store
│   ├── sidebar.js        # Responsive collapsible sidebar rail controller
│   └── portal-sync.js    # Multi-tab bidirectional real-time synchronization
├── assets/               # Destination media and hero banners
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

Simply open any of the HTML pages in any modern web browser:
- **Unified Sign In Portal**: Open [`login.html`](login.html) for unified authentication. Auto-routes based on account role:
  - **Tourist Access**: Demo profiles (**Maria Santos**, **Alex Tan**) or newly registered accounts route to [`index.html`](index.html).
  - **Admin Clearance**: Operator profiles (**Juan Miguel Repas**, **Carlos Mendoza**) route to [`admin.html`](admin.html).
- **Public Tourist Portal**: Open [`index.html`](index.html) to explore destinations, check schedules, and generate digital passes.
- **Admin Operator Dashboard**: Open [`admin.html`](admin.html) to manage catalog items, adjust capacities, scan entry passes, and broadcast alerts.