import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

const EMPTY = { title: "", description: "", url: "", poster: "", featured_home: false };

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/videos").then((r) => setVideos(r.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(EMPTY); setEditing("new"); };
  const startEdit = (v) => { setForm({ ...EMPTY, ...v }); setEditing(v.id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const upload = async (e, field) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = `${process.env.REACT_APP_BACKEND_URL}${r.data.url}`;
      setForm((prev) => ({ ...prev, [field]: url }));
      toast.success("Uploaded — click Save to persist.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed.");
    }
    e.target.value = "";
  };

  const save = async () => {
    if (!form.url) return toast.error("Please provide or upload a video file / URL.");
    try {
      if (editing === "new") await api.post("/admin/videos", form);
      else                   await api.put(`/admin/videos/${editing}`, form);
      toast.success("Saved.");
      cancel(); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed."); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    try { await api.delete(`/admin/videos/${id}`); toast.success("Deleted."); load(); }
    catch { toast.error("Delete failed."); }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-[32px]">Videos <span className="text-[#F5EEE0]/50 text-[16px]">({videos.length})</span></h2>
        <button data-testid="admin-new-video" onClick={startNew} className="admin-btn">+ Add Video</button>
      </div>

      {editing && (
        <div className="admin-card p-6 md:p-8 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-[22px]">{editing === "new" ? "New Video" : "Edit Video"}</h3>
            <button onClick={cancel} className="admin-btn ghost">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="block md:col-span-2">
              <span className="overline text-[10px] block mb-2">Video URL *</span>
              <input className="admin-input" value={form.url} onChange={(e)=>setForm({...form,url:e.target.value})} placeholder="https://… or /api/uploads/…"/>
              <div className="mt-3">
                <label className="admin-btn ghost cursor-pointer inline-block">
                  Upload Video File
                  <input type="file" accept="video/*" style={{display:"none"}} onChange={(e)=>upload(e,"url")} data-testid="admin-video-upload"/>
                </label>
              </div>
            </label>
            <label className="block md:col-span-2">
              <span className="overline text-[10px] block mb-2">Poster / Thumbnail (optional)</span>
              <input className="admin-input" value={form.poster} onChange={(e)=>setForm({...form,poster:e.target.value})} placeholder="https://…"/>
              <div className="mt-3">
                <label className="admin-btn ghost cursor-pointer inline-block">
                  Upload Poster Image
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>upload(e,"poster")}/>
                </label>
              </div>
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
              <input type="checkbox" checked={!!form.featured_home} onChange={(e)=>setForm({...form,featured_home:e.target.checked})}/>
              Feature on Home Page
            </label>
          </div>
          <div className="mt-6"><button onClick={save} className="admin-btn" data-testid="admin-save-video">Save</button></div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center overline">Loading…</div>
      ) : videos.length === 0 ? (
        <div className="py-12 text-center text-[#F5EEE0]/60">No videos yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((v) => (
            <div key={v.id} className="admin-card p-3">
              <div className="aspect-video overflow-hidden bg-[#241D16] mb-3">
                {v.poster ? <img src={v.poster} alt="" className="w-full h-full object-cover"/> :
                  <video src={v.url.startsWith("http") ? v.url : `${process.env.REACT_APP_BACKEND_URL}${v.url}`} muted className="w-full h-full object-cover"/>}
              </div>
              {v.title && <div className="font-serif text-[15px] leading-tight mb-2">{v.title}</div>}
              <div className="flex gap-2 mt-2">
                <button onClick={()=>startEdit(v)} className="admin-btn ghost flex-1 text-[11px]">Edit</button>
                <button onClick={()=>remove(v.id)} className="admin-btn danger text-[11px]">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
