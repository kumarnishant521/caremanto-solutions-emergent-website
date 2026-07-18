import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { thumbUrl } from "../../lib/thumb";
import { invalidateGalleryCache } from "../../lib/useGallery";

/**
 * Homepage Media Sequence Control.
 *
 * Lists every photograph currently `featured_home=true`, in order, and lets
 * the studio:
 *   - Reorder using ↑ / ↓ buttons (also numeric rank input)
 *   - Remove a photograph from the home page
 *   - Add fresh photographs from the wider gallery
 *
 * Everything is queued in local state; a prominent "Save Sequence" commits
 * the new order to Mongo via /api/admin/gallery/home-sequence in one shot.
 */
export default function AdminHomeSequence() {
  const [seq, setSeq] = useState([]);         // ordered photos currently on the home page
  const [candidates, setCandidates] = useState([]); // photos not yet featured
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [homeR, allR] = await Promise.all([
        api.get("/gallery/home-sequence"),
        api.get("/gallery"),
      ]);
      const home = homeR.data || [];
      const homeIds = new Set(home.map((p) => p.id));
      setSeq(home);
      setCandidates((allR.data || []).filter((p) => !homeIds.has(p.id)));
      setDirty(false);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= seq.length) return;
    setSeq((prev) => {
      const next = prev.slice();
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setDirty(true);
  };

  const setRank = (idx, val) => {
    const target = Math.max(0, Math.min(seq.length - 1, Number(val) - 1));
    if (target === idx) return;
    setSeq((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDirty(true);
  };

  const removeFromHome = async (p) => {
    setSeq((prev) => prev.filter((x) => x.id !== p.id));
    setCandidates((prev) => [{ ...p, featured_home: false }, ...prev]);
    setDirty(true);
    // Persist the featured_home=false flag immediately so it disappears on the site.
    try { await api.put(`/admin/gallery/${p.id}`, { ...p, featured_home: false }); }
    catch { toast.error("Failed to update flag."); }
  };

  const addToHome = async (p) => {
    setCandidates((prev) => prev.filter((x) => x.id !== p.id));
    setSeq((prev) => [...prev, { ...p, featured_home: true }]);
    setDirty(true);
    try { await api.put(`/admin/gallery/${p.id}`, { ...p, featured_home: true }); }
    catch { toast.error("Failed to update flag."); }
  };

  const saveSequence = async () => {
    setSaving(true);
    try {
      await api.put("/admin/gallery/home-sequence", { order: seq.map((p) => p.id) });
      invalidateGalleryCache();
      toast.success("Home page sequence published.");
      setDirty(false);
    } catch { toast.error("Failed to save sequence."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="py-16 text-center overline">Loading sequence…</div>;

  return (
    <section className="space-y-8" data-testid="admin-home-sequence-panel">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="font-serif text-[28px] md:text-[32px]">Homepage Media Sequence Control</h2>
          <p className="text-[13px] text-[#F5EEE0]/70 mt-2 max-w-2xl">
            Drag the numeric rank or use ↑↓ to reorder. Add or remove photographs from the home
            page bento here — nothing changes on the live site until you press <em>Save Sequence</em>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAssistantOpen(true)}
            className="admin-btn ghost"
            data-testid="home-seq-assistant-toggle"
            title="Show the studio's grid composition guidelines"
          >✦ Aesthetic Grid Assistant</button>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="admin-btn ghost"
            data-testid="home-seq-add-toggle"
          >{pickerOpen ? "Close Picker" : "+ Add Photograph"}</button>
          <button
            onClick={saveSequence}
            disabled={saving || !dirty}
            data-testid="home-seq-save"
            className="admin-btn disabled:opacity-50"
          >{saving ? "Saving…" : dirty ? "★ Save Sequence" : "Sequence Saved"}</button>
        </div>
      </div>

      {/* Live preview strip — a masonry-mini of the home-page bento */}
      <div className="admin-card p-4 md:p-6" data-testid="home-seq-preview">
        <div className="flex items-baseline justify-between mb-3">
          <div className="overline text-[var(--gold-hi)]">Live Preview</div>
          <div className="text-[10px] text-[#F5EEE0]/50">
            {dirty ? "Unsaved order — visible only in preview" : "Currently published order"}
          </div>
        </div>
        {seq.length === 0 ? (
          <div className="py-8 text-center text-[#F5EEE0]/50 text-[12px]">
            No photographs on the home page yet.
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
            {seq.slice(0, 24).map((p, idx) => (
              <div
                key={`prev-${p.id}`}
                className="relative aspect-square overflow-hidden bg-[#241D16]"
                title={`#${idx + 1} · ${p.category}${p.subcategory ? " · " + p.subcategory : ""}`}
              >
                <img
                  src={thumbUrl(p.image, 200)}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 text-[9px] font-bold text-white bg-black/70 px-1.5 py-0.5">
                  {idx + 1}
                </span>
              </div>
            ))}
            {seq.length > 24 && (
              <div className="aspect-square flex items-center justify-center bg-[#241D16] border border-[#F5EEE0]/10 text-[10px] tracking-[0.2em] uppercase text-[#F5EEE0]/60">
                +{seq.length - 24}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add-photo picker */}
      {pickerOpen && (
        <div className="admin-card p-4 md:p-6">
          <div className="overline text-[var(--gold-hi)] mb-3">Add from gallery</div>
          {candidates.length === 0 ? (
            <div className="text-[12px] text-[#F5EEE0]/60">Every photograph is already featured on the home page.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto">
              {candidates.slice(0, 60).map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToHome(p)}
                  data-testid={`home-seq-add-${p.id}`}
                  className="relative aspect-square overflow-hidden hover:outline hover:outline-2 hover:outline-[var(--gold-hi)]"
                >
                  <img src={thumbUrl(p.image, 300)} alt="" loading="lazy" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-[var(--gold-hi)] text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center">+</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ordered list */}
      {seq.length === 0 ? (
        <div className="py-16 text-center text-[#F5EEE0]/60">
          No photographs featured on the home page yet. Click <strong>+ Add Photograph</strong> above.
        </div>
      ) : (
        <ul className="space-y-2">
          {seq.map((p, idx) => (
            <li
              key={p.id}
              data-testid={`home-seq-row-${p.id}`}
              className="grid grid-cols-[56px_84px_1fr_auto] items-center gap-4 p-3 bg-[#241D16] border border-[#F5EEE0]/10"
            >
              <input
                type="number"
                min={1}
                max={seq.length}
                value={idx + 1}
                onChange={(e) => setRank(idx, e.target.value)}
                data-testid={`home-seq-rank-${p.id}`}
                className="admin-input w-full text-center"
              />
              <img src={thumbUrl(p.image, 200)} alt="" className="w-[84px] h-[84px] object-cover" />
              <div className="min-w-0">
                <div className="overline text-[10px] text-[var(--gold-hi)]">{p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}</div>
                {p.title && <div className="font-serif text-[16px] truncate">{p.title}</div>}
                <div className="text-[10px] text-[#F5EEE0]/50 truncate mt-1">{p.image.split("/").pop()}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="admin-btn ghost text-[11px] px-2 disabled:opacity-30" data-testid={`home-seq-up-${p.id}`}>↑</button>
                <button onClick={() => move(idx, +1)} disabled={idx === seq.length - 1} className="admin-btn ghost text-[11px] px-2 disabled:opacity-30" data-testid={`home-seq-down-${p.id}`}>↓</button>
                <button onClick={() => removeFromHome(p)} className="admin-btn danger text-[11px]" data-testid={`home-seq-remove-${p.id}`}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* AESTHETIC GRID ASSISTANT — side-panel with do/don't examples */}
      <AnimatePresence>
        {assistantOpen && (
          <AestheticAssistantPanel onClose={() => setAssistantOpen(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ============================================================= */

function AestheticAssistantPanel({ onClose }) {
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
        data-testid="aesthetic-assistant-panel"
        className="fixed right-0 top-0 h-screen w-full md:w-[560px] bg-[#1B1611] border-l border-[#F5EEE0]/10 z-[61] flex flex-col"
      >
        <div className="flex items-start justify-between p-6 md:p-8 border-b border-[#F5EEE0]/10">
          <div>
            <div className="overline text-[var(--gold-hi)] mb-1">Aesthetic Grid Assistant</div>
            <h3 className="font-serif text-[24px] md:text-[28px] leading-tight text-white">
              Compose like an <span className="italic text-[var(--gold-hi)]">editor.</span>
            </h3>
            <p className="text-[11px] text-[#F5EEE0]/60 mt-2 max-w-md">
              Five studio-tested guidelines to sequence a home page bento that reads as
              intentional, layered, and quietly luxurious.
            </p>
          </div>
          <button
            onClick={onClose}
            data-testid="aesthetic-assistant-close"
            className="w-10 h-10 border border-[#F5EEE0]/25 text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] transition-colors flex-shrink-0"
          >×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-[#F5EEE0]">
          <Rule
            n="01"
            title="Alternate scale — never two heroes in a row"
            body="Put a wide architectural hero next to a tight detail shot. Two wide shots stacked kills rhythm and makes the page read as a slideshow, not a story."
            good={["wide", "tight", "wide", "tight"]}
            bad={["wide", "wide", "wide", "tight"]}
          />
          <Rule
            n="02"
            title="Break clusters of similar rooms"
            body="Don't sequence three bedrooms in a row. Interleave a bathroom or hallway between them so the eye resets and each room feels distinct."
            good={["bed", "bath", "bed", "living"]}
            bad={["bed", "bed", "bed", "bath"]}
            palette={{ bed: "#7A6852", bath: "#B6AA8A", living: "#4E3D2E" }}
          />
          <Rule
            n="03"
            title="Lead with negative space — end on warmth"
            body="Open the sequence with a bright, airy plate. Close it with a deep, warm-toned interior. This gives the scroll a beginning and an end."
            good={["airy", "mid", "mid", "warm"]}
            bad={["warm", "warm", "airy", "mid"]}
            palette={{ airy: "#EDE4D2", mid: "#A99A82", warm: "#38281A" }}
          />
          <Rule
            n="04"
            title="Give hero shots breathing room"
            body="Follow your #01 pick with a smaller, quieter image. Don't stack two attention-heavy compositions — the second will always steal from the first."
            good={["hero", "quiet", "quiet", "hero"]}
            bad={["hero", "hero", "quiet", "quiet"]}
          />
          <Rule
            n="05"
            title="Front-load your strongest chapters"
            body="Positions #1–#6 do 80% of the storytelling work — most visitors never scroll past card 8. Put your best shots in the first two rows."
            good={["★", "★", "★", "★", "○", "○"]}
            bad={["○", "○", "★", "○", "○", "★"]}
          />

          <div className="pt-4 border-t border-[#F5EEE0]/10">
            <div className="overline text-[var(--gold-hi)] mb-2">Quick checklist</div>
            <ul className="space-y-2 text-[13px] leading-relaxed text-[#F5EEE0]/85">
              <li>✓ Front-loaded your strongest hero in #1?</li>
              <li>✓ No two same-category rooms adjacent?</li>
              <li>✓ Alternating scale (wide / tight) at least every other tile?</li>
              <li>✓ Warm-toned close in the final position?</li>
              <li>✓ Total tiles ≤ 12 (the grid caps at 12 on the live site)?</li>
            </ul>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-[#F5EEE0]/10 text-right">
          <button onClick={onClose} className="admin-btn ghost" data-testid="aesthetic-assistant-done">
            Got it
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function Rule({ n, title, body, good, bad, palette }) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[10px] text-[var(--gold-hi)]">{n}</span>
        <h4 className="font-serif text-[17px] leading-tight text-white">{title}</h4>
      </div>
      <p className="text-[12.5px] text-[#F5EEE0]/70 mb-3 leading-relaxed">{body}</p>
      <div className="grid grid-cols-2 gap-3">
        <MiniGrid label="Do" tone="good" tiles={good} palette={palette} />
        <MiniGrid label="Avoid" tone="bad" tiles={bad} palette={palette} />
      </div>
    </div>
  );
}

function MiniGrid({ label, tone, tiles, palette }) {
  const good = tone === "good";
  const swatch = (kind) => {
    if (palette && palette[kind]) return palette[kind];
    if (kind === "wide") return "#6B5A44";
    if (kind === "tight") return "#B0A084";
    if (kind === "hero") return "#4E3D2E";
    if (kind === "quiet") return "#D6C7A8";
    if (kind === "★") return "#C9A667";
    if (kind === "○") return "#3A2E24";
    return "#8A7A5F";
  };
  return (
    <div className={`border ${good ? "border-[var(--gold-hi)]/40" : "border-red-500/30"} p-3`}>
      <div className={`text-[9px] tracking-[0.28em] uppercase mb-2 ${good ? "text-[var(--gold-hi)]" : "text-red-400/85"}`}>
        {good ? "◉ Do" : "✕ Avoid"} · {label}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {tiles.map((t, i) => (
          <div
            key={i}
            className={`${t === "wide" || t === "hero" ? "col-span-2 h-6" : "h-6"}`}
            style={{ background: swatch(t) }}
            title={t}
          />
        ))}
      </div>
    </div>
  );
}
