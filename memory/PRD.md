# Caremanto Solutions — PRD

## Original Problem Statement
> "So I have an interior designing business and simultaneously a wing for restoration and renovations. I need a UI/UX integrated website with seamless transitions between tabs. In the tabs and our works sections I need multiple dropdown boxes — one for interiors and other for restoration and renovation. High-profile, powerful, superior, classy feel. Reference: vividdesign.in — but ours should be superior."

Additional request: "There will be a lot of pictures — a separate dropdown for Gallery, filtered by **Space** (Bathroom / Bedroom / Kitchen…) and **Work Segment** (Furniture / TV Units / Wardrobe…). Must be customisable."

## User Choices
- Brand: **Caremanto Solutions** · Tagline: **Redefining Spaces**
- Contact form: **Store leads in DB + Resend email notifications**
- Portfolio content: **Sample projects seeded**; user will upload own images later
- Admin panel: **Yes** — extensible for future blogs, partnerships, features
- Design vibe: **Design agent choice** → Dark Luxury Editorial (Cormorant Garamond + Outfit, obsidian + gold)

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`) — cookie-based JWT auth, Motor (MongoDB), Resend via Emergent proxy, HTTPX async client.
- **Frontend**: React 19 + React Router 7 + framer-motion 11 + Lenis (smooth momentum scroll) + react-fast-marquee + Tailwind + shadcn/ui + Sonner toasts.
- **Design**: Dark editorial (`#0A0B0E` obsidian + `#C8A97E` gold), Cormorant Garamond serif + Outfit sans, grain overlay, framer-motion parallax hero, masked line-by-line reveal, editorial marquee, numbered manifesto chapters, staggered bento grids.

## API Endpoints (all under `/api`)
Public: `GET /`, `GET /projects[?category=…]`, `GET /projects/{id}`, `GET /gallery[?space=…&segment=…]`, `GET /gallery/taxonomy`, `POST /leads`
Auth: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
Admin (cookie-auth): `POST/PUT/DELETE /admin/projects[/{id}]`, `POST/PUT/DELETE /admin/gallery[/{id}]`, `PUT /admin/gallery/taxonomy`, `GET /admin/leads`, `PATCH/DELETE /admin/leads/{id}`

## What's Implemented (2026-07-16)
- **Home**: kinetic hero (masked reveal + parallax) → editorial marquee → Divisions (two practices) → 4-chapter Manifesto → Featured Works bento → closing quote.
- **/works**: category tabs (All / Interiors / Restoration) + sub-practice italic filters (Residential, Commercial, Hospitality, Heritage Restoration, Facade Renewal, etc.) + staggered bento grid.
- **/works/:id**: editorial project detail with story block and multi-image grid.
- **/gallery**: two-axis filtering (Space × Work Segment) with masonry columns + lightbox.
- **/studio, /approach, /contact**: editorial content pages.
- **/admin/login**: cookie-based JWT auth.
- **/admin**: three tabs — Projects (CRUD), Gallery (CRUD + Taxonomy editor + Bulk-add), Leads (status changes + delete + reply-via-email).
- **Sample data**: 6 projects + 8 gallery photos + admin user auto-seeded on startup.
- **Consultation lead**: saved to Mongo + Resend email attempt to `STUDIO_NOTIFICATION_EMAIL`.
- **Motion**: Lenis smooth scroll, framer-motion scroll-reveals, hover states, parallax, marquee, staggered bento animations.

## Test Credentials
- Admin URL: `/admin/login`
- Email: `admin@caremanto.com`
- Password: `Caremanto@2026`
- Studio notification email (env `STUDIO_NOTIFICATION_EMAIL`): `info@caremanto.solutions` (editable in `/app/backend/.env`)

## P1 Backlog (deferred, non-blocking)
1. **Image uploads** — currently image URLs only. Add a file uploader (Cloudinary / S3 / local uploads) so admin can upload photos directly.
2. **Blogs module** — schema + admin CRUD + `/journal` public route.
3. **Partnerships module** — logos grid + partner detail.
4. **Rate limiting / brute-force lockout** on `/api/auth/login` (playbook recommends 5 attempts / 15-min lockout).
5. **Public origin restriction** — change `CORS_ORIGINS` from `*` to explicit preview URL (safety hardening).
6. **Password reset flow** for admin.
7. **Multi-admin roles** (editor vs super-admin) as the studio scales.

## P2 Backlog
- Instagram embed of latest posts.
- Press / Awards section on `/studio`.
- Search + tag facets on gallery.
- Sitemap + Open Graph metadata for social sharing.
- Analytics events (page views, gallery filter usage, lead conversion).

## Notes
- Sample projects/photos are flagged with `is_sample=true` in the DB — admin can filter and replace as real photography arrives.
- Gallery taxonomy is fully editable from admin (`/admin` → Gallery tab → Categories) — no code changes needed to add new spaces or work segments.
