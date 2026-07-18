import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../lib/api";
import { toast } from "sonner";

/**
 * AdminFolderManager
 *
 * Replaces the old textarea-based taxonomy editor with a proper folder
 * configuration panel.
 *
 * Layout:
 *   - Every parent category is a section (Residential / Commercial /
 *     Restoration & Renovations).
 *   - Every sub-folder is a clickable chip (not a text input).
 *   - Clicking a chip slides out a drawer that lets the studio:
 *       1. Assign / change the folder's Cover picture (click-to-set).
 *       2. Bulk-move multiple photos to a different folder.
 *       3. Delete photos from the folder.
 *
 * RESTORATION & RENOVATIONS has no sub-folders — it presents as a single
 * chip that opens directly to the photo bucket.
 */

const TAXONOMY = {
  "RESIDENTIAL": ["Hall & Dining", "Bedrooms", "Bathrooms", "Kitchens", "Balcony / Dry Area / Temple"],
  "COMMERCIAL":  ["Office spaces", "Retail Design", "Hospitality"],
  "RESTORATION & RENOVATIONS": [],
};
const CATEGORIES = Object.keys(TAXONOMY);

export default function AdminFolderManager() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState(null); // { category, subcategory }

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/gallery");
      // Guard: a transient empty payload (cache-invalidation race after a
      // toggle) would otherwise wipe `photos`, which unmounts any open
      // FolderDrawer body mid-interaction. Only replace when we got a
      // non-empty array — keep the last-good snapshot otherwise.
      if (Array.isArray(r.data) && r.data.length > 0) {
        setPhotos(r.data);
      } else if (Array.isArray(r.data) && r.data.length === 0) {
        setPhotos((prev) => (prev && prev.length ? prev : []));
      }
    }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const countIn = (cat, sub) =>
    photos.filter((p) => p.category === cat && (sub === null ? true : p.subcategory === sub)).length;
  const coverIn = (cat, sub) =>
    photos.find((p) => p.category === cat && (sub === null ? true : p.subcategory === sub) && p.is_cover) ||
    photos.find((p) => p.category === cat && (sub === null ? true : p.subcategory === sub)) || null;

  return (
    <div className="admin-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-[26px]">Folder Manager</h2>
        <div className="text-[11px] tracking-widest uppercase text-[var(--gold-hi)]">
          {photos.length} photos across {CATEGORIES.length} categories
        </div>
      </div>
      <p className="text-[12px] text-[#F5EEE0]/60 mb-8 max-w-2xl">
        Click any folder chip to change its cover image, bulk-move photos, or delete assets.
        Restoration & Renovations has no sub-folders — its chip opens the flat photo bucket.
      </p>

      {loading ? (
        <div className="py-16 text-center overline">Loading folders…</div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const subs = TAXONOMY[cat];
            const noSubs = subs.length === 0;
            return (
              <div key={cat}>
                <div className="flex items-baseline gap-3 mb-4">
                  <div className="overline text-[var(--gold-hi)]">{cat}</div>
                  <div className="text-[10px] text-[#F5EEE0]/50">{countIn(cat, null)} photograph{countIn(cat, null) === 1 ? "" : "s"}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(noSubs ? [null] : subs).map((sub) => {
                    const cover = coverIn(cat, sub);
                    const count = countIn(cat, sub);
                    return (
                      <button
                        key={sub ?? "all"}
                        onClick={() => setOpenFolder({ category: cat, subcategory: sub })}
                        data-testid={`folder-chip-${(sub || cat).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="group relative overflow-hidden bg-[#241D16] border border-[#F5EEE0]/10 hover:border-[var(--gold-hi)] transition-colors text-left h-[132px]"
                      >
                        {cover ? (
                          <img src={cover.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-70 transition-opacity" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                        <div className="relative p-4 h-full flex flex-col justify-end text-white">
                          <div className="font-serif text-[18px] leading-tight">{sub || "All photographs"}</div>
                          <div className="text-[10px] tracking-[0.24em] uppercase text-[var(--gold-hi)] mt-1">
                            {count} photo{count === 1 ? "" : "s"} · Configure →
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDE-OUT DRAWER */}
      <AnimatePresence>
        {openFolder && (
          <FolderDrawer
            key={`${openFolder.category}-${openFolder.subcategory}`}
            categories={CATEGORIES}
            taxonomy={TAXONOMY}
            category={openFolder.category}
            subcategory={openFolder.subcategory}
            allPhotos={photos}
            onClose={() => setOpenFolder(null)}
            onChanged={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================= */

function FolderDrawer({ categories, taxonomy, category, subcategory, allPhotos, onClose, onChanged }) {
  // Base folder photos derived from parent's `allPhotos`. We also maintain
  // an in-drawer optimistic-patch layer so toggles (Portfolio, Cover, etc.)
  // reflect INSTANTLY in the drawer UI without waiting for the parent
  // refresh round-trip. Whenever `allPhotos` refreshes we merge the patch
  // over the fresh data so we never render stale values.
  const [patches, setPatches] = useState({}); // { photoId: partialPhotoDiff }
  const patchPhoto = (id, diff) =>
    setPatches((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...diff } }));

  const inFolder = useMemo(
    () =>
      allPhotos
        .filter((p) => p.category === category && (subcategory === null ? true : p.subcategory === subcategory))
        .map((p) => ({ ...p, ...(patches[p.id] || {}) })),
    [allPhotos, category, subcategory, patches]
  );
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [destCategory, setDestCategory] = useState("");
  const [destSubcategory, setDestSubcategory] = useState("");
  const [busy, setBusy] = useState(false);

  const destSubs = destCategory ? (taxonomy[destCategory] || []) : [];
  useEffect(() => { setDestSubcategory(destSubs[0] || ""); /* eslint-disable-next-line */ }, [destCategory]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelectedIds(new Set(inFolder.map((p) => p.id)));
  const clearAll  = () => setSelectedIds(new Set());

  const setAsCover = async (photo) => {
    setBusy(true);
    try {
      // Un-cover every other photo in this folder, cover this one.
      const others = inFolder.filter((p) => p.id !== photo.id && p.is_cover);
      for (const o of others) {
        await api.put(`/admin/gallery/${o.id}`, { ...o, is_cover: false });
      }
      await api.put(`/admin/gallery/${photo.id}`, { ...photo, is_cover: true });
      toast.success("Cover updated.");
      onChanged();
    } catch { toast.error("Failed to update cover."); }
    finally { setBusy(false); }
  };

  const removeCover = async (photo) => {
    setBusy(true);
    try {
      await api.put(`/admin/gallery/${photo.id}`, { ...photo, is_cover: false });
      toast.success("Cover cleared.");
      onChanged();
    } catch { toast.error("Failed."); }
    finally { setBusy(false); }
  };

  // Toggle the portfolio flag on any photograph directly from the folder
  // drawer. When enabled the photo appears on the dedicated /portfolio page.
  //
  // Optimistic update: we flip the value in local state BEFORE the network
  // round-trip so the button re-renders immediately. If the PUT fails we
  // roll back and toast the error. This fixes the stale-closure bug where
  // consecutive clicks would send the same payload twice.
  const togglePortfolio = async (photo) => {
    const nextValue = !photo.featured_portfolio;
    // 1) optimistic patch
    patchPhoto(photo.id, { featured_portfolio: nextValue });
    setBusy(true);
    try {
      await api.put(`/admin/gallery/${photo.id}`, {
        ...photo,
        featured_portfolio: nextValue,
      });
      toast.success(nextValue ? "Added to Portfolio." : "Removed from Portfolio.");
      onChanged();
    } catch {
      // 2) rollback on failure
      patchPhoto(photo.id, { featured_portfolio: photo.featured_portfolio });
      toast.error("Portfolio toggle failed.");
    } finally {
      setBusy(false);
    }
  };

  const bulkMove = async () => {
    if (!destCategory) return toast.error("Choose a destination category.");
    const destSubsForCat = taxonomy[destCategory] || [];
    if (destSubsForCat.length > 0 && !destSubcategory) return toast.error("Choose a destination sub-folder.");
    if (selectedIds.size === 0) return toast.error("Select at least one photograph.");
    if (!window.confirm(`Move ${selectedIds.size} photograph(s) to ${destCategory}${destSubsForCat.length ? " · " + destSubcategory : ""}?`)) return;
    setBusy(true);
    try {
      let done = 0;
      for (const id of selectedIds) {
        const p = inFolder.find((x) => x.id === id);
        if (!p) continue;
        await api.put(`/admin/gallery/${id}`, {
          ...p,
          category: destCategory,
          subcategory: destSubsForCat.length ? destSubcategory : "",
          // moving out of the folder means it can no longer be the cover for the original folder
          is_cover: false,
        });
        done++;
      }
      toast.success(`Moved ${done} photograph(s).`);
      setSelectedIds(new Set());
      onChanged();
    } catch { toast.error("Bulk move failed."); }
    finally { setBusy(false); }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return toast.error("Select at least one photograph.");
    if (!window.confirm(`Delete ${selectedIds.size} photograph(s) permanently?`)) return;
    setBusy(true);
    try {
      for (const id of selectedIds) {
        await api.delete(`/admin/gallery/${id}`);
      }
      toast.success(`Deleted ${selectedIds.size} photograph(s).`);
      setSelectedIds(new Set());
      onChanged();
    } catch { toast.error("Delete failed."); }
    finally { setBusy(false); }
  };

  /**
   * Smart Grid Layout — admin-only, applied at save time.
   *
   * Step A: Remove exact duplicate uploads (same image URL) — keep the earliest.
   * Step B: Reorder the remaining photos so back-to-back near-neighbours (photos
   *         uploaded together, likely showing the same angle) get spread across
   *         the folder. We split the created_at-sorted list in half and
   *         interleave the two halves, then persist a `folder_order` index.
   */
  const applySmartLayout = async () => {
    if (inFolder.length < 2) return toast.error("Need at least two photographs to rebalance.");
    if (!window.confirm(
      "Apply Smart Grid Layout?\n\n" +
      "This will remove exact-duplicate uploads and re-sequence the remaining " +
      "photographs to avoid similar shots clustering together. Cannot be undone."
    )) return;
    setBusy(true);
    try {
      // --- A. Dedupe by exact image URL, keep the oldest ---
      const byImage = new Map();
      const sortedByTime = inFolder
        .slice()
        .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
      const dupes = [];
      const keep = [];
      for (const p of sortedByTime) {
        if (byImage.has(p.image)) { dupes.push(p); }
        else { byImage.set(p.image, p); keep.push(p); }
      }
      for (const d of dupes) {
        try { await api.delete(`/admin/gallery/${d.id}`); } catch { /* ignore */ }
      }

      // --- B. Interleave first-half / second-half to spread near-neighbours ---
      const half = Math.ceil(keep.length / 2);
      const first = keep.slice(0, half);
      const second = keep.slice(half);
      const rebalanced = [];
      for (let i = 0; i < half; i++) {
        if (first[i])  rebalanced.push(first[i]);
        if (second[i]) rebalanced.push(second[i]);
      }

      // --- C. Persist folder_order via bulk endpoint ---
      await api.put("/admin/gallery/folder-order", {
        order: rebalanced.map((p) => p.id),
      });

      const removed = dupes.length;
      toast.success(
        removed > 0
          ? `Smart Layout applied · ${removed} duplicate${removed === 1 ? "" : "s"} removed · ${rebalanced.length} resequenced.`
          : `Smart Layout applied · ${rebalanced.length} photograph${rebalanced.length === 1 ? "" : "s"} resequenced.`
      );
      onChanged();
    } catch (e) {
      toast.error("Smart Layout failed.");
    } finally {
      setBusy(false);
    }
  };

  const title = subcategory || category;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 34 }}
        role="dialog"
        aria-modal="true"
        data-testid="folder-drawer"
        className="fixed right-0 top-0 h-screen w-full md:w-[720px] bg-[#1B1611] border-l border-[#F5EEE0]/10 z-[61] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 md:p-8 border-b border-[#F5EEE0]/10">
          <div>
            <div className="overline text-[var(--gold-hi)] mb-1">{category} · Folder</div>
            <h3 className="font-serif text-[28px] md:text-[32px] leading-tight text-white">{title}</h3>
            <div className="text-[11px] text-[#F5EEE0]/60 mt-1">{inFolder.length} photograph{inFolder.length === 1 ? "" : "s"}</div>
          </div>
          <button data-testid="folder-drawer-close" onClick={onClose} className="w-10 h-10 border border-[#F5EEE0]/25 text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {inFolder.length === 0 ? (
            <div className="py-16 text-center text-[#F5EEE0]/60">
              No photographs in this folder yet. Use “+ Add Photograph” below the manager to upload.
            </div>
          ) : (
            <>
              {/* Cover picker */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="overline text-[var(--gold-hi)]">Assign Cover Picture</div>
                    <p className="text-[11px] text-[#F5EEE0]/60 mt-1">Click any photograph to designate it as the folder's cover on the live site.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {inFolder.map((p) => (
                    <div key={p.id} className="relative aspect-square overflow-hidden group">
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                      <button
                        data-testid={`folder-drawer-cover-${p.id}`}
                        onClick={() => p.is_cover ? removeCover(p) : setAsCover(p)}
                        disabled={busy}
                        className={`absolute inset-0 flex items-center justify-center text-[10px] tracking-[0.24em] uppercase transition-colors ${
                          p.is_cover
                            ? "bg-[var(--gold-hi)]/90 text-black"
                            : "bg-black/0 hover:bg-black/60 text-transparent hover:text-white"
                        }`}
                      >
                        {p.is_cover ? "● Active Cover — click to clear" : "○ Set as Cover"}
                      </button>
                      {/* Portfolio toggle — sits on top of the cover button,
                          top-right corner. Clicking it does NOT propagate to
                          the cover click below. */}
                      <button
                        type="button"
                        data-testid={`folder-drawer-portfolio-${p.id}`}
                        onClick={(e) => { e.stopPropagation(); togglePortfolio(p); }}
                        disabled={busy}
                        title={p.featured_portfolio ? "Remove from /portfolio page" : "Add to /portfolio page"}
                        className={`absolute top-2 right-2 z-10 px-2 py-1 text-[9px] tracking-[0.24em] uppercase transition-all ${
                          p.featured_portfolio
                            ? "bg-[var(--gold-hi)] text-black"
                            : "bg-black/70 text-white opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {p.featured_portfolio ? "★ Portfolio" : "☆ Portfolio"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bulk reassign */}
              <section>
                <div className="overline text-[var(--gold-hi)] mb-3">Bulk Reassign / Delete</div>
                <p className="text-[11px] text-[#F5EEE0]/60 mb-3">Select photographs, then move them to a different folder or delete them.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={selectAll} className="admin-btn ghost text-[11px]" data-testid="folder-drawer-select-all">Select All</button>
                  <button onClick={clearAll}  className="admin-btn ghost text-[11px]" data-testid="folder-drawer-clear">Clear</button>
                  <span className="text-[11px] text-[#F5EEE0]/60 self-center ml-1">{selectedIds.size} selected</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {inFolder.map((p) => {
                    const sel = selectedIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggle(p.id)}
                        data-testid={`folder-drawer-select-${p.id}`}
                        className={`relative aspect-square overflow-hidden text-left transition-all ${
                          sel ? "outline outline-[3px] outline-[var(--gold-hi)]" : "outline outline-transparent hover:outline hover:outline-[1px] hover:outline-[#F5EEE0]/40"
                        }`}
                      >
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                        <span className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[11px] font-bold ${
                          sel ? "bg-[var(--gold-hi)] text-black" : "bg-black/60 text-white border border-white/40"
                        }`}>{sel ? "✓" : ""}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <label className="block">
                    <span className="overline text-[10px] block mb-1">Move to Category</span>
                    <select
                      className="admin-input"
                      value={destCategory}
                      onChange={(e) => setDestCategory(e.target.value)}
                      data-testid="folder-drawer-dest-cat"
                    >
                      <option value="">Select…</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="overline text-[10px] block mb-1">
                      Move to Sub-folder {destSubs.length === 0 && destCategory ? "(not applicable)" : ""}
                    </span>
                    <select
                      className="admin-input"
                      value={destSubcategory}
                      onChange={(e) => setDestSubcategory(e.target.value)}
                      disabled={destSubs.length === 0}
                      data-testid="folder-drawer-dest-sub"
                    >
                      {destSubs.length === 0
                        ? <option value="">—</option>
                        : destSubs.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <button
                    onClick={bulkMove}
                    disabled={busy || selectedIds.size === 0}
                    className="admin-btn disabled:opacity-60"
                    data-testid="folder-drawer-apply-move"
                  >
                    Move {selectedIds.size ? `(${selectedIds.size})` : ""}
                  </button>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={bulkDelete}
                    disabled={busy || selectedIds.size === 0}
                    className="admin-btn danger disabled:opacity-60"
                    data-testid="folder-drawer-bulk-delete"
                  >
                    Delete Selected
                  </button>
                </div>
              </section>

              {/* Smart Grid Layout — admin-only, applied at save time */}
              <section
                data-testid="smart-layout-section"
                className="border border-[var(--gold-hi)]/30 bg-[#241D16] p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="overline text-[var(--gold-hi)] mb-1">✦ Smart Grid Layout</div>
                    <p className="text-[11.5px] text-[#F5EEE0]/70 leading-relaxed max-w-md">
                      Runs a one-shot rebalance on this folder:
                      <br />
                      <span className="text-[#F5EEE0]/90">1.</span> Removes exact-duplicate uploads (same file URL).
                      <br />
                      <span className="text-[#F5EEE0]/90">2.</span> Re-sequences the remaining photographs so similar
                      angles uploaded together get spread across the folder instead of clustering.
                    </p>
                  </div>
                  <button
                    onClick={applySmartLayout}
                    disabled={busy || inFolder.length < 2}
                    className="admin-btn disabled:opacity-60 whitespace-nowrap"
                    data-testid="folder-drawer-smart-layout"
                  >
                    Apply Smart Layout
                  </button>
                </div>
                <div className="text-[10px] tracking-[0.24em] uppercase text-[#F5EEE0]/50">
                  Admin-only · Applied at save time · Live site updates on refresh
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-[#F5EEE0]/10 text-right">
          <button onClick={onClose} className="admin-btn ghost">Close</button>
        </div>
      </motion.aside>
    </>
  );
}
