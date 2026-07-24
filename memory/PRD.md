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

## What's Implemented (2026-07-24 · v7 — Admin nav restructure + Home Copy CMS + real-time sync + Apple skeletons)

### Admin console — streamlined 4-tab navigation
- **GALLERY** (Photos / Videos sub-toggle)
- **HERO & COVERS** (Home Sequence / Portfolio Features / Hero Covers sub-toggles)
- **GRID LAYOUTS** (Projects — Smart Grid Assistant visual preset redesign deferred to next round)
- **TEXT CUSTOMIZATION** (SEO Keywords · Home Page Copy · Footer · Nav)
- Leads accessible via a header pill + slide-over (kept out of primary nav per spec).

### Home Page Copy CMS
- New `Home Page Copy` sub-tab inside Text Customization edits every static string on the Home Page: hero headline (line1/accent/line2/line3), sub-headline, CTA labels, category chips, Divisions band eyebrow/title/lede + per-card copy/CTAs, section labels and CTA-band copy.
- Backend `DEFAULT_HOME_COPY` + `_merge_seo` overlay + PUT sanitizer: empty strings never overwrite defaults, so blanking a field restores the compiled string.
- Frontend `useHomeCopy(block, defaults)` hook wired into `Hero.jsx`; Divisions.jsx / marquee / section labels ready to bind in the follow-up round.

### Real-time synchronization
- `SiteSettingsProvider` and `useGallery` both poll every 20s + refetch on window `focus` — admin edits publish across every open tab within one poll cycle. No manual refresh required.
- Save clears the `caremanto:site-settings` localStorage so subsequent visits hydrate fresh.

### Apple-style skeleton loaders
- New `SkeletonGrid.jsx` — shimmer-blur placeholder tiles that preserve the 3-column masonry.
- Replaces "Loading portfolio…" / "Loading references…" text in `/works` and `/gallery` — no more unstyled flashes on cold start.

### Public Lightbox — ±3 neighbour preload
- Preloads 3 previous + 3 next images on every navigation event so arrow clicks are zero-lag.

### Admin gallery UX
- Photo grid renders 24-per-page pagination with **[Prev]/Next selectors at TOP AND BOTTOM** (`admin-pager-top`, `admin-pager-bottom`).
- Admin lightbox now reuses the shared `<Lightbox>` (testIdPrefix='admin') so admins get prev/next arrows + keyboard + swipe + neighbour preload.

### AdminSEOManager save fix (iteration 25 hotfix)
- Removed unreliable functional-updater "steal latest" trick — now uses `doc` state directly.
- Error toast payload always coerced to a string (was crashing ErrorBoundary when FastAPI returned a Pydantic error array).

### Testing
- iter24 → 100% backend (15/15), frontend 65% (surfaced the SEO save crash).
- iter25 hotfix → 100% frontend & backend across save flow, real-time sync, blank-fallback and regression.

## What's Implemented (2026-07-24 · v6 — Lightbox overhaul + pagination engine + auto ALT tags)

### Lightbox
- New shared `components/Lightbox.jsx` (used by both /works and /gallery via `testIdPrefix`).
- Floating prev/next chevrons with hairline borders; icon-only Share button in the top toolbar.
- Keyboard: ArrowLeft / ArrowRight / Escape. Pointer-drag swipe (>60px horizontal threshold).
- Neighbouring photos preloaded via `new Image()` so navigation feels instant.
- Removed all "Share as Pin ↗" pills and the `↗` overlays from gallery grid thumbnails. Share functionality preserved (Web Share API → clipboard fallback).

### Pagination + preload engine
- `Pagination.jsx` rewritten with numeric page selectors `[01] [02] [03] … [Next →]` (ellipsis for long ranges, active-page highlighted).
- WorksPage + GalleryPage preload Page N-1 and Page N+1 thumbnails via `prefetchImageUrls` when the page index changes.
- Page-change scroll target is now the grid element (`.scrollIntoView({block:'start'})`) — editorial header stays put.

### Cover-card blur-up skeleton
- `SmartImage` now renders `.smartimg-skeleton` (shimmer + blur) until the image fires `onLoad`, eliminating broken-card glitches on cold-start folder covers.

### Backend — automated ALT-tag generator
- New `generate_alt_text()` in `server.py` composes SEO-ready ALT strings from filename tokens + category descriptor + folder hint (e.g. `CAREMANTO SOLUTIONS — Luxury Residential Bathroom Interior Design`).
- Applied to `POST /admin/gallery` and `PUT /admin/gallery/{id}` — NEVER overwrites a manual `alt_text` override; regenerates only when both the incoming payload AND the existing record are empty.
- New `POST /api/admin/gallery/alt-preview` endpoint for the admin UI.
- `/admin/upload` now includes `alt_suggestion` in its JSON response.
- Frontend `altFor()` (`lib/seo.js`) reads `photo.alt_text` when present so all `<img>` renderings across grid / lightbox / cover cards inherit the stored alt.

### Testing
- iteration_22.json → 100% backend (9/9 pytest); GalleryPage lightbox migration bug caught + fixed in iteration_23.json → 100% frontend & backend.

## What's Implemented (2026-07-24 · v5 — Hero polish, strict service routing, editorial IA expansion)

### Hero
- Headline scaled ~25% down (`clamp(1.8rem,4.9vw,4.15rem)`) so it no longer overpowers the background asset.
- CTAs `Explore Portfolio` / `Begin a Conversation` compact (padding 10x20, 11px, 0.28em letter-spacing).
- Category strip reordered → 01 Residential · 02 Commercial · 03 Hospitality · 04 Heritage.

### Nav
- Explicit **Home icon button** (`data-testid=nav-home-icon` + mobile equivalent) on both desktop and mobile headers.
- Services dropdown now routes ONLY the exact "Restoration & Renovations" item to `/works?cat=RESTORATION%20%26%20RENOVATIONS`. Every other service (Heritage Restoration, Modernisation, Water-Proofing, Sound Proofing, Structural Renovations & Facade Renewal) opens the Consultation modal pre-filled with the clicked service label.

### Divisions / Hydration
- Removed `01/02 / DIVISION` badge overlays from the two Divisions cover cards.
- Home gallery cards now reserve an aspect-locked skeleton (`.portfolio-card-skeleton` shimmer, respects `prefers-reduced-motion`) until each image decodes — no FOUC on cold-start, column-count/watermark protection unchanged.
- Divisions cover images sit on a `bg-[var(--bg-2)]` canvas until they decode.

### Footer + Editorial IA
- Restructured footer to 4-2-2-2-2 grid: tagline, Studio+Practices, About Us, Insights, Contact+Follow.
- Interiors/Restoration links now use the correct `?cat=RESIDENTIAL` / `?cat=RESTORATION & RENOVATIONS` param.
- **Insights** section → `/insights/articles`, `/insights/blogs`, `/insights/news`, `/insights/guidance`.
- **FAQ** section → `/faq`.
- **About Us** expanded → `/about/team`, `/about/accreditation`, `/about/recognitions`, `/about/awards`, `/about/locations`.
- All 10 new pages powered by a single `EditorialPage.jsx` (per-preset title/lede/hint + sibling nav + `Begin a Conversation` CTA). Verified 100% via iteration_21.json.

## What's Implemented (2026-07-18 · v4 — Dynamic SEO/Footer/Nav CMS)

### Dynamic SEO Manager (NEW)
- **Backend**: `GET /api/seo` (public) + `PUT /api/admin/seo` (auth). Single `settings` doc with key `seo_settings` stores `sections` (home/residential/commercial/restoration/portfolio/studio × {title, description, og_image, keywords[]}), `footer` (tagline_1/2, email, phone, phone_dial, whatsapp_number, whatsapp_message, address_line1/2, socials[]), and `nav` (labels{home/portfolio/interior_projects/services/process/about_us/consult}, interior_items[], services_items[]). Deep-merge fallback so defaults always fill missing keys. XSS-hardened via bleach + html.unescape so `&` renders correctly. Keyword & social dedup are case-insensitive.
- **Frontend**: `SiteSettingsProvider` (`lib/useSiteSettings.jsx`) fetches once at boot, caches to `localStorage['caremanto:site-settings']` for zero-flicker rerenders. `useSEOFor({sectionKey, category, folder})` hook feeds `Head.jsx` on HomePage / WorksPage / GalleryPage / PortfolioPage. Nav.jsx + Footer.jsx consume dynamic labels / dropdown items / contact block / socials with static fallbacks.
- **Admin UI**: New `SEO · Content` tab in AdminDashboardPage. Three subtabs (SEO Keywords & Meta / Footer Content / Navigation Text). Per-section chip editor with add/remove/bulk-import. Instant publish (Save = live). Verified via 12/12 pytest + admin E2E (iteration_20.json).

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

### Iteration 17 (2026-07-18) — Admin drawer resilience (iteration 16 retest)
**MEDIUM regression from iteration 16 FIXED**: `AdminFolderManager.load()` used to wipe `photos` state on any transient empty `/gallery` response, which collapsed the open FolderDrawer body to 'No photographs' mid-interaction. Guard added: only replace `photos` when response is a non-empty array; otherwise keep the last-good snapshot.
- **Retest verified 100%** — Hall & Dining drawer stays populated at 156 tiles across 3 rapid Portfolio toggles. Pagination surfaces all still work. Portfolio page renders 21 curated photos.

### Iteration 16 (2026-07-18) — Editorial Pagination + Admin Toggle Fix
**A. Pagination**: Every sub-category folder now caps at 15 photos per page with a minimalist `Page NN of NN · ← Previous · Next →` switcher (`/app/frontend/src/components/Pagination.jsx`). Instant scroll-to-top on page change. Single-page folders (≤ 15 photos) render NO pagination. Solves the 'half photos missing' issue for large folders (Hall & Dining = 156, Bedrooms = 82) — browser no longer overwhelmed by 100+ lazy-loading images at once.
**B. Admin Portfolio toggle stale-closure bug** (iteration_15 HIGH bug) — fixed via optimistic-patch local state in FolderDrawer. Button caption flips instantly (<500 ms); rolls back on PUT failure.
- Testing: iteration_16 → 95% pass, iteration_17 retest → **100% pass** on all pagination + toggle scenarios.

### Iteration 15 (2026-07-18) — Dedicated /portfolio + Services Prefill
**User report**: Portfolio button + all Interior Projects / Services dropdown items landed on the same Residential page. Fixed by:
- Nav was writing `?category=…` but WorksPage reads `?cat=…` → mismatch caused silent fallback to Residential.
- Dropdown labels weren't mapped to the UPPERCASE constants inside WorksPage.
- Portfolio button now uses `useNavigate('/works')` + explicit scroll-to-top + clears any stale query params.
- New `INTERIOR_ROUTE` map resolves each dropdown label to the exact `{cat, folder}` tuple (Retail Design + Hospitality both resolve to Commercial category with the folder opened).
- New `isRestorationService` regex routes Services items containing "Restoration"/"Renovation" to the gallery, and every other Services item opens the Consultation modal via `useConsultation().open()` — no page navigation.
- Both desktop and mobile drawer updated.

**Testing**: iteration_14 100% pass (15/15 nav flows verified live via Playwright).

### Iteration 13 (2026-07-18) — Layout Restore v2 (Picture 2 masonry)
**User feedback**: Iteration 11's `object-cover` + fixed `aspect-ratio: 4/5` was cropping landscape shots into uniform squares and clipping the CAREMANTO watermark. User sent Picture 2 reference — true natural-aspect column masonry.

**Fix shipped**:
- New `.portfolio-gallery-container` + `.portfolio-item-card` CSS in `/app/frontend/src/index.css` — exact spec from the studio brief (column-count 3/2/1, break-inside: avoid, width 100%, height auto, `object-fit: contain !important`).
- **HomeGallery rewritten** with plain `<img width=100% height=auto>` tags — no SmartImage wrapper, no aspect-ratio lock. Natural aspect ratios preserved end-to-end. Verified 5 distinct card heights across 12 tiles at 1440 × 900 viewport.
- **WorksPage + GalleryPage folder-photo grid** updated to the same `.portfolio-gallery-container` layout — natural-aspect masonry inside every folder modal, no cropping.
- Every image uses `loading=eager` + `fetchPriority=high` for the first 3, `loading=lazy` for the rest — coupled with iteration 12's WebP/AVIF transcoder this delivers Picture 2 visual + Picture 1's performance goal.

**Testing**: verified live — 3 columns, 24 px gap, `object-fit: contain`, watermarks visible on every photograph.

### Iteration 12 (2026-07-18) — Phase 2 Media Pipeline
**On-the-fly WebP + AVIF image transcoding at `/api/files/{path}`**
- New `/app/backend/media_transcoder.py` — negotiates target format from HTTP Accept header (AVIF > WebP > raw), encodes via Pillow 12.3's native encoders, caches encoded copies on-disk at `/app/backend/.media_cache/{sha1}.{fmt}`.
- Verified: **14.7 MB source JPEG → 1.16 MB WebP (92% reduction)** / 1.36 MB AVIF (91% reduction). Second request served from cache in <200 ms.
- Safety guard: sources > 6 MB (configurable via `MAX_TRANSCODE_BYTES`) fall back to the raw stream to prevent cold-encode ingress 502s.
- Response headers: `Content-Type: image/{webp|avif}`, `Vary: Accept`, `Cache-Control: public, max-age=31536000, immutable`, `X-Caremanto-Transcoded: {fmt}`.
- Non-image content (videos, PDFs) passes through untouched.

**Video H.265 (HEVC) transcoding on admin upload**
- ffmpeg 5.1 installed on the container.
- `POST /api/admin/upload` now accepts a `BackgroundTasks` — when the uploaded file is `video/*`, a background subprocess transcodes to H.265 at 2500 kbps max, uploads the smaller sibling as `{stem}.h265.mp4` to Emergent Object Storage. Never blocks the admin response.
- Upload response includes `h265_url` and `h265_status` for video uploads so the frontend can use `<source src=h265>` with graceful fallback.

**Middleware hardening**
- `apply_security_headers` now correctly propagates downstream exceptions (client disconnect during transcode no longer surfaces as a `RuntimeError: No response returned.`).

**Deliverables**
- `/app/memory/SEO_COPY_PREVIEW.md` — side-by-side current-vs-proposed copy for user review (nothing published; awaits "publish" or edits).
- `/app/memory/CLOUDFLARE_RUNBOOK.md` — 9-step runbook to activate Cloudflare CDN when caremanto.in DNS is switched over.
- `/app/backend/tests/test_iteration12_transcode.py` — 11 pytest cases (100% pass, serial run).

**Testing**: iteration_11 + iteration_12 combined = **24/24 pytest pass (100%)**.

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
