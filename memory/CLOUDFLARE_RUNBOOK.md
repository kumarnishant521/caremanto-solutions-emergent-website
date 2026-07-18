# Cloudflare CDN Runbook · Caremanto Solutions

> Follow the steps in order. Everything is done from the Cloudflare
> dashboard — no code changes needed on the app side after step 1.
> Total time: ~20 minutes.

---

## 0 · Prerequisites

- You control the `caremanto.in` DNS at your domain registrar (GoDaddy /
  Namecheap / BigRock / etc).
- You have (or will create) a Cloudflare account — the **Free plan is
  enough** for every rule below. Only upgrade to Pro/Business if you
  eventually need Bot Management, WAF Advanced or Image Resizing.

---

## 1 · Add the site to Cloudflare

1. Cloudflare Dashboard → **Add a Site** → enter `caremanto.in`.
2. Pick the **Free** plan.
3. Cloudflare scans your existing DNS records. Confirm both the `A` /
   `CNAME` for the apex domain (`caremanto.in`) and `www` are present.
4. Cloudflare gives you **two nameservers** (something like
   `linda.ns.cloudflare.com` / `bob.ns.cloudflare.com`). Go to your
   registrar and **replace the existing nameservers** with these two.
5. Propagation is usually 5–30 minutes. Cloudflare emails you when it's
   active.

---

## 2 · Point Cloudflare at the app origin

Currently your app runs on the Emergent preview URL
(`https://design-restore-pro.preview.emergentagent.com`). When you're
ready to switch caremanto.in to it:

1. Cloudflare → DNS → Records.
2. Add / edit the `CNAME` record:

   | Name | Target                                              | Proxy status |
   |------|-----------------------------------------------------|--------------|
   | `@`  | `design-restore-pro.preview.emergentagent.com`      | 🟠 Proxied   |
   | `www`| `design-restore-pro.preview.emergentagent.com`      | 🟠 Proxied   |

3. **Proxy status must be 🟠 Proxied (orange cloud)** — that's what makes
   Cloudflare a CDN in front of the app instead of just a DNS resolver.

*(When you migrate to a dedicated production URL, just change the CNAME
target. The rules below stay valid.)*

---

## 3 · SSL / HTTPS

1. Cloudflare → SSL/TLS → **Overview**.
2. Set **encryption mode = Full (strict)** — verifies the origin's TLS
   certificate. Emergent presents a valid cert already, so this works
   immediately.
3. SSL/TLS → **Edge Certificates**:
   - Always Use HTTPS: **ON**
   - Automatic HTTPS Rewrites: **ON**
   - HSTS: **Enable** — max-age 6 months, include subdomains, preload
     (matches the header the app already sends).
   - Minimum TLS Version: **1.2**
   - TLS 1.3: **ON**

---

## 4 · Compression + speed defaults

Cloudflare → Speed → **Optimization**:

- **Auto Minify**: enable **JavaScript** and **CSS** only (leave HTML off
  — some framework hydration payloads dislike minification).
- **Brotli**: ON *(complements the Gzip layer the app already ships)*.
- **Early Hints**: ON.
- **Rocket Loader**: OFF *(known to break React lazy loading; skip it).*

---

## 5 · **The Critical Cache Rule** *(fixes the minor note from iteration 11)*

The current preview environment sees a Cloudflare bot-management cookie
(`__cf_bm`) on `/api/files/*`, which forces `Cache-Control: no-store` on
the response, killing image caching at the browser. Fix:

1. Cloudflare → **Caching → Cache Rules → Create rule**.
2. Rule name: **`Cache immutable Caremanto files`**.
3. Filter:
   - **Field**: `URI Path`
   - **Operator**: `starts with`
   - **Value**: `/api/files/`
4. **Then**:
   - Cache eligibility: **Eligible for cache**
   - Edge TTL: **1 year (respect existing headers unavailable → 1y)**
   - Browser TTL: **1 year**
   - **Serve stale content while revalidating**: ON
5. **Deploy**.

Second rule (recommended):

1. Cache Rules → Create rule.
2. Name: **`No-cache Caremanto API mutations`**.
3. Filter: `URI Path` **matches regex** `^/api/(auth|admin|leads)`.
4. Then: **Bypass cache**.
5. Deploy.

---

## 6 · Bot / DDoS protection

Cloudflare → Security → **Bots**:

- Bot Fight Mode: **ON** *(free tier — safe default)*.

Cloudflare → Security → **WAF → Managed Rules**:

- Enable **Cloudflare Managed Ruleset** *(free tier)* — one click.

Cloudflare → Security → **Settings**:

- Security Level: **Medium** *(High blocks too many legitimate crawlers)*.
- Challenge Passage: **30 minutes**.

---

## 7 · Verification checklist

After DNS propagates:

```bash
# 1. Site loads over HTTPS via Cloudflare
curl -sI https://caremanto.in/ | grep -iE "server|cf-cache"
# expect:  server: cloudflare  |  cf-cache-status: DYNAMIC (or HIT)

# 2. Static assets cache with long TTL
curl -sI https://caremanto.in/api/files/<any-photo-path>.jpg | \
  grep -iE "cache-control|cf-cache|age"
# expect:  cache-control: public, max-age=31536000, immutable
#          cf-cache-status: HIT   (second request)

# 3. Modern image formats
curl -sI -H "Accept: image/avif" https://caremanto.in/api/files/<path>.jpg | \
  grep -iE "content-type|x-caremanto-transcoded"
# expect:  content-type: image/avif
#          x-caremanto-transcoded: avif

# 4. Security headers
curl -sI https://caremanto.in/api/gallery | \
  grep -iE "x-frame|content-security|strict-transport|x-content"
```

If Cache Rule from step 5 is working, `cf-cache-status: HIT` on second
request to any `/api/files/*` — this is the moment gallery scrolling
becomes instant for repeat visitors.

---

## 8 · Nice-to-haves (do these later)

- **Cloudflare Analytics** — free traffic dashboard, better than GA for
  raw crawler visibility.
- **Cloudflare Turnstile** — replace WhatsApp form spam prevention with
  a privacy-friendly CAPTCHA. One line change if we want it.
- **R2 Object Storage** — swap out Emergent Object Storage for R2 later
  if you want fully-owned files. Optional; current setup is fine.
- **Image Resizing (Pro plan)** — replaces our on-the-fly WebP/AVIF
  transcoder with Cloudflare's edge resizer. **Not needed** — we
  already achieve 91-92% compression from the origin.

---

## 9 · Rollback

If anything breaks:

1. Cloudflare → DNS → toggle proxy status from 🟠 Proxied to ⚪ DNS only.
2. The site now bypasses Cloudflare entirely and goes direct to the
   Emergent preview. Zero risk of downtime.

---

**Status**: Everything above is documented. Nothing was applied. Come
back to this runbook when you're ready to point caremanto.in DNS at
the Emergent-hosted app.
