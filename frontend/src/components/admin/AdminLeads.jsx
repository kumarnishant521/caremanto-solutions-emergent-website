import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

const STATUSES = ["new", "contacted", "won", "archived"];

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setLoading(true);
    api.get("/admin/leads").then((r) => setLeads(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/admin/leads/${id}`, null, { params: { status } });
      toast.success("Status updated.");
      load();
    } catch { toast.error("Failed to update status."); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await api.delete(`/admin/leads/${id}`);
      toast.success("Deleted.");
      setSelected(null);
      load();
    } catch { toast.error("Delete failed."); }
  };

  const filtered = statusFilter === "all" ? leads : leads.filter((l) => l.status === statusFilter);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-[32px]">Leads <span className="text-[var(--muted)] text-[16px]">({leads.length})</span></h2>
        <div className="flex items-center gap-2">
          <label className="overline text-[10px] text-[var(--muted)]">Filter</label>
          <select className="admin-input w-[160px]" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center overline text-[var(--muted)]">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted)]">No leads.</div>
      ) : (
        <div className="admin-card">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[var(--muted)] overline text-[10px]">
                <th className="p-4">Received</th>
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Project</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-white/10 hover:bg-[var(--bg-2)]/50 cursor-pointer"
                    onClick={() => setSelected(l)} data-testid={`admin-lead-${l.id}`}>
                  <td className="p-4 whitespace-nowrap text-[var(--muted)]">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-4 font-serif text-[16px]">{l.name}</td>
                  <td className="p-4">{l.email}<br/><span className="text-[var(--muted)] text-[11px]">{l.phone || "—"}</span></td>
                  <td className="p-4">{l.project_type}</td>
                  <td className="p-4">
                    <select
                      className="admin-input py-1 px-2 text-[12px]"
                      value={l.status}
                      onClick={(e)=>e.stopPropagation()}
                      onChange={(e)=>setStatus(l.id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={(e)=>{ e.stopPropagation(); remove(l.id); }} className="admin-btn danger text-[11px]">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-0)]/90 backdrop-blur flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <div className="admin-card p-8 max-w-xl w-full" onClick={(e)=>e.stopPropagation()}>
            <div className="overline text-[var(--gold)] mb-2">Lead · {new Date(selected.created_at).toLocaleString()}</div>
            <h3 className="font-serif text-[28px] leading-none mb-6">{selected.name}</h3>
            <Row label="Email" value={selected.email}/>
            <Row label="Phone" value={selected.phone || "—"}/>
            <Row label="Project Type" value={selected.project_type}/>
            <Row label="Budget" value={selected.budget || "—"}/>
            <div className="mt-4">
              <div className="overline text-[10px] text-[var(--muted)] mb-2">Message</div>
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            </div>
            <div className="mt-8 flex gap-3 justify-end">
              <a href={`mailto:${selected.email}`} className="admin-btn">Reply via Email</a>
              <button onClick={()=>setSelected(null)} className="admin-btn ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-white/5">
      <div className="overline text-[10px] text-[var(--muted)]">{label}</div>
      <div className="col-span-2 text-[14px]">{value}</div>
    </div>
  );
}
