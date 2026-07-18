import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { thumbUrl } from "../lib/thumb";
import { useGallery, invalidateGalleryCache } from "../lib/useGallery";
import Head from "../components/Head";
import ConsultButton from "../components/ConsultButton";
import { altFor, keywordsFor, ANCHORS } from "../lib/seo";

/**
 * Dedicated Portfolio page — routed at `/portfolio`.
 *
 * Design contract (iteration 15 studio brief):
 *   • Independent page — NOT a scroll-anchor on the home page.
 *   • Renders ONLY photographs where `featured_portfolio === true` in the
 *     admin gallery. Nothing else. If a photo isn't checked in /admin →
 *     it is completely excluded — no blank placeholder cells, no broken
 *     frames.
 *   • On mount the shared `useGallery` cache is invalidated so a fresh
 *     query hits the database and any admin-side check-list toggle from
 *     the last 45 seconds shows up immediately.
 *   • Same editorial masonry engine as the home gallery (Picture 2 spec)
 *     so watermarks stay visible and images render at their natural
 *     aspect ratio.
 */
export default function PortfolioPage() {
  // Force-refresh the shared gallery cache on every entry so admin
  // checkbox toggles are reflected instantly. Runs synchronously before
  // useGallery's first read.
  const [refreshedAt] = useState(() => {
    invalidateGalleryCache();
    return Date.now();
  });

  const { photos, loading } = useGallery();

  // Also refresh when we return to this page after navigating away
  // (e.g. admin toggles a photo then hits Portfolio in the nav).
  useEffect(() => {
    const onFocus = () => invalidateGalleryCache();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // STRICT filter — only photos explicitly flagged for portfolio.
  // Sort by `home_order` if present (admin sequencing), then by created_at.
  const items = useMemo(() => {
    return (photos || [])
      .filter((p) => p.featured_portfolio === true && !!p.image)
      .sort((a, b) => {
        const ao = a.home_order == null ? Number.POSITIVE_INFINITY : a.home_order;
        const bo = b.home_order == null ? Number.POSITIVE_INFINITY : b.home_order;
        if (ao !== bo) return ao - bo;
        return (a.created_at || "").localeCompare(b.created_at || "");
      });
  }, [photos, refreshedAt]);

  return (
    <main
      data-testid="portfolio-page"
      className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)] min-h-screen"
    >
      <Head
        title="Curated Interior Design Portfolio · Best Interior Designers in Mumbai | CAREMANTO SOLUTIONS"
        description="A curated portfolio of luxury interior designs by Caremanto Solutions — best interior designers in Mumbai. Residential interior architecture, turnkey commercial fit-outs, heritage restoration and renovation across India. Free interior consultation."
        canonical="https://caremanto.in/portfolio"
        keywords={keywordsFor()}
      />

      <div className="max-w-[1500px] mx-auto px-6 md:px-14">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14 md:mb-20"
        >
          <div className="overline text-[var(--gold)] mb-3">Portfolio · Chapter One</div>
          <h1
            data-testid="portfolio-heading"
            className="font-serif text-[clamp(2.2rem,4.4vw,3.75rem)] leading-[1.02] text-[var(--ink)] max-w-[900px]"
          >
            The commissions we return to — <em className="italic text-[var(--gold-hi)] font-normal">quietly, slowly, on purpose.</em>
          </h1>
          <p className="text-[13.5px] leading-relaxed text-[var(--muted)] mt-6 max-w-[620px]">
            A curated selection of Caremanto Solutions' recent work — residential
            interior architecture, turnkey commercial fit-outs and heritage
            restoration commissions. Every image below is hand-picked from the
            studio's archives.
          </p>
        </motion.header>

        {loading && items.length === 0 ? (
          <PortfolioSkeleton />
        ) : items.length === 0 ? (
          <PortfolioEmpty />
        ) : (
          <div
            data-testid="portfolio-grid"
            className="portfolio-gallery-container"
          >
            {items.map((p, i) => (
              <figure
                key={p.id}
                className="portfolio-item-card"
                data-testid={`portfolio-item-${i}`}
              >
                <img
                  src={thumbUrl(p.image, 1000)}
                  alt={altFor(p, i)}
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={i < 4 ? "high" : "auto"}
                />
                {(p.title || p.subcategory) && (
                  <figcaption className="pt-3 pb-1">
                    <div className="text-[9px] tracking-[0.28em] uppercase text-[var(--gold)]">
                      {p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}
                    </div>
                    {p.title && (
                      <div className="font-serif text-[17px] leading-tight text-[var(--ink)] mt-1">
                        {p.title}
                      </div>
                    )}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <div className="mt-20 md:mt-28 flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-[var(--line-strong)]/60">
          <p className="text-[12px] tracking-[0.14em] uppercase text-[var(--muted)] max-w-md">
            Interested in a similar commission? A conversation is where every
            project begins.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/works"
              className="btn-pill"
              data-testid="portfolio-view-works"
            >
              {ANCHORS.browseGallery}
            </Link>
            <ConsultButton label={ANCHORS.bookConsult} testId="portfolio-consult" />
          </div>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------- helpers */

function PortfolioSkeleton() {
  return (
    <div className="portfolio-gallery-container" aria-busy="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="portfolio-item-card animate-pulse bg-[var(--bg-2)]"
          style={{
            aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "4/5" : "1/1",
          }}
        />
      ))}
    </div>
  );
}

function PortfolioEmpty() {
  return (
    <div
      data-testid="portfolio-empty"
      className="border border-[var(--line-strong)]/60 py-24 md:py-32 text-center"
    >
      <div className="overline text-[var(--gold)] mb-3">Portfolio · Coming Soon</div>
      <h2 className="font-serif text-[24px] md:text-[28px] leading-tight text-[var(--ink)] max-w-[560px] mx-auto">
        We're curating the next chapter.
      </h2>
      <p className="text-[13px] text-[var(--muted)] mt-4 max-w-[420px] mx-auto">
        The studio's editorial cover set will appear here once photography is
        flagged for portfolio in the admin dashboard.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link to="/works" className="btn-pill">Browse the Full Gallery</Link>
      </div>
    </div>
  );
}
