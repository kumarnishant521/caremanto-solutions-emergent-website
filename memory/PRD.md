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

## What's Implemented (2026-07-17)
- **Home**: 4.5s Ken Burns hero slideshow, editorial marquee, Divisions (Interiors + Renovations/Restorations), 4-chapter Manifesto, home bento gallery (driven by `featured_home` flag), closing quote.
- **/works**: two-tier category dropdowns (Interiors, Restoration & Renovations).
- **/gallery**: two-axis filtering (Category × Sub-category), masonry columns, lightbox.
- **/films (also /videos)**: public video wall driven by `/api/videos`.
- **/studio, /approach, /contact**: editorial content pages.
- **/admin/login**: PASSLESS auto-entry — hitting the URL calls `POST /api/auth/passless-login` and drops the studio straight into `/admin`.
- **/admin**: five tabs — Gallery (CRUD + taxonomy + device uploads + featured-home toggle), Videos (CRUD + device video uploads), Covers · Hero, Projects, Leads.
- **File uploads**: `/api/admin/upload` accepts images and videos with no explicit size cap.
- **Seeded content**: 48 real Google Drive photographs auto-ingested (2026-07-17) across RESIDENTIAL / COMMERCIAL categories via `/app/backend/scripts/seed_drive_gallery.py`.
- **Consultation lead**: saved to Mongo + Resend email attempt to `STUDIO_NOTIFICATION_EMAIL`.

## Test Credentials
- Admin URL: `/admin/login` (auto-signs in; no credentials required)
- Fallback (still works): `admin@caremanto.com` / `Caremanto@2026`
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
