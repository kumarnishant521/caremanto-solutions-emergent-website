import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

const EMPTY = { title: "", description: "", category: "", subcategory: "", image: "", is_sample: false };

export default function AdminGallery() {
  const [taxonomy, setTaxonomy] = useState({ categories: [], subcategories: {} });
  const [taxDraft, setTaxDraft] = useState({ categories: "", subcategories: {} });
  const [photos, setPhotos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filterCat, setFilterCat] = useState("");
  const [filterSub, setFilterSub] = useState("");
  const [loading, setLoading] = useState(true);
  const [bulkText, setBulkText] = useState("");

  const loadAll = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (filterCat) q.set("category", filterCat);
    if (filterSub) q.set("subcategory", filterSub);
    Promise.all([
      api.get("/gallery/taxonomy"),
      api.get(`/gallery${q.toString() ? `?${q}` : ""}`),
    ])
      .then(([tax, ph]) => {
        setTaxonomy(tax.data);
        setTaxDraft({
          categories: (tax.data.categories || []).join("\n"),
          subcategories: Object.fromEntries(
            Object.entries(tax.data.subcategories || {}).map(([k, v]) => [k, (v || []).join("\n")])
          ),
        });
        setPhotos(ph.data);
      })
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, [filterCat, filterSub]);

  const startNew = () => {
    const firstCat = (taxonomy.categories || []).find((c) => c !== "Our Work") || "";
    const subs = (taxonomy.subcategories || {})[firstCat] || [];
    setForm({ ...EMPTY, category: firstCat, subcategory: subs[0] || "" });
    setEditing("new");
  };
  const startEdit = (p) => { setForm({ ...EMPTY, ...p }); setEditing(p.id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const currentSubOptions = useMemo(
    () => (taxonomy.subcategories && taxonomy.subcategories[form.category]) || [],
    [taxonomy, form.category]
  );

  const save = async () => {
    if (!form.image || !form.category) return toast.error("Image URL and Category are required.");
    if (currentSubOptions.length > 0 && !form.subcategory) return toast.error("Please select a sub-category.");
    const payload = {
      title: form.title || "", description: form.description || "",
      category: form.category, subcategory: form.subcategory || "",
      image: form.image, is_sample: !!form.is_sample,
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
    const categories = taxDraft.categories.split("\n").map(s => s.trim()).filter(Boolean);
    const subcategories = {};
    for (const [k, txt] of Object.entries(taxDraft.subcategories || {})) {
      if (categories.includes(k)) {
        subcategories[k] = txt.split("\n").map(s => s.trim()).filter(Boolean);
      }
    }
    try {
      await api.put("/admin/gallery/taxonomy", { categories, subcategories });
      toast.success("Categories updated.");
      loadAll();
    } catch { toast.error("Save failed."); }
  };

  const bulkAdd = async () => {
    const lines = bulkText.split("\n").map(s => s.trim()).filter(Boolean);
    if (!lines.length) return toast.error("Paste image URLs (one per line).");
    if (!form.category) return toast.error("Set category first.");
    if (currentSubOptions.length > 0 && !form.subcategory) return toast.error("Set sub-category first.");
    try {
      for (const url of lines) {
        await api.post("/admin/gallery", {
          title: "", description: "", category: form.category, subcategory: form.subcategory || "",
          image: url, is_sample: false,
        });
      }
      toast.success(`${lines.length} photograph(s) added.`);
      setBulkText(""); loadAll();
    } catch { toast.error("Some uploads failed."); }
  };

  const nestedCategories = (taxonomy.categories || []).filter(
    (c) => taxonomy.subcategories && taxonomy.subcategories[c]
  );

  return (
    <section className="space-y-10">
      {/* Taxonomy manager */}
      <div className="admin-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-[26px]">Categories</h2>
          <button onClick={saveTaxonomy} className="admin-btn" data-testid="admin-save-taxonomy">Save Categories</button>
        </div>
        <p className="text-[12px] text-[#F5EEE0]/60 mb-6">
          Manage the four main gallery tabs and their nested sub-filters. One entry per line.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <label className="block">
            <span className="overline text-[10px] block mb-2">Main Tabs</span>
            <textarea
              className="admin-input"
              rows={8}
              value={taxDraft.categories}
              onChange={(e)=>setTaxDraft({...taxDraft, categories: e.target.value})}
            />
          </label>
          {(taxDraft.categories.split("\n").map(s=>s.trim()).filter(Boolean).filter((c)=> c && c !== "Our Work" && c !== "Bespoke Custom Made Furniture")).map((c) => (
            <label key={c} className="block">
              <span className="overline text-[10px] block mb-2">Sub-filters · {c}</span>
              <textarea
                className="admin-input"
                rows={8}
                value={(taxDraft.subcategories || {})[c] || ""}
                onChange={(e)=>setTaxDraft({...taxDraft, subcategories: {...taxDraft.subcategories, [c]: e.target.value}})}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Filter + list header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="overline text-[10px] block mb-1">Filter Category</span>
            <select className="admin-input" value={filterCat} onChange={(e)=>{ setFilterCat(e.target.value); setFilterSub(""); }}>
              <option value="">All</option>
              {(taxonomy.categories || []).filter((c)=>c!=="Our Work").map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {filterCat && ((taxonomy.subcategories || {})[filterCat] || []).length > 0 && (
            <label className="block">
              <span className="overline text-[10px] block mb-1">Filter Sub</span>
              <select className="admin-input" value={filterSub} onChange={(e)=>setFilterSub(e.target.value)}>
                <option value="">All</option>
                {(taxonomy.subcategories[filterCat] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
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
              <span className="overline text-[10px] block mb-2">Image URL *</span>
              <input className="admin-input" value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="https://…"/>
            </label>
            <label className="block">
              <span className="overline text-[10px] block mb-2">Category *</span>
              <select
                className="admin-input"
                value={form.category}
                onChange={(e)=>{
                  const c = e.target.value;
                  const subs = (taxonomy.subcategories || {})[c] || [];
                  setForm({...form, category: c, subcategory: subs[0] || ""});
                }}
              >
                <option value="">Select…</option>
                {(taxonomy.categories || []).filter((c)=>c!=="Our Work").map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="overline text-[10px] block mb-2">
                Sub-category {currentSubOptions.length > 0 ? "*" : "(not applicable)"}
              </span>
              <select
                className="admin-input"
                value={form.subcategory}
                onChange={(e)=>setForm({...form,subcategory:e.target.value})}
                disabled={currentSubOptions.length === 0}
              >
                {currentSubOptions.length === 0
                  ? <option value="">—</option>
                  : (<>
                      <option value="">Select…</option>
                      {currentSubOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </>)
                }
              </select>
            </label>
            <label className="block">
              <span className="overline text-[10px] block mb-2">Title</span>
              <input className="admin-input" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
            </label>
            <label className="block">
              <span className="overline text-[10px] block mb-2">Description</span>
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
            <div className="mt-8 pt-6 border-t border-[#F5EEE0]/10 space-y-6">
              <div>
                <div className="overline mb-3">Upload from Device</div>
                <label
                  htmlFor="admin-gallery-file"
                  data-testid="admin-file-upload-label"
                  className="admin-btn ghost inline-block cursor-pointer"
                >
                  Choose Files (JPG · PNG · WEBP · max 12&nbsp;MB each)
                </label>
                <input
                  id="admin-gallery-file"
                  data-testid="admin-file-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    if (!form.category) { toast.error("Set category first."); return; }
                    if (currentSubOptions.length > 0 && !form.subcategory) { toast.error("Set sub-category first."); return; }
                    let ok = 0;
                    for (const f of files) {
                      try {
                        const fd = new FormData();
                        fd.append("file", f);
                        const r = await api.post("/admin/upload", fd, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        const url = `${process.env.REACT_APP_BACKEND_URL}${r.data.url}`;
                        await api.post("/admin/gallery", {
                          title: "", description: "",
                          category: form.category, subcategory: form.subcategory || "",
                          image: url, is_sample: false,
                        });
                        ok += 1;
                      } catch (err) {
                        toast.error(`${f.name}: ${err?.response?.data?.detail || "upload failed"}`);
                      }
                    }
                    if (ok) toast.success(`${ok} photograph(s) uploaded`);
                    e.target.value = "";
                    loadAll();
                  }}
                />
                <p className="text-[11px] text-[#F5EEE0]/50 mt-2">
                  Uploads go to the current Category + Sub selected above.
                </p>
              </div>

              <div>
                <div className="overline mb-3">Bulk Add by URL</div>
                <textarea
                  className="admin-input"
                  rows={4}
                  placeholder="Paste image URLs, one per line"
                  value={bulkText}
                  onChange={(e)=>setBulkText(e.target.value)}
                />
                <button onClick={bulkAdd} className="admin-btn mt-3" data-testid="admin-bulk-add">Bulk Add URLs</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo grid */}
      {loading ? (
        <div className="py-12 text-center overline">Loading…</div>
      ) : photos.length === 0 ? (
        <div className="py-12 text-center text-[#F5EEE0]/60">No photographs yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="admin-card p-3" data-testid={`admin-photo-${p.id}`}>
              <div className="aspect-square overflow-hidden bg-[#241D16] mb-3">
                <img src={p.image} alt={p.title || ""} className="w-full h-full object-cover"/>
              </div>
              <div className="overline text-[9px] mb-1">
                {p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}
              </div>
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
