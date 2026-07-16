# Caremanto Solutions — Product Requirements Document

## Original Problem Statement
> "So I have an interior designing business and simultaneously a wing for restoration and renovations. First off : I need you to build a UI/UX integrated website , I want it to have seamless transition between tabs. In the tabs and our works sections I need you to to have multiple drop down boxes one for interiors and other for restoration and renovation. I want the website to look high profile. I am providing some references link but they are only references , I want my website to have a more powerful superior and classy feel. https://www.vividdesign.in/"

**Follow-up requirements:**
- Business name: **Caremanto Solutions** — tagline **"Redefining Spaces"**
- Consultation submissions: store in DB + email notify studio (Resend, Emergent-managed)
- Portfolio: seed with elegant samples, real images/details to be provided later
- Admin panel: yes, customizable, extensible for future blogs / partnerships / features
- Design vibe: "Surprise me"
- **Additional dropdown:** Gallery grouped by **Spaces** (Bathroom, Bedroom, Kitchen…) and **Work Segments** (Furniture, TV Units, Wardrobe…)
- Website MUST feel Awwwards Site-of-the-Day: kinetic hero, masked reveals, editorial marquee, numbered manifesto, framer-motion + lenis smooth scroll, parallax.

## Users
- **Visitor / potential client** — browses portfolio, gallery, studio story; submits consultation.
- **Studio admin** — signs in at `/admin/login`, manages projects, gallery, leads, and gallery taxonomy.

## Architecture
- **Backend:** FastAPI + MongoDB (Motor). Bcrypt + PyJWT httpOnly cookie auth.
- **Frontend:** React + React Router 7 + Framer Motion + Lenis + react-fast-marquee. Shadcn UI available. Cormorant Garamond (serif) + Outfit (sans).
- **Design system:** Dark luxury editorial — obsidian palette (`#0A0B0E`, `#14151A`, `#1C1E26`) with muted gold accent (`#C8A97E`), 1px hairlines, generous negative space, grain overlay.

## Endpoints
- Public: `GET /api/projects[?category]`, `GET /api/projects/:id`, `GET /api/gallery[?space&segment]`, `GET /api/gallery/taxonomy`, `POST /api/leads`.
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Admin (auth-gated): CRUD for `/api/admin/projects`, `/api/admin/gallery`, PATCH/DELETE `/api/admin/leads/:id`, `PUT /api/admin/gallery/taxonomy`.

## Implemented (2026-07-16 — v1 launch)
- Award-caliber home page: kinetic hero with parallax + masked line-by-line reveal, editorial marquee, two-wing Divisions section, numbered Manifesto (4 chapters), Featured Works bento grid, closing quote CTA.
- Nav with **three dropdowns**: Interiors, Restoration & Renovation, and Gallery (two-column: By Space | By Work).
- `/works` filterable by category + sub-category (chips derived from NAV_CATEGORIES).
- `/works/:id` project detail with parallax cover, story pullquote, editorial gallery, related projects.
- `/gallery` filterable by space AND segment, with lightbox.
- `/studio`, `/approach`, `/contact` pages — full editorial layout.
- Consultation form → MongoDB `leads` + Emergent-managed Resend email to `info@caremanto.solutions`.
- Admin console at `/admin` (login `/admin/login`): tabs for Projects, Gallery, Leads, Settings (taxonomy editor).
- Auto-seeded 6 sample projects + 8 sample gallery photos.
- Fully responsive (desktop + mobile with hamburger dropdown).
- Testing agent iteration 1: 100% pass (15/15 backend, all critical frontend flows).

## Prioritized Backlog

### P0 — pre-launch prep
- Replace all sample projects and gallery photos with the studio's real work (admin panel handles this).
- Verify Emergent-managed Resend delivery to a real inbox once the studio's email is confirmed.
- Consider setting `CORS_ORIGINS` to the explicit preview/production URL (currently `*`).

### P1 — near-term enhancements
- Direct **image upload** in admin (currently URL-only) — S3/GCS via integration_playbook_expert.
- **Rate limiting / brute-force lockout** on `/api/auth/login` (5 attempts / 15 min).
- **Blog** module in admin (mentioned by user for future).
- **Partnerships** module (logos + case notes).
- Multi-image drag-reorder in project editor.

### P2 — future
- Multi-admin / role-based access.
- SEO + Open Graph metadata per project.
- Client testimonials carousel.
- WhatsApp / instant chat integration.
- Multilingual (English + Hindi).

## Credentials
See `/app/memory/test_credentials.md`.
