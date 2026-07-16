import { useEffect, useState } from "react";
import { api, NAV_CATEGORIES } from "../../lib/api";
import { toast } from "sonner";

const EMPTY = {
  title: "", category: "interiors", subcategory: "Residential",
  location: "", year: "", story: "", cover_image: "", images: [],
  featured: false, is_sample: false,
};

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null); // project id or 'new'
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/projects").then((r) => setProjects(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(EMPTY); setEditing("new"); };
  const startEdit = (p) => {
    setForm({ ...EMPTY, ...p });
    setEditing(p.id);
  };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const save = async () => {
    if (!form.title || !form.cover_image) return toast.error("Title and cover image are required.");
    const payload = {
      title: form.title, category: form.category, subcategory: form.subcategory,
      location: form.location || "", year: form.year || "", story: form.story || "",
      cover_image: form.cover_image, images: form.images || [],
      featured: !!form.featured, is_sample: !!form.is_sample,
    };
    try {
      if (editing === "new") {
        await api.post("/admin/projects", payload);
        toast.success("Project created.");
      } else {
        await api.put(`/admin/projects/${editing}`, payload);
        toast.success("Project updated.");
      }
      cancel(); load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      toast.success("Project deleted.");
      load();
    } catch { toast.error("Delete failed."); }
  };

  const subOptions =
    form.category === "interiors" ? NAV_CATEGORIES.interiors.items : NAV_CATEGORIES.restoration.items;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-[32px]">Projects <span className="text-[var(--muted)] text-[16px]">({projects.length})</span></h2>
        <button data-testid="admin-new-project" onClick={startNew} className="admin-btn">+ New Project</button>
      </div>

      {editing && (
        <div className="admin-card p-6 md:p-8 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-[24px]">{editing === "new" ? "New Project" : "Edit Project"}</h3>
            <button onClick={cancel} className="admin-btn ghost">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Title *"><input className="admin-input" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/></Field>
            <Field label="Category">
              <select className="admin-input" value={form.category} onChange={(e)=>{
                const cat = e.target.value;
                const subs = cat === "interiors" ? NAV_CATEGORIES.interiors.items : NAV_CATEGORIES.restoration.items;
                setForm({...form, category: cat, subcategory: subs[0]});
              }}>
                <option value="interiors">Interiors</option>
                <option value="restoration">Restoration & Renovation</option>
              </select>
            </Field>
            <Field label="Sub-practice">
              <select className="admin-input" value={form.subcategory} onChange={(e)=>setForm({...form,subcategory:e.target.value})}>
                {subOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Location"><input className="admin-input" value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})}/></Field>
            <Field label="Year"><input className="admin-input" value={form.year} onChange={(e)=>setForm({...form,year:e.target.value})}/></Field>
            <Field label="Cover Image URL *"><input className="admin-input" value={form.cover_image} onChange={(e)=>setForm({...form,cover_image:e.target.value})} placeholder="https://…"/></Field>
            <Field label="Additional Image URLs (one per line)" span>
              <textarea
                className="admin-input"
                rows={4}
                value={(form.images || []).join("\n")}
                onChange={(e)=>setForm({...form,images:e.target.value.split("\n").map(s=>s.trim()).filter(Boolean)})}
              />
            </Field>
            <Field label="Story / Description" span>
              <textarea className="admin-input" rows={4} value={form.story} onChange={(e)=>setForm({...form,story:e.target.value})}/>
            </Field>
            <label className="flex items-center gap-3 text-[13px]">
              <input type="checkbox" checked={!!form.featured} onChange={(e)=>setForm({...form,featured:e.target.checked})}/>
              Featured on Home
            </label>
            <label className="flex items-center gap-3 text-[13px]">
              <input type="checkbox" checked={!!form.is_sample} onChange={(e)=>setForm({...form,is_sample:e.target.checked})}/>
              Mark as sample / placeholder
            </label>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <button data-testid="admin-save-project" onClick={save} className="admin-btn">Save Project</button>
            <button onClick={cancel} className="admin-btn ghost">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center overline text-[var(--muted)]">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="admin-card p-4 flex flex-col" data-testid={`admin-project-${p.id}`}>
              <div className="aspect-[4/3] overflow-hidden mb-4 bg-[var(--bg-2)]">
                <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover"/>
              </div>
              <div className="overline text-[10px] text-[var(--gold)] mb-1">
                {p.category === "interiors" ? "Interiors" : "Restoration"} · {p.subcategory}
                {p.featured && <span className="ml-2 text-[var(--ink)]">★ Featured</span>}
                {p.is_sample && <span className="ml-2 text-[var(--muted)]">· sample</span>}
              </div>
              <div className="font-serif text-[20px] leading-tight mb-1">{p.title}</div>
              <div className="text-[12px] text-[var(--muted)] mb-4">{p.location}{p.location && p.year ? " · " : ""}{p.year}</div>
              <div className="mt-auto flex gap-2">
                <button onClick={() => startEdit(p)} className="admin-btn ghost flex-1">Edit</button>
                <button onClick={() => remove(p.id)} className="admin-btn danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({ label, children, span }) {
  return (
    <label className={`block ${span ? "md:col-span-2" : ""}`}>
      <span className="overline text-[10px] text-[var(--muted)] block mb-2">{label}</span>
      {children}
    </label>
  );
}
