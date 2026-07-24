import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { thumbUrl } from "../../lib/thumb";

/**
 * Smart Grid Assistant (iteration 26)
 *
 * Purpose — offer 8 ready-made Bento layout PRESETS for the public Home
 * gallery. Each preset is a permutation of the currently-featured photos'
 * indices; applying a preset rewrites `home_order` on the top 12 admin-
 * featured photos so the public Home page rearranges instantly.
 *
 * Design:
 *   • No written instructions — the tab is a purely visual gallery of
 *     preset thumbnails, each rendered with actual featured photos so
 *     the admin previews the exact composition they'll ship.
 *   • Single-click "Apply Layout" per preset.
 *   • After apply, slots stay editable through the Hero & Covers →
 *     Home Sequence tab (drag / swap / delete), so nothing is locked.
 *
 * Zero-crop rule — presets never mutate an image; they only reorder.
 * The public HomeGallery masonry (`object-fit: contain !important`)
 * remains authoritative on the render side.
 */

const PRESET_SLOTS = 12;

// Each preset is an array of source indices — where the visual slot N
// pulls the Nth image from the selected preset ordering. e.g. [0,3,1,...]
// means slot-0 = photo[0], slot-1 = photo[3], slot-2 = photo[1], …
// The visual card uses aspectRatio hints to hint the resulting rhythm.
const PRESETS = [
  {
    key:  "asymmetric-hero-lead",
    name: "Asymmetric Hero Lead",
    tag:  "Editorial",
    order:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    aspects: ["3 / 4", "1 / 1", "2 / 3", "4 / 5", "1 / 1", "3 / 4", "2 / 3", "1 / 1", "4 / 5", "3 / 4", "1 / 1", "2 / 3"],
  },
  {
    key:  "balanced-dual-column",
    name: "Balanced Dual-Column",
    tag:  "Symmetry",
    order:   [0, 6, 1, 7, 2, 8, 3, 9, 4, 10, 5, 11],
    aspects: ["1 / 1", "1 / 1", "3 / 4", "3 / 4", "1 / 1", "1 / 1", "3 / 4", "3 / 4", "1 / 1", "1 / 1", "3 / 4", "3 / 4"],
  },
  {
    key:  "editorial-showcase",
    name: "Editorial Showcase",
    tag:  "Cinematic",
    order:   [0, 3, 6, 1, 4, 7, 2, 5, 8, 9, 10, 11],
    aspects: ["4 / 5", "3 / 4", "2 / 3", "3 / 4", "4 / 5", "1 / 1", "2 / 3", "3 / 4", "4 / 5", "1 / 1", "3 / 4", "2 / 3"],
  },
  {
    key:  "feature-mosaic",
    name: "Feature Mosaic",
    tag:  "Dense",
    order:   [0, 2, 4, 6, 8, 10, 1, 3, 5, 7, 9, 11],
    aspects: ["1 / 1", "3 / 4", "1 / 1", "2 / 3", "1 / 1", "3 / 4", "1 / 1", "4 / 5", "1 / 1", "2 / 3", "1 / 1", "3 / 4"],
  },
  {
    key:  "portrait-rhythm",
    name: "Portrait Rhythm",
    tag:  "Vertical Bias",
    order:   [0, 5, 1, 6, 2, 7, 3, 8, 4, 9, 10, 11],
    aspects: ["3 / 4", "2 / 3", "3 / 4", "4 / 5", "3 / 4", "2 / 3", "3 / 4", "4 / 5", "3 / 4", "2 / 3", "3 / 4", "4 / 5"],
  },
  {
    key:  "landscape-focus",
    name: "Landscape Focus",
    tag:  "Horizontal Bias",
    order:   [1, 3, 5, 7, 9, 11, 0, 2, 4, 6, 8, 10],
    aspects: ["4 / 3", "16 / 9", "3 / 2", "4 / 3", "16 / 9", "3 / 2", "4 / 3", "16 / 9", "3 / 2", "4 / 3", "16 / 9", "3 / 2"],
  },
  {
    key:  "gallery-wall",
    name: "Gallery Wall",
    tag:  "Uniform",
    order:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    aspects: ["1 / 1", "1 / 1", "1 / 1", "1 / 1", "1 / 1", "1 / 1", "1 / 1", "1 / 1", "1 / 1", "1 / 1", "1 / 1", "1 / 1"],
  },
  {
    key:  "featured-first",
    name: "Featured First",
    tag:  "Anchor Lead",
    order:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    aspects: ["4 / 5", "1 / 1", "1 / 1", "3 / 4", "1 / 1", "1 / 1", "3 / 4", "1 / 1", "1 / 1", "4 / 5", "3 / 4", "1 / 1"],
  },
];

export default function AdminGridAssistant() {
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null); // preset key currently applying

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/gallery");
      setPhotos(r.data || []);
    } catch {
      setPhotos([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const featured = useMemo(() => {
    return (photos || [])
      .filter((p) => p.featured_home)
      .slice()
      .sort((a, b) => {
        const ao = a.home_order == null ? Number.POSITIVE_INFINITY : a.home_order;
        const bo = b.home_order == null ? Number.POSITIVE_INFINITY : b.home_order;
        if (ao !== bo) return ao - bo;
        return (a.created_at || "").localeCompare(b.created_at || "");
      });
  }, [photos]);

  const pool = featured.slice(0, PRESET_SLOTS);

  const apply = async (preset) => {
    if (pool.length < 2) {
      toast.error("Feature at least 2 photos on the Home page first.");
      return;
    }
    setApplying(preset.key);
    // Build the new (photo, home_order) pairs. Each source index in
    // preset.order becomes the target slot number. Indices beyond the
    // pool length collapse to a stable trailing order.
    const updates = [];
    let slot = 0;
    for (const srcIdx of preset.order) {
      const ph = pool[srcIdx];
      if (!ph) continue;
      updates.push({ id: ph.id, home_order: slot });
      slot += 1;
    }
    try {
      // Use the existing bulk home-sequence endpoint for atomic ordering.
      await api.put("/admin/gallery/home-sequence", { order: updates.map((u) => u.id) });
      toast.success(`Layout applied — “${preset.name}” is live. Individual slots remain editable.`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Apply failed.");
    } finally { setApplying(null); }
  };

  return (
    <section data-testid="admin-grid-assistant" className="space-y-8">
      <header>
        <h2 className="font-serif text-[32px]">Grid Layouts</h2>
        <p className="text-[12px] text-[#F5EEE0]/60 max-w-2xl mt-1">
          Choose a composition. Each preset previews with your current featured photos.
        </p>
      </header>

      {loading ? (
        <div className="py-16 text-center overline">Loading featured photos…</div>
      ) : pool.length === 0 ? (
        <div className="admin-card p-10 text-center text-[#F5EEE0]/70">
          <div className="font-serif text-[22px] mb-2">No featured photos yet.</div>
          <div className="text-[12px] text-[#F5EEE0]/50 max-w-md mx-auto">
            Feature a few photos on the Home page (Gallery → toggle ★ Home) and return here to
            choose a composition.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {PRESETS.map((preset) => (
            <PresetCard
              key={preset.key}
              preset={preset}
              pool={pool}
              onApply={apply}
              applying={applying === preset.key}
              disabled={applying && applying !== preset.key}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PresetCard({ preset, pool, onApply, applying, disabled }) {
  return (
    <div className="admin-card p-4 flex flex-col" data-testid={`grid-preset-${preset.key}`}>
      {/* Visual preview — 3-column mini masonry using current photos. */}
      <div
        className="mb-4"
        style={{ columnCount: 3, columnGap: 4 }}
        aria-hidden="true"
      >
        {preset.order.slice(0, 9).map((srcIdx, i) => {
          const ph = pool[srcIdx] || pool[i % pool.length];
          if (!ph) return null;
          return (
            <div
              key={`${preset.key}-${i}`}
              style={{
                breakInside: "avoid",
                marginBottom: 4,
                aspectRatio: preset.aspects[i] || "1 / 1",
                overflow: "hidden",
                background: "var(--bg-2)",
              }}
            >
              <img
                src={thumbUrl(ph.image, 200)}
                alt=""
                loading="lazy"
                decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-auto gap-3">
        <div>
          <div className="font-serif text-[16px] leading-none">{preset.name}</div>
          <div className="overline text-[9px] mt-1 text-[var(--gold-hi)]/80">{preset.tag}</div>
        </div>
        <button
          onClick={() => onApply(preset)}
          disabled={disabled}
          data-testid={`grid-preset-apply-${preset.key}`}
          className={`admin-btn text-[11px] ${applying ? "opacity-70" : ""}`}
        >
          {applying ? "Applying…" : "Apply Layout"}
        </button>
      </div>
    </div>
  );
}
