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

## What's Implemented (2026-07-17 · v3 — resilience + unlimited storage)

### Public site
- **Home**: Ken Burns hero slideshow driven by backend `hero_images` + `hero_interval_seconds` config; editorial marquee (`INTERIORS ✦ RESTORATION ✦ REDEFINING SPACES ✦ SERVICES`) with fully symmetric spacing; Divisions section; masonry HomeGallery with natural aspect ratios (watermark-safe).
- **/works — Portfolio landing**: three category tabs (RESIDENTIAL / COMMERCIAL / RESTORATION & RENOVATIONS). Residential = exactly 5 unique folder cards, Commercial = 3 folder cards, Restoration = direct grid. Clicking a folder card routes to `/works?folder=<name>` child view with "← Back to Folders" navigation.
- **/gallery — Reference library**: mirrors the Portfolio structure; folder cards → folder modal → lightbox with "Share as Pin ↗" (Web Share API + clipboard fallback).
- **/films**: public video wall from `/api/videos`.
- **Footer**: contact = `care@caremanto.in`; four social icons (Instagram / LinkedIn / Twitter / YouTube) with placeholder handles.
- **Global error boundary + axios guard**: unhandled rejections from failed API calls no longer surface the CRA "Uncaught runtime errors" overlay; the site shows a graceful "Something needed a quiet reset" screen with a Reload button on any React exception.
- **Meta**: Open Graph + Twitter card + Pinterest rich-pin tags on every URL for magazine-style link previews.
- **Cache**: `no-store` headers on `index.html` so future bundle updates propagate to iOS Safari immediately.

### /admin console (6 tabs, passless auto-login)
- **Gallery** — Folder Manager section (clickable folder chips → slide-out drawer with Cover Picker + Bulk Reassign + Delete). Individual photo CRUD with cascading Parent/Sub-folder dropdowns.
- **Portfolio** — Portfolio Feature Manager (per-photo `featured_portfolio` toggle, category filter, featured-only filter, bulk feature/un-feature).
- **Hero · Covers** — Hero Slideshow Configuration (interval seconds + gallery-photo multi-select) + Division Cover Cards.
- **Videos** — CRUD + device video uploads.
- **Projects** — CRUD.
- **Leads** — status changes + reply-via-email + delete.

### Storage & resilience (2026-07-17)
- **Emergent Object Storage** for every admin upload — essentially unlimited capacity. Uploads stream from a temp file on disk (1 MB chunks, flat RAM footprint), get PUT to the object store, and are served back through `/api/files/{path:path}` as a streaming proxy with 1-year immutable cache headers. Fallback to local disk if the object store is momentarily unavailable.
- **Legacy `/api/uploads/…`** static route preserved for pre-existing files.
- **Compatibility alias** `POST /api/upload` → `/admin/upload` for any client still on a stale bundle.

### Iteration 11 (2026-07-18) — Grid Restore + SEO / Security / Performance Foundation
**A. Grid restore (P0 hotfix):**
- Reverted the asymmetric bento (user disliked the letterbox padding) → back to the clean CSS multi-column masonry (`columns-1 sm:columns-2 lg:columns-3`) matching the original site look.
- `object-fit: cover` + `object-position: 50% 100%` — photos fill their cells with no random padding, and if any crop is needed it comes off the TOP so the studio watermark at the bottom stays visible.
- **Blank-tile race-condition fix** in `SmartImage`: cached images that completed loading before React attached `onLoad` used to stay at opacity 0 forever. Now `useEffect` checks `img.complete && naturalWidth > 0` on mount and syncs state.

**B. Performance (Rules A + B):**
- **GZipMiddleware** on FastAPI — verified `/api/gallery` compressed 147 KB → 20 KB (86 %).
- Long-lived `Cache-Control: public, max-age=31536000, immutable` on `/api/files/*` origin (Cloudflare edge policy in production may need a Cache Rule to preserve this).
- Hover prefetch (iteration 9) + SmartImage race fix (iteration 11) mean folder modals open effectively instantly on second visit.
- Layout-shift guard already in place: every `SmartImage` locks its container to a CSS `aspect-ratio`.

**C. SEO (Rule C):**
- **JSON-LD** structured data injected into `/public/index.html` as `@graph` — LocalBusiness + ProfessionalService + Organization + WebSite. Includes name, phone, email, address (Mumbai, 400078), areaServed (Mumbai + India), hasOfferCatalog with all 7 studio services.
- **Per-route SEO**: new `Head` component (dep-free) sets `<title>`, `<meta description>`, `<link rel=canonical>`, OG title/description/image, and page-specific `keywords`. Applied to Home, Works, Gallery, Studio, Contact, Approach — each with unique keyword-rich copy.
- **Keyword-rich alt tags** on every portfolio thumbnail (Home / Works / Gallery).
- **Static `robots.txt` and `sitemap.xml`** at `/public/` root — sitemap enumerates every deep folder (5 residential + 3 commercial + restoration).
- **Draft services copy** at `/app/memory/SEO_COPY_DRAFT.md` — awaits your review before we swap it into Divisions.jsx.

**D. Security (Rule D):**
- **Security headers middleware** on every response: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/mic/geo/payment all denied), Strict-Transport-Security (2-year HSTS with preload).
- **CSP in report-only mode** — strict policy shipped as observation-only so we can catch violations from Google Drive / Pexels / Emergent Object Storage before enforcement.
- **XSS sanitization** via `bleach.clean(strip=True)` on every free-text lead / marquee / nav field. Verified with `<script>alert(1)</script>Bob` → stored as `alert(1)Bob` and `<img onerror=alert(2)>Hi` → stored as `Hi`.
- **SQL injection**: not applicable — Motor (async MongoDB) uses BSON-parameterized ops everywhere; no raw query string concatenation.
- **HTTPS/TLS**: enforced by Emergent platform ingress + long HSTS header.
- **Regression pytest** at `/app/backend/tests/test_iteration11_security.py` — permanent guard on all 13 security + performance assertions.

**Testing**: iteration_11 100% pass (13/13 backend pytest + 100% frontend on validated checks).

### Iteration 10 (2026-07-18) — Editorial Asymmetric Bento *(reverted in iteration 11 — user preferred original 3-col layout)*
- **Complete rebuild of `HomeGallery`**: rigid uniform-square grid retired. Now a true CSS-Grid masonry with 12 desktop / 8 tablet / 4 mobile columns, `grid-auto-rows: 8px`, `grid-auto-flow: dense`, and per-tile row-span computed on load via ResizeObserver. Verified 5 distinct column-spans (3, 4, 5, 6, 7) render across 12 tiles — genuine editorial rhythm regardless of source photo ratios.
- **Zero-cropping guarantee**: `.bento-img` uses `object-fit: contain`, `height: auto`, natural aspect-ratio preserved from the source file. No zoom, no chop.
- **16-px watermark safety padding** on every `.bento-inner` — mathematically ensures the studio hologram/watermark at the bottom edge of each photograph is always fully visible.
- **Admin sequence still respected**: featured photos sort by `home_order` ASC (nulls last) before entering the bento, so admin drag/drop in Home Sequence remains the source of truth.
- **Hybrid span algorithm** (`colSpanFor`): pure ratio-driven mapping was collapsing to 2 spans when source photos shared similar ratios; new algorithm anchors specific indices to varied spans + widens ratio buckets → guarantees ≥3 distinct spans on any dataset.
- **Testing**: verified live at 1920×1080 → 5 distinct spans; watermark visible; no cropping; no horizontal overflow at 390×844 mobile.

### Iteration 9 (2026-07-18) — Studio polish batch
- **Homepage sequence DB sync**: `HomeGallery` now sorts featured photos strictly by `home_order` (ASC, nulls last, created_at tiebreaker). Saving the admin sequence invalidates the shared `useGallery` cache so live site updates on next page mount.
- **Aesthetic Grid Assistant**: New side-panel overlay (`[data-testid=aesthetic-assistant-panel]`) launched from the Home Sequence toolbar (`[data-testid=home-seq-assistant-toggle]`). Ships five studio-tested composition rules — alternate scale, break same-category clusters, lead with negative space, give heroes breathing room, front-load hero shots — each with a coloured Do/Avoid mini-grid.
- **Smart Grid Layout (admin-only, save-time)**: New section inside each folder drawer (`[data-testid=smart-layout-section]`). "Apply Smart Layout" runs a one-shot rebalance that (a) deletes exact-duplicate uploads (same image URL) and (b) interleaves the created_at-sorted halves to prevent burst uploads from clustering. Persisted via new endpoint `PUT /api/admin/gallery/folder-order` and honoured by both `/works` and `/gallery` (photos now sort by `folder_order` before `created_at`).
- **Hover prefetch**: Folder cards on `/works` and `/gallery` warm the browser image cache on `onMouseEnter` / `onFocus` / `onTouchStart` via `prefetchImageUrls(urls, 8)`. First few photos in a folder modal load instantly on click.
- **Consultation Modal validation + Other Services**: Field-level validation with per-field toasts (name, phone shape 7–15 digits, email format, pincode ≠ 6 digits). Added "Other Services" as a third option in the Service Type dropdown. Form now uses `noValidate` so custom error messaging surfaces cleanly.
- **WhatsApp cleanup**: `ConsultButton` no longer renders the small green WhatsApp square next to the gold CTA. The channel now lives only inside `ConsultationModal` and `Footer`, per studio directive.
- **Testing**: iteration_9 hit 100% pass (backend pytest 4/4 + all 10 frontend acceptance items).

## Test Credentials
- Admin URL: `/admin/login` (auto-signs in; no credentials required)
- Fallback (still works): `admin@caremanto.com` / `Caremanto@2026`
- Studio notification email (env `STUDIO_NOTIFICATION_EMAIL`): `info@caremanto.solutions` (editable in `/app/backend/.env`)
- **/admin** (six tabs):
   - **Gallery** — CRUD + taxonomy + device uploads + per-photo toggles for Home / Portfolio / Cover.
   - **Portfolio** — NEW single-purpose *Portfolio Feature Manager* view. Filter by category or "Featured Only", toggle any card, bulk feature/un-feature.
   - **Hero · Covers** — NEW *Hero Slideshow Configuration*. Numeric interval seconds input (with 3/4.5/6/8 preset chips) + a filterable multi-checkbox grid of every uploaded photograph, plus the division cover cards.
   - **Videos** — CRUD + device video uploads.
   - **Projects** — CRUD.
   - **Leads** — status + reply + delete.
- **File uploads**: `/api/admin/upload` accepts images and videos, no explicit size cap.
- **Seeded content**: 48 real Google Drive photographs (Portfolio 3 folder), spread across the new taxonomy with 8 auto-set cover images and 14 auto-featured portfolio picks.
- **Startup migration**: legacy sub-category values (`Balcony - Dry Area`, `Office Spaces`, `Retail Design`, `Temple`) auto-renamed to the new schema on boot.

## Test Credentials
- Admin URL: `/admin/login` (auto-signs in; no credentials required)
- Fallback (still works): `admin@caremanto.com` / `Caremanto@2026`
- Studio notification email (env `STUDIO_NOTIFICATION_EMAIL`): `info@caremanto.solutions` (editable in `/app/backend/.env`)

## P1 Backlog (deferred, non-blocking)
1. **Rate limiting / brute-force lockout** on `/api/auth/login` (5 attempts / 15-min lockout).
2. **Public origin restriction** — change `CORS_ORIGINS` from `*` to explicit preview URL before launch.
3. **Password reset flow** for admin (currently passless-login is open — must gate before public launch).
4. **Blogs module** — schema + admin CRUD + `/journal` public route.
5. **Partnerships module** — logos grid + partner detail.
6. **Multi-admin roles** (editor vs super-admin) as the studio scales.
7. **Drag-and-drop reorder** inside each folder drawer.

## P2 Backlog
- Instagram embed of latest posts.
- Press / Awards section on `/studio`.
- Search + tag facets on gallery.
- Analytics events (page views, gallery filter usage, lead conversion).
- Studio-Reel video overlay under the Ken Burns hero.

## Notes
- All uploads now go to Emergent Object Storage (backend: `object-storage`) with local disk fallback (backend: `local`) when the object store is momentarily unreachable.
- Sample projects/photos are flagged with `is_sample=true` in the DB.
- Gallery taxonomy is fixed to 3 top-level categories with the new sub-folder scheme — restructures are handled by the startup migration in `server.py`.
- ⚠️ **Passless login** is currently open — `POST /api/auth/passless-login` grants admin without credentials. Gate this endpoint before public launch.
