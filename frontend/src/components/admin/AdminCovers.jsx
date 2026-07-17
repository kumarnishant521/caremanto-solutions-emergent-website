import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

/**
 * "Hero Slideshow Configuration" + Section Covers.
 * - Multi-select which gallery photos populate the hero carousel.
 * - Numeric slideshow interval (seconds).
 * - Editable division cover cards.
 */
export default function AdminCovers() {
  const [form, setForm] = useState({
    interiors_cover: "",
    restoration_cover: "",
    hero_images: [],           // array of image URLs
    hero_interval_seconds: 4.5,
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("ALL");

  const load = async () => {
    setLoading(true);
    try {
      const [c, g] = await Promise.all([api.get("/covers"), api.get("/gallery")]);
      setForm({
        interiors_cover:      c.data.interiors_cover   || "",
        restoration_cover:    c.data.restoration_cover || "",
        hero_images:          Array.isArray(c.data.hero_images) ? c.data.hero_images : [],
        hero_interval_seconds: typeof c.data.hero_interval_seconds === "number" ? c.data.hero_interval_seconds : 4.5,
      });
      setPhotos(g.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filteredPhotos = useMemo(() => {
    if (filterCat === "ALL") return photos;
    return photos.filter((p) => p.category === filterCat);
  }, [photos, filterCat]);

  const isSelected = (url) => form.hero_images.includes(url);
  const toggleImage = (url) => {
    setForm((prev) => {
      const list = prev.hero_images.slice();
      const idx = list.indexOf(url);
      if (idx >= 0) list.splice(idx, 1); else list.push(url);
      return { ...prev, hero_images: list };
    });
  };
  const selectAll = () => setForm((p) => ({ ...p, hero_images: filteredPhotos.map((x) => x.image) }));
  const clearAll  = () => setForm((p) => ({ ...p, hero_images: [] }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/covers", {
        interiors_cover:       form.interiors_cover.trim(),
        restoration_cover:     form.restoration_cover.trim(),
        hero_images:           form.hero_images,
        hero_interval_seconds: Number(form.hero_interval_seconds) || 4.5,
      });
      toast.success("Hero & covers updated.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed.");
    } finally { setSaving(false); }
  };

  const uploadInto = (key) => async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = `${process.env.REACT_APP_BACKEND_URL}${r.data.url}`;
      setForm((p) => ({ ...p, [key]: url }));
      toast.success("Uploaded — click Save to publish.");
    } catch { toast.error("Upload failed."); }
    e.target.value = "";
  };

  if (loading) return <div className="py-16 text-center overline">Loading…</div>;

  return (
    <section className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[32px]">Hero Slideshow Configuration</h2>
        <button data-testid="admin-save-covers" onClick={save} disabled={saving} className="admin-btn disabled:opacity-60">
          {saving ? "Saving…" : "Save Hero & Covers"}
        </button>
      </div>

      {/* Interval control */}
      <div className="admin-card p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <div className="overline mb-2">Slideshow Interval (Seconds)</div>
            <p className="text-[12px] text-[#F5EEE0]/60 max-w-xl">
              How long each hero image is held before cross-fading to the next.
              Wired live to the home-page carousel — save to publish.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0.5}
              max={60}
              step={0.5}
              data-testid="hero-interval-input"
              value={form.hero_interval_seconds}
              onChange={(e) => setForm({ ...form, hero_interval_seconds: e.target.value })}
              className="admin-input w-[120px] text-right"
            />
            <span className="text-[12px] text-[#F5EEE0]/60">sec</span>
            {[3, 4.5, 6, 8].map((s) => (
              <button
                key={s}
                onClick={() => setForm({ ...form, hero_interval_seconds: s })}
                className={`admin-btn ghost text-[11px] ${Number(form.hero_interval_seconds) === s ? "text-[var(--gold-hi)]" : ""}`}
                data-testid={`hero-interval-preset-${s}`}
              >{s}s</button>
            ))}
          </div>
        </div>
      </div>

      {/* Image multi-selector */}
      <div className="admin-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <div className="overline mb-2">Hero Image Multi-Selector</div>
            <p className="text-[12px] text-[#F5EEE0]/60 max-w-xl">
              Tick every photograph you want cycling through the hero. There is no cap —
              select as many as you like. If none are selected, the default real-project
              hero pool is used.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="admin-input"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              data-testid="hero-filter-cat"
            >
              <option value="ALL">All Categories</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="RESTORATION & RENOVATIONS">Restoration & Renovations</option>
            </select>
            <button onClick={selectAll} className="admin-btn ghost text-[11px]" data-testid="hero-select-all">Select All</button>
            <button onClick={clearAll}  className="admin-btn ghost text-[11px]" data-testid="hero-clear-all">Clear</button>
            <span className="text-[11px] text-[#F5EEE0]/60 ml-1">
              {form.hero_images.length} selected
            </span>
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="py-16 text-center text-[#F5EEE0]/50">No photographs yet — upload some in the Gallery tab.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredPhotos.map((p) => {
              const sel = isSelected(p.image);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleImage(p.image)}
                  data-testid={`hero-pick-${p.id}`}
                  className={`relative aspect-square overflow-hidden group transition-all ${
                    sel ? "outline outline-[3px] outline-[var(--gold-hi)]" : "outline outline-transparent hover:outline hover:outline-[1px] hover:outline-[#F5EEE0]/40"
                  }`}
                >
                  <img src={p.image} alt="" className="w-full h-full object-cover"/>
                  <div className={`absolute inset-0 bg-black/40 transition-opacity ${sel ? "opacity-30" : "opacity-0 group-hover:opacity-20"}`} />
                  <span className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[13px] font-bold border ${
                    sel ? "bg-[var(--gold-hi)] text-black border-[var(--gold-hi)]" : "bg-black/60 text-white border-white/40"
                  }`}>{sel ? "✓" : ""}</span>
                  <span className="absolute left-2 bottom-2 right-2 text-[9px] tracking-[0.2em] uppercase text-white/90 line-clamp-1">
                    {p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section division covers */}
      <div className="pt-4">
        <h3 className="font-serif text-[24px] mb-2">Division Cover Cards</h3>
        <p className="text-[12px] text-[#F5EEE0]/60 max-w-2xl mb-6">
          The two large cards on the home page — one each for INTERIORS and RENOVATIONS / RESTORATIONS.
        </p>

        <CoverField
          label="INTERIORS Division · Cover Image"
          testid="cover-interiors"
          value={form.interiors_cover}
          onChange={(v) => setForm({ ...form, interiors_cover: v })}
          onFile={uploadInto("interiors_cover")}
        />
        <div className="h-6" />
        <CoverField
          label="RENOVATIONS / RESTORATIONS Division · Cover Image"
          testid="cover-restoration"
          value={form.restoration_cover}
          onChange={(v) => setForm({ ...form, restoration_cover: v })}
          onFile={uploadInto("restoration_cover")}
        />
      </div>
    </section>
  );
}

function CoverField({ label, value, onChange, onFile, testid }) {
  return (
    <div className="admin-card p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <div className="aspect-[4/5] overflow-hidden bg-[#241D16]">
          {value
            ? <img src={value} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center text-[#F5EEE0]/40 text-[11px] tracking-widest uppercase">No image</div>
          }
        </div>
        <div className="flex flex-col">
          <div className="overline mb-3">{label}</div>
          <label className="block flex-1">
            <span className="text-[10px] tracking-[0.28em] uppercase text-[#F5EEE0]/60 block mb-2">Image URL</span>
            <input
              className="admin-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              data-testid={`${testid}-url`}
              placeholder="https://…"
            />
          </label>
          <div className="mt-6 flex items-center gap-3">
            <label className="admin-btn ghost cursor-pointer">
              Upload from device
              <input
                type="file"
                accept="image/*"
                onChange={onFile}
                style={{ display: "none" }}
                data-testid={`${testid}-file`}
              />
            </label>
            {value && (
              <button onClick={() => onChange("")} className="admin-btn danger">Clear</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
