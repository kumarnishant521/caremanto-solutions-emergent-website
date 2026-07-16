import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

const EMPTY = { title: "", description: "", space: "", segment: "", image: "", is_sample: false };

export default function AdminGallery() {
  const [taxonomy, setTaxonomy] = useState({ spaces: [], segments: [] });
  const [taxDraft, setTaxDraft] = useState({ spaces: "", segments: "" });
  const [photos, setPhotos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [space, setSpace] = useState("");
  const [segment, setSegment] = useState("");
  const [loading, setLoading] = useState(true);
  const [bulkText, setBulkText] = useState("");

  const loadAll = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (space) q.set("space", space);
    if (segment) q.set("segment", segment);
    Promise.all([
      api.get("/gallery/taxonomy"),
      api.get(`/gallery${q.toString() ? `?${q}` : ""}`),
    ])
      .then(([tax, ph]) => {
        setTaxonomy(tax.data);
        setTaxDraft({ spaces: tax.data.spaces.join("\n"), segments: tax.data.segments.join("\n") });
        setPhotos(ph.data);
        if (!form.space && tax.data.spaces[0]) setForm((f) => ({ ...f, space: f.space || tax.data.spaces[0], segment: f.segment || tax.data.segments[0] }));
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [space, segment]);

  const startNew = () => {
    setForm({ ...EMPTY, space: taxonomy.spaces[0] || "", segment: taxonomy.segments[0] || "" });
    setEditing("new");
  };
  const startEdit = (p) => { setForm({ ...EMPTY, ...p }); setEditing(p.id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const save = async () => {
    if (!form.image || !form.space || !form.segment) return toast.error("Image URL, space & segment are required.");
    const payload = {
      title: form.title || "", description: form.description || "",
      space: form.space, segment: form.segment, image: form.image, is_sample: !!form.is_sample,
    };
    try {
      if (editing === "new") await api.post("/admin/gallery", payload);
      else await api.put(`/admin/gallery/${editing}`, payload);
      toast.success("Photograph saved.");
      cancel(); loadAll();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed."); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this photograph?")) return;
    try { await api.delete(`/admin/gallery/${id}`); toast.success("Deleted."); loadAll(); }
    catch { toast.error("Delete failed."); }
  };

  const saveTaxonomy = async () => {
    const payload = {
      spaces: taxDraft.spaces.split("\n").map(s => s.trim()).filter(Boolean),
      segments: taxDraft.segments.split("\n").map(s => s.trim()).filter(Boolean),
    };
    try {
      await api.put("/admin/gallery/taxonomy", payload);
      toast.success("Categories updated.");
      loadAll();
    } catch { toast.error("Save failed."); }
  };

  const bulkAdd = async () => {
    const lines = bulkText.split("\n").map(s => s.trim()).filter(Boolean);
    if (!lines.length) return toast.error("Paste image URLs (one per line).");
    if (!form.space || !form.segment) return toast.error("Set space & segment first.");
    try {
      for (const url of lines) {
        await api.post("/admin/gallery", {
          title: "", description: "", space: form.space, segment: form.segment, image: url, is_sample: false,
        });
      }
      toast.success(`${lines.length} photograph(s) added.`);
      setBulkText(""); loadAll();
    } catch { toast.error("Some uploads failed."); }
  };

  return (
    <section className="space-y-10">
      {/* Taxonomy manager */}
      <div className="admin-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-[26px]">Categories</h2>
          <button onClick={saveTaxonomy} className="admin-btn" data-testid="admin-save-taxonomy">Save Categories</button>
        </div>
        <p className="text-[12px] text-[var(--muted)] mb-6">
          Manage the "By Space" and "By Work" filter lists. One entry per line.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="block">
            <span className="overline text-[10px] text-[var(--muted)] block mb-2">Spaces</span>
            <textarea className="admin-input" rows={8} value={taxDraft.spaces} onChange={(e)=>setTaxDraft({...taxDraft, spaces:e.target.value})}/>
          </label>
          <label className="block">
            <span className="overline text-[10px] text-[var(--muted)] block mb-2">Work Segments</span>
            <textarea className="admin-input" rows={8} value={taxDraft.segments} onChange={(e)=>setTaxDraft({...taxDraft, segments:e.target.value})}/>
          </label>
        </div>
      </div>

      {/* Filter + list header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="overline text-[10px] text-[var(--muted)] block mb-1">Filter Space</span>
            <select className="admin-input" value={space} onChange={(e)=>setSpace(e.target.value)}>
              <option value="">All</option>
              {taxonomy.spaces.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="overline text-[10px] text-[var(--muted)] block mb-1">Filter Work</span>
            <select className="admin-input" value={segment} onChange={(e)=>setSegment(e.target.value)}>
              <option value="">All</option>
              {taxonomy.segments.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <button data-testid="admin-new-photo" onClick={startNew} className="admin-btn">+ Add Photograph</button>
      </div>

      {/* Edit / new form */}
      {editing && (
        <div className="admin-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-[22px]">{editing === "new" ? "New Photograph" : "Edit Photograph"}</h3>
            <button onClick={cancel} className="admin-btn ghost">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block md:col-span-2">
              <span className="overline text-[10px] text-[var(--muted)] block mb-2">Image URL *</span>
              <input className="admin-input" value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="https://…"/>
            </label>
            <label className="block">
              <span className="overline text-[10px] text-[var(--muted)] block mb-2">Space *</span>
              <select className="admin-input" value={form.space} onChange={(e)=>setForm({...form,space:e.target.value})}>
                <option value="">Select…</option>
                {taxonomy.spaces.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="overline text-[10px] text-[var(--muted)] block mb-2">Work Segment *</span>
              <select className="admin-input" value={form.segment} onChange={(e)=>setForm({...form,segment:e.target.value})}>
                <option value="">Select…</option>
                {taxonomy.segments.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="overline text-[10px] text-[var(--muted)] block mb-2">Title</span>
              <input className="admin-input" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
            </label>
            <label className="block">
              <span className="overline text-[10px] text-[var(--muted)] block mb-2">Description</span>
              <input className="admin-input" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/>
            </label>
            <label className="flex items-center gap-3 text-[13px] md:col-span-2 mt-1">
              <input type="checkbox" checked={!!form.is_sample} onChange={(e)=>setForm({...form,is_sample:e.target.checked})}/>
              Mark as sample / placeholder
            </label>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button data-testid="admin-save-photo" onClick={save} className="admin-btn">Save</button>
          </div>

          {editing === "new" && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="overline mb-3 text-[var(--gold)]">Bulk Add — under current Space + Segment</div>
              <textarea
                className="admin-input"
                rows={5}
                placeholder="Paste image URLs, one per line"
                value={bulkText}
                onChange={(e)=>setBulkText(e.target.value)}
              />
              <button onClick={bulkAdd} className="admin-btn mt-4" data-testid="admin-bulk-add">Bulk Add</button>
            </div>
          )}
        </div>
      )}

      {/* Photo grid */}
      {loading ? (
        <div className="py-12 text-center overline text-[var(--muted)]">Loading…</div>
      ) : photos.length === 0 ? (
        <div className="py-12 text-center text-[var(--muted)]">No photographs yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="admin-card p-3" data-testid={`admin-photo-${p.id}`}>
              <div className="aspect-square overflow-hidden bg-[var(--bg-2)] mb-3">
                <img src={p.image} alt={p.title || ""} className="w-full h-full object-cover"/>
              </div>
              <div className="overline text-[9px] text-[var(--gold)] mb-1">{p.space} · {p.segment}</div>
              {p.title && <div className="font-serif text-[16px] leading-tight mb-2">{p.title}</div>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => startEdit(p)} className="admin-btn ghost flex-1 text-[11px]">Edit</button>
                <button onClick={() => remove(p.id)} className="admin-btn danger text-[11px]">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
