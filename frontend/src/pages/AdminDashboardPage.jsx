import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api, NAV_CATEGORIES } from "../lib/api";
import { toast } from "sonner";

const TABS = [
  { key: "projects", label: "Projects" },
  { key: "gallery",  label: "Gallery"  },
  { key: "leads",    label: "Leads"    },
  { key: "taxonomy", label: "Settings" },
];

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("projects");
  const nav = useNavigate();

  if (loading) return <div className="min-h-screen bg-[var(--bg-0)]" />;
  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <main data-testid="admin-dashboard" className="admin-shell min-h-screen">
      <header className="border-b border-white/10 sticky top-0 z-30 bg-[var(--bg-0)]/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-serif text-xl">Caremanto</Link>
            <span className="overline text-[10px] text-[var(--muted)]">Admin Console</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="admin-btn ghost">View Site</Link>
            <button
              data-testid="admin-logout"
              onClick={async () => { await logout(); nav("/admin/login"); }}
              className="admin-btn ghost"
            >
              Sign out
            </button>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`admin-tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-[12px] tracking-[0.14em] uppercase border-b-2 transition-colors ${
                tab === t.key ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--ink)]/70 hover:text-[var(--ink)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <section className="max-w-[1400px] mx-auto px-6 py-10">
        {tab === "projects" && <ProjectsTab />}
        {tab === "gallery"  && <GalleryTab  />}
        {tab === "leads"    && <LeadsTab    />}
        {tab === "taxonomy" && <TaxonomyTab />}
      </section>
    </main>
  );
}

/* ------------------- Projects Tab ------------------- */
function emptyProject() {
  return {
    title: "", category: "interiors", subcategory: NAV_CATEGORIES.interiors.items[0],
    location: "", year: "", story: "", cover_image: "", images: [], featured: false, is_sample: false,
  };
}

function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null); // project or null
  const [creating, setCreating] = useState(false);

  const load = () => api.get("/projects").then((r) => setProjects(r.data));
  useEffect(() => { load(); }, []);

  const save = async (p) => {
    try {
      if (p.id) {
        const { id, created_at, updated_at, ...body } = p;
        await api.put(`/admin/projects/${id}`, body);
        toast.success("Project updated");
      } else {
        await api.post("/admin/projects", p);
        toast.success("Project created");
      }
      setEditing(null); setCreating(false); load();
    } catch (e) { toast.error("Save failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      toast.success("Deleted");
      load();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-3xl leading-none">Projects</h2>
          <div className="overline text-[10px] text-[var(--muted)] mt-2">{projects.length} total</div>
        </div>
        <button data-testid="admin-new-project" onClick={() => { setCreating(true); setEditing(emptyProject()); }} className="admin-btn">
          + New Project
        </button>
      </div>

      <div className="admin-card">
        <table className="w-full text-[13px]">
          <thead className="text-left">
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              <th className="p-3 w-14"></th>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Sub-category</th>
              <th className="p-3">Location</th>
              <th className="p-3">Year</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3"><img src={p.cover_image} alt="" className="w-10 h-10 object-cover"/></td>
                <td className="p-3 font-serif text-[16px]">{p.title} {p.is_sample && <span className="text-[10px] ml-2 px-2 py-0.5 border border-white/15 text-[var(--muted)]">SAMPLE</span>}</td>
                <td className="p-3 capitalize">{p.category}</td>
                <td className="p-3">{p.subcategory}</td>
                <td className="p-3">{p.location}</td>
                <td className="p-3">{p.year}</td>
                <td className="p-3 text-right">
                  <button data-testid={`admin-edit-project-${p.id}`} onClick={() => setEditing(p)} className="admin-btn ghost mr-2">Edit</button>
                  <button data-testid={`admin-delete-project-${p.id}`} onClick={() => remove(p.id)} className="admin-btn danger">Delete</button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-[var(--muted)]">No projects</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProjectEditor
          initial={editing}
          isCreate={creating}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={save}
        />
      )}
    </div>
  );
}

function ProjectEditor({ initial, isCreate, onCancel, onSave }) {
  const [p, setP] = useState(initial);
  const subs = NAV_CATEGORIES[p.category]?.items || [];
  const set = (k, v) => setP({ ...p, [k]: v });

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="admin-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="font-serif text-2xl">{isCreate ? "New Project" : "Edit Project"}</div>
          <button onClick={onCancel} className="admin-btn ghost">Cancel</button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <L label="Title"><input className="admin-input" value={p.title} onChange={(e) => set("title", e.target.value)} data-testid="editor-title"/></L>
          <L label="Cover Image URL"><input className="admin-input" value={p.cover_image} onChange={(e) => set("cover_image", e.target.value)} data-testid="editor-cover"/></L>
          <L label="Category">
            <select className="admin-input" value={p.category} onChange={(e) => set("category", e.target.value)}>
              <option value="interiors" className="bg-[var(--bg-1)]">Interiors</option>
              <option value="restoration" className="bg-[var(--bg-1)]">Restoration &amp; Renovation</option>
            </select>
          </L>
          <L label="Sub-category">
            <select className="admin-input" value={p.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
              {subs.map((s) => <option key={s} value={s} className="bg-[var(--bg-1)]">{s}</option>)}
            </select>
          </L>
          <L label="Location"><input className="admin-input" value={p.location} onChange={(e) => set("location", e.target.value)}/></L>
          <L label="Year"><input className="admin-input" value={p.year} onChange={(e) => set("year", e.target.value)}/></L>
          <L label="Story" full><textarea rows={3} className="admin-input" value={p.story} onChange={(e) => set("story", e.target.value)}/></L>
          <L label="Additional Images (one URL per line)" full>
            <textarea
              rows={4} className="admin-input"
              value={(p.images || []).join("\n")}
              onChange={(e) => set("images", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
            />
          </L>
          <label className="flex items-center gap-3 text-[13px]">
            <input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)}/>
            Featured on home
          </label>
          <label className="flex items-center gap-3 text-[13px]">
            <input type="checkbox" checked={p.is_sample} onChange={(e) => set("is_sample", e.target.checked)}/>
            Marked as sample
          </label>
        </div>
        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="admin-btn ghost">Cancel</button>
          <button data-testid="editor-save" onClick={() => onSave(p)} className="admin-btn">Save</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children, full }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="overline text-[10px] text-[var(--muted)] block mb-2">{label}</span>
      {children}
    </label>
  );
}

/* ------------------- Gallery Tab ------------------- */
function GalleryTab() {
  const [photos, setPhotos] = useState([]);
  const [taxonomy, setTaxonomy] = useState({ spaces: [], segments: [] });
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    api.get("/gallery").then((r) => setPhotos(r.data));
    api.get("/gallery/taxonomy").then((r) => setTaxonomy(r.data));
  };
  useEffect(() => { load(); }, []);

  const save = async (ph) => {
    try {
      if (ph.id) {
        const { id, created_at, ...body } = ph;
        await api.put(`/admin/gallery/${id}`, body);
        toast.success("Photo updated");
      } else {
        await api.post("/admin/gallery", ph);
        toast.success("Photo added");
      }
      setEditing(null); setCreating(false); load();
    } catch { toast.error("Save failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this photo?")) return;
    try { await api.delete(`/admin/gallery/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const emptyPhoto = () => ({
    title: "", description: "",
    space: taxonomy.spaces[0] || "Bathroom",
    segment: taxonomy.segments[0] || "Furniture",
    image: "", is_sample: false,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-3xl leading-none">Gallery</h2>
          <div className="overline text-[10px] text-[var(--muted)] mt-2">{photos.length} photos</div>
        </div>
        <button data-testid="admin-new-photo" onClick={() => { setCreating(true); setEditing(emptyPhoto()); }} className="admin-btn">+ New Photo</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {photos.map((ph) => (
          <div key={ph.id} className="admin-card overflow-hidden group">
            <div className="aspect-square"><img src={ph.image} className="w-full h-full object-cover"/></div>
            <div className="p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--gold)]">{ph.space} · {ph.segment}</div>
              {ph.title && <div className="font-serif text-[15px] mt-1">{ph.title}</div>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(ph)} className="admin-btn ghost text-[10px] px-2 py-1">Edit</button>
                <button onClick={() => remove(ph.id)} className="admin-btn danger text-[10px] px-2 py-1">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && <div className="col-span-full admin-card p-10 text-center text-[var(--muted)]">No photos</div>}
      </div>

      {editing && (
        <PhotoEditor initial={editing} taxonomy={taxonomy} isCreate={creating}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={save}
        />
      )}
    </div>
  );
}

function PhotoEditor({ initial, taxonomy, isCreate, onCancel, onSave }) {
  const [ph, setPh] = useState(initial);
  const set = (k, v) => setPh({ ...ph, [k]: v });
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="admin-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="font-serif text-2xl">{isCreate ? "New Photo" : "Edit Photo"}</div>
          <button onClick={onCancel} className="admin-btn ghost">Cancel</button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <L label="Image URL" full><input className="admin-input" value={ph.image} onChange={(e) => set("image", e.target.value)} data-testid="photo-image"/></L>
          <L label="Title"><input className="admin-input" value={ph.title} onChange={(e) => set("title", e.target.value)}/></L>
          <L label="Description"><input className="admin-input" value={ph.description} onChange={(e) => set("description", e.target.value)}/></L>
          <L label="Space">
            <select className="admin-input" value={ph.space} onChange={(e) => set("space", e.target.value)}>
              {taxonomy.spaces.map((s) => <option key={s} className="bg-[var(--bg-1)]">{s}</option>)}
            </select>
          </L>
          <L label="Work Segment">
            <select className="admin-input" value={ph.segment} onChange={(e) => set("segment", e.target.value)}>
              {taxonomy.segments.map((s) => <option key={s} className="bg-[var(--bg-1)]">{s}</option>)}
            </select>
          </L>
        </div>
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onCancel} className="admin-btn ghost">Cancel</button>
          <button data-testid="photo-save" onClick={() => onSave(ph)} className="admin-btn">Save</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------- Leads Tab ------------------- */
function LeadsTab() {
  const [leads, setLeads] = useState([]);
  const [active, setActive] = useState(null);
  const load = () => api.get("/admin/leads").then((r) => setLeads(r.data));
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try { await api.patch(`/admin/leads/${id}?status=${status}`); toast.success("Updated"); load(); }
    catch { toast.error("Failed"); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try { await api.delete(`/admin/leads/${id}`); toast.success("Deleted"); load(); setActive(null); }
    catch { toast.error("Failed"); }
  };

  return (
    <div>
      <h2 className="font-serif text-3xl leading-none mb-2">Consultation Leads</h2>
      <div className="overline text-[10px] text-[var(--muted)] mb-6">{leads.length} total</div>
      <div className="admin-card">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] text-left">
              <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Project</th>
              <th className="p-3">Status</th><th className="p-3">Received</th><th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => setActive(l)}>
                <td className="p-3 font-serif text-[15px]">{l.name}</td>
                <td className="p-3">{l.email}</td>
                <td className="p-3">{l.project_type}</td>
                <td className="p-3">
                  <span className={`text-[10px] uppercase tracking-[0.14em] ${
                    l.status === "new" ? "text-[var(--gold)]" : "text-[var(--muted)]"
                  }`}>{l.status}</span>
                </td>
                <td className="p-3 text-[var(--muted)]">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); remove(l.id); }} className="admin-btn danger">Delete</button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-[var(--muted)]">No leads yet</td></tr>}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="admin-card w-full max-w-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="overline text-[10px] text-[var(--gold)] mb-2">Consultation Lead</div>
                <h3 className="font-serif text-3xl">{active.name}</h3>
              </div>
              <button onClick={() => setActive(null)} className="admin-btn ghost">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[13px] mb-6">
              <Info k="Email" v={active.email}/>
              <Info k="Phone" v={active.phone || "—"}/>
              <Info k="Project" v={active.project_type}/>
              <Info k="Budget" v={active.budget || "—"}/>
              <Info k="Received" v={new Date(active.created_at).toLocaleString()}/>
              <Info k="Status" v={active.status}/>
            </div>
            <div className="mb-6">
              <div className="overline text-[10px] text-[var(--muted)] mb-2">Message</div>
              <p className="text-[14px] leading-relaxed">{active.message}</p>
            </div>
            <div className="flex gap-3">
              {["new", "in-progress", "won", "closed"].map((s) => (
                <button key={s} onClick={() => setStatus(active.id, s)}
                  className={`admin-btn ${active.status === s ? "" : "ghost"} text-[11px]`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ k, v }) {
  return (
    <div>
      <div className="overline text-[10px] text-[var(--muted)]">{k}</div>
      <div className="mt-1">{v}</div>
    </div>
  );
}

/* ------------------- Taxonomy Tab ------------------- */
function TaxonomyTab() {
  const [tax, setTax] = useState({ spaces: [], segments: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/gallery/taxonomy").then((r) => setTax(r.data)); }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put("/admin/gallery/taxonomy", tax); toast.success("Saved"); }
    catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const addTo = (k) => setTax({ ...tax, [k]: [...tax[k], ""] });
  const setAt = (k, i, v) => { const arr = [...tax[k]]; arr[i] = v; setTax({ ...tax, [k]: arr }); };
  const remAt = (k, i) => { const arr = tax[k].filter((_, idx) => idx !== i); setTax({ ...tax, [k]: arr }); };

  return (
    <div>
      <h2 className="font-serif text-3xl leading-none mb-2">Gallery Taxonomy</h2>
      <div className="overline text-[10px] text-[var(--muted)] mb-8">
        Configure the space and work-segment tags customers can filter by.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaxList label="Spaces" items={tax.spaces} onAdd={() => addTo("spaces")} onSet={(i, v) => setAt("spaces", i, v)} onRem={(i) => remAt("spaces", i)}/>
        <TaxList label="Work Segments" items={tax.segments} onAdd={() => addTo("segments")} onSet={(i, v) => setAt("segments", i, v)} onRem={(i) => remAt("segments", i)}/>
      </div>

      <button data-testid="taxonomy-save" onClick={save} disabled={saving} className="admin-btn mt-8 disabled:opacity-50">
        {saving ? "Saving…" : "Save Taxonomy"}
      </button>
    </div>
  );
}

function TaxList({ label, items, onAdd, onSet, onRem }) {
  return (
    <div className="admin-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="overline text-[11px]">{label}</div>
        <button onClick={onAdd} className="admin-btn ghost text-[11px] px-3 py-1">+ Add</button>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input className="admin-input" value={it} onChange={(e) => onSet(i, e.target.value)}/>
            <button onClick={() => onRem(i)} className="admin-btn danger">✕</button>
          </div>
        ))}
        {items.length === 0 && <div className="text-[var(--muted)] text-[13px]">Empty</div>}
      </div>
    </div>
  );
}
