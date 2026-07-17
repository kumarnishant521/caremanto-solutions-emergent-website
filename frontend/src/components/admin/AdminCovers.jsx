import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

export default function AdminCovers() {
  const [form, setForm] = useState({ interiors_cover: "", restoration_cover: "", hero_extra: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/covers");
      setForm({
        interiors_cover:   data.interiors_cover   || "",
        restoration_cover: data.restoration_cover || "",
        hero_extra:        (data.hero_extra || []).join("\n"),
      });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/covers", {
        interiors_cover:   form.interiors_cover.trim(),
        restoration_cover: form.restoration_cover.trim(),
        hero_extra:        form.hero_extra.split("\n").map(s=>s.trim()).filter(Boolean),
      });
      toast.success("Covers updated.");
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
      setForm({ ...form, [key]: url });
      toast.success("Uploaded — click Save Covers to publish.");
    } catch (err) {
      toast.error("Upload failed.");
    }
    e.target.value = "";
  };

  if (loading) return <div className="py-16 text-center overline">Loading…</div>;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[32px]">Section Covers</h2>
        <button data-testid="admin-save-covers" onClick={save} disabled={saving} className="admin-btn disabled:opacity-60">
          {saving ? "Saving…" : "Save Covers"}
        </button>
      </div>
      <p className="text-[13px] text-[#F5EEE0]/60 -mt-4 max-w-2xl">
        These images appear on the home page — one card each for the INTERIORS and
        RENOVATIONS / RESTORATIONS divisions. Update them by pasting a URL, or by
        uploading a file straight from your device.
      </p>

      {/* INTERIORS cover */}
      <CoverField
        label="INTERIORS Division · Cover Image"
        testid="cover-interiors"
        value={form.interiors_cover}
        onChange={(v)=>setForm({...form, interiors_cover: v})}
        onFile={uploadInto("interiors_cover")}
      />

      {/* RESTORATION cover */}
      <CoverField
        label="RENOVATIONS / RESTORATIONS Division · Cover Image"
        testid="cover-restoration"
        value={form.restoration_cover}
        onChange={(v)=>setForm({...form, restoration_cover: v})}
        onFile={uploadInto("restoration_cover")}
      />

      {/* Extra hero slides */}
      <div className="admin-card p-6 md:p-8">
        <div className="overline mb-3">Extra Hero Slides (optional)</div>
        <p className="text-[12px] text-[#F5EEE0]/55 mb-4 max-w-2xl">
          One image URL per line — these are appended to the hero slideshow on top of the base
          real-project images. Upload files in the Gallery tab first, copy their URLs, and
          paste them here.
        </p>
        <textarea
          className="admin-input"
          rows={5}
          data-testid="hero-extra-input"
          placeholder="https://…"
          value={form.hero_extra}
          onChange={(e)=>setForm({...form, hero_extra: e.target.value})}
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
              onChange={(e)=>onChange(e.target.value)}
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
              <button onClick={()=>onChange("")} className="admin-btn danger">Clear</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
