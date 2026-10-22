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
├── admin.html            # Attraction Operator Admin Dashboard
├── css/
│   ├── styles.css        # Public portal stylesheets
│   └── admin.css         # Separated Operator Admin Dashboard styles
├── js/
│   ├── app.js            # Public portal interactivity & pass generation
│   └── admin.js          # Admin dashboard logic, scanner, & capacity controls
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

Simply open either file in any modern web browser:
- **Public Portal**: Open [`index.html`](index.html) to explore attractions and generate tourist passes.
- **Admin Dashboard**: Open [`admin.html`](admin.html) to manage catalog records, monitor capacities, scan passes, and dispatch alerts.