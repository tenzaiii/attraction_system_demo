# AGENTS.md — Agent Workspace Rules

This repository enforces project standards across all automated coding agents.

## Core Directives
1. Always reference [`CLAUDE.md`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/CLAUDE.md) and [`GEMINI.md`](file:///c:/Users/jacob/Documents/My%20Web%20Sites/attraction_system_demo/GEMINI.md) before planning or executing tasks in this repository.
2. Keep the architecture zero-dependency (pure vanilla HTML5, CSS3, ES6+ JavaScript).
3. Primary database is Supabase PostgreSQL (`public.profiles`, `public.catalog`, `public.capacity_slots`, `public.passes`, `public.announcements`); `localStorage` is for temporary caching and session persistence (`tourismhub_temp_*`).
4. Validate all JavaScript files (`node -c ...`) prior to completing changes.

