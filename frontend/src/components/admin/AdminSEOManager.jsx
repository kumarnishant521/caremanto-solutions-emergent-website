import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

/**
 * AdminSEOManager — full CMS control over:
 *
 *   1. SEO metadata per section (home / residential / commercial /
 *      restoration / portfolio / studio):
 *        • Title (browser tab / OG title)
 *        • Meta description
 *        • OG image URL
 *        • Keywords (add / remove chips)
 *
 *   2. Footer content:
 *        • Editorial taglines
 *        • Email · Phone · Address · WhatsApp
 *        • Social links (label + URL per row)
 *
 *   3. Top-nav labels + dropdown items:
 *        • Home / Portfolio / Interior Projects / Services / Process /
 *          About Us / Consult labels.
 *        • Interior Projects dropdown items.
 *        • Services dropdown items.
 *
 * Publish mode is "Instant" — the moment Save is pressed, the /api/seo
 * doc is updated and the SiteSettingsProvider is reloaded so every open
 * tab reflects the change on the next route render.
 */

const SECTIONS = [
  { key: "home",        label: "Home"        },
  { key: "residential", label: "Residential" },
  { key: "commercial",  label: "Commercial"  },
  { key: "restoration", label: "Restoration" },
  { key: "portfolio",   label: "Portfolio"   },
  { key: "studio",      label: "Studio"      },
];

const NAV_LABEL_FIELDS = [
  { key: "home",              label: "Home"              },
  { key: "portfolio",         label: "Portfolio"         },
  { key: "interior_projects", label: "Interior Projects" },
  { key: "services",          label: "Services"          },
  { key: "process",           label: "Process"           },
  { key: "about_us",          label: "About Us"          },
  { key: "consult",           label: "Consult (CTA)"     },
];

const FOOTER_FIELDS = [
  { key: "tagline_1",        label: "Tagline · Line 1",        placeholder: "Let's compose" },
  { key: "tagline_2",        label: "Tagline · Line 2 (italic)",placeholder: "something enduring." },
  { key: "email",            label: "Contact Email",           placeholder: "care@caremanto.in" },
  { key: "phone",            label: "Phone (Display)",         placeholder: "+91 95959 44417" },
  { key: "phone_dial",       label: "Phone (tel: link)",       placeholder: "+919595944417" },
  { key: "whatsapp_number",  label: "WhatsApp Number (no +)",  placeholder: "919595944417" },
  { key: "whatsapp_message", label: "WhatsApp Prefill Message",placeholder: "Hi Caremanto, I'd like to begin a conversation." },
  { key: "address_line1",    label: "Address · Line 1",        placeholder: "C-213, Eastern Business District," },
  { key: "address_line2",    label: "Address · Line 2",        placeholder: "Mumbai — 400 078" },
];

const emptyDoc = {
  sections: {},
  footer:   {},
  nav:      { labels: {}, interior_items: [], services_items: [] },
};

export default function AdminSEOManager() {
  const [doc, setDoc]         = useState(emptyDoc);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState("seo");            // "seo" | "footer" | "nav"
  const [activeSection, setActiveSection] = useState("home");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/seo");
      // Guard: normalize incomplete stored data.
      const val = r.data || {};
      setDoc({
        sections: val.sections || {},
        footer:   val.footer   || {},
        nav: {
          labels:         (val.nav && val.nav.labels) || {},
          interior_items: (val.nav && val.nav.interior_items) || [],
          services_items: (val.nav && val.nav.services_items) || [],
        },
      });
    } catch (e) {
      toast.error("Failed to load SEO settings.");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/seo", doc);
      toast.success("Settings published — visible instantly across the site.");
      // Invalidate the site-settings cache so the next page load reads fresh.
      try { localStorage.removeItem("caremanto:site-settings"); } catch {}
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed.");
    } finally { setSaving(false); }
  };

  /* --------- helpers to mutate the doc immutably ---------- */
  const patchSection = (sectionKey, patch) => {
    setDoc((d) => ({
      ...d,
      sections: {
        ...d.sections,
        [sectionKey]: { ...(d.sections[sectionKey] || {}), ...patch },
      },
    }));
  };
  const patchFooter = (patch) => setDoc((d) => ({ ...d, footer: { ...d.footer, ...patch } }));
  const patchNavLabels = (patch) => setDoc((d) => ({
    ...d,
    nav: { ...d.nav, labels: { ...d.nav.labels, ...patch } },
  }));

  if (loading) return <div className="py-16 text-center overline">Loading SEO settings…</div>;

  return (
    <section data-testid="admin-seo-manager" className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-[32px]">SEO · Footer · Navigation</h2>
          <p className="text-[12px] text-[#F5EEE0]/60 max-w-2xl mt-1">
            Full content-management control. Save publishes instantly — the
            entire public site reads these values on the next render.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          data-testid="admin-seo-save"
          className="admin-btn disabled:opacity-60"
        >
          {saving ? "Publishing…" : "Publish Changes"}
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-[#F5EEE0]/10 flex items-center gap-8">
        {[
          { k: "seo",    l: "SEO Keywords & Meta" },
          { k: "footer", l: "Footer Content"      },
          { k: "nav",    l: "Navigation Text"     },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            data-testid={`admin-seo-subtab-${t.k}`}
            className={`py-3 overline text-[11px] relative transition-colors ${
              tab === t.k ? "text-[var(--gold-hi)]" : "text-[#F5EEE0]/70 hover:text-[var(--gold-hi)]"
            }`}
          >
            {t.l}
            {tab === t.k && <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[var(--gold-hi)]"/>}
          </button>
        ))}
      </div>

      {tab === "seo" && (
        <SEOTab
          sections={doc.sections}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          patchSection={patchSection}
        />
      )}
      {tab === "footer" && (
        <FooterTab footer={doc.footer} patchFooter={patchFooter} setDoc={setDoc} doc={doc} />
      )}
      {tab === "nav" && (
        <NavTab
          nav={doc.nav}
          patchNavLabels={patchNavLabels}
          setDoc={setDoc}
        />
      )}
    </section>
  );
}

/* =====================================================================
 * SEO tab
 * ===================================================================== */
function SEOTab({ sections, activeSection, setActiveSection, patchSection }) {
  const current = sections[activeSection] || { title: "", description: "", og_image: "", keywords: [] };
  const [chip, setChip] = useState("");

  const addChip = () => {
    const v = chip.trim();
    if (!v) return;
    if ((current.keywords || []).includes(v)) { setChip(""); return; }
    patchSection(activeSection, { keywords: [...(current.keywords || []), v] });
    setChip("");
  };
  const removeChip = (kw) => {
    patchSection(activeSection, { keywords: (current.keywords || []).filter((k) => k !== kw) });
  };
  const bulkImport = (raw) => {
    const items = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    const merged = Array.from(new Set([...(current.keywords || []), ...items]));
    patchSection(activeSection, { keywords: merged });
  };

  return (
    <div className="space-y-6">
      {/* Section picker */}
      <div className="flex items-center flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            data-testid={`seo-section-${s.key}`}
            className={`admin-btn ghost text-[11px] ${
              activeSection === s.key ? "text-[var(--gold-hi)] border-[var(--gold-hi)]" : ""
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Meta form */}
      <div className="admin-card p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="block">
            <span className="overline text-[10px] block mb-2">Page Title</span>
            <input
              className="admin-input"
              data-testid={`seo-title-${activeSection}`}
              value={current.title || ""}
              onChange={(e) => patchSection(activeSection, { title: e.target.value })}
              placeholder="Luxury Interior Design Studio | CAREMANTO"
            />
            <span className="text-[10px] text-[#F5EEE0]/50 mt-1 block">
              Recommended 50–65 characters. Current: {(current.title || "").length}
            </span>
          </label>
          <label className="block">
            <span className="overline text-[10px] block mb-2">OG / Social Image URL</span>
            <input
              className="admin-input"
              data-testid={`seo-ogimage-${activeSection}`}
              value={current.og_image || ""}
              onChange={(e) => patchSection(activeSection, { og_image: e.target.value })}
              placeholder="https://…"
            />
            {current.og_image && (
              <img
                src={current.og_image}
                alt="OG preview"
                className="mt-3 w-48 h-24 object-cover border border-[#F5EEE0]/10"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
          </label>
        </div>

        <label className="block">
          <span className="overline text-[10px] block mb-2">Meta Description</span>
          <textarea
            rows={3}
            className="admin-input"
            data-testid={`seo-description-${activeSection}`}
            value={current.description || ""}
            onChange={(e) => patchSection(activeSection, { description: e.target.value })}
            placeholder="Two to three sentences describing what this page is about, targeted at search-engine snippets."
          />
          <span className="text-[10px] text-[#F5EEE0]/50 mt-1 block">
            Recommended 120–160 characters. Current: {(current.description || "").length}
          </span>
        </label>

        {/* Keyword chips */}
        <div>
          <div className="overline text-[10px] mb-2">Keywords ({(current.keywords || []).length})</div>
          <div
            data-testid={`seo-keywords-list-${activeSection}`}
            className="flex items-center flex-wrap gap-2 min-h-[48px] p-3 border border-[#F5EEE0]/10 bg-black/20"
          >
            {(current.keywords || []).length === 0 && (
              <span className="text-[11px] text-[#F5EEE0]/40">No keywords yet.</span>
            )}
            {(current.keywords || []).map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-2 px-3 py-1 text-[11px] bg-[#241D16] border border-[#F5EEE0]/15 text-[var(--gold-hi)]"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => removeChip(kw)}
                  data-testid={`seo-keyword-remove-${activeSection}-${kw.replace(/\s+/g, "_")}`}
                  className="text-[#F5EEE0]/50 hover:text-red-400 transition"
                  aria-label={`Remove ${kw}`}
                >×</button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              className="admin-input flex-1"
              value={chip}
              onChange={(e) => setChip(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(); } }}
              placeholder="Add a keyword and press Enter"
              data-testid={`seo-keyword-input-${activeSection}`}
            />
            <button
              type="button"
              onClick={addChip}
              className="admin-btn ghost"
              data-testid={`seo-keyword-add-${activeSection}`}
            >Add</button>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-[11px] text-[#F5EEE0]/60 hover:text-[var(--gold-hi)] transition">
              Bulk import (comma or newline separated)
            </summary>
            <BulkImport onImport={bulkImport} sectionKey={activeSection} />
          </details>
        </div>
      </div>
    </div>
  );
}

function BulkImport({ onImport, sectionKey }) {
  const [text, setText] = useState("");
  return (
    <div className="mt-3">
      <textarea
        rows={4}
        className="admin-input font-mono-alt text-[11px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Luxury interior designs, Modular kitchen design, Best boutique designer…"
        data-testid={`seo-bulk-input-${sectionKey}`}
      />
      <button
        type="button"
        className="admin-btn ghost mt-2 text-[11px]"
        data-testid={`seo-bulk-import-${sectionKey}`}
        onClick={() => { onImport(text); setText(""); }}
      >Import Keywords</button>
    </div>
  );
}

/* =====================================================================
 * Footer tab
 * ===================================================================== */
function FooterTab({ footer, patchFooter, setDoc, doc }) {
  const socials = Array.isArray(footer.socials) ? footer.socials : [];

  const setSocials = (next) => setDoc((d) => ({ ...d, footer: { ...d.footer, socials: next } }));
  const addSocial = () => setSocials([...socials, { key: "", label: "", href: "" }]);
  const patchSocial = (i, patch) => setSocials(socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeSocial = (i) => setSocials(socials.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <div className="admin-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {FOOTER_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="overline text-[10px] block mb-2">{f.label}</span>
            <input
              className="admin-input"
              value={footer[f.key] || ""}
              onChange={(e) => patchFooter({ [f.key]: e.target.value })}
              placeholder={f.placeholder}
              data-testid={`footer-field-${f.key}`}
            />
          </label>
        ))}
      </div>

      <div className="admin-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="overline">Social Links</div>
            <p className="text-[11px] text-[#F5EEE0]/60 mt-1">
              Add up to 12. Key must be one of: <code>instagram, linkedin, twitter, youtube</code> — anything else renders a generic globe icon.
            </p>
          </div>
          <button onClick={addSocial} className="admin-btn ghost text-[11px]" data-testid="footer-social-add">
            + Add Social
          </button>
        </div>

        <div className="space-y-3">
          {socials.length === 0 && (
            <div className="text-[11px] text-[#F5EEE0]/40 py-4 text-center">No social links yet.</div>
          )}
          {socials.map((s, i) => (
            <div key={i} className="grid grid-cols-[110px_1fr_2fr_auto] gap-3 items-center">
              <input
                className="admin-input"
                value={s.key || ""}
                onChange={(e) => patchSocial(i, { key: e.target.value })}
                placeholder="instagram"
                data-testid={`footer-social-${i}-key`}
              />
              <input
                className="admin-input"
                value={s.label || ""}
                onChange={(e) => patchSocial(i, { label: e.target.value })}
                placeholder="Instagram"
                data-testid={`footer-social-${i}-label`}
              />
              <input
                className="admin-input"
                value={s.href || ""}
                onChange={(e) => patchSocial(i, { href: e.target.value })}
                placeholder="https://…"
                data-testid={`footer-social-${i}-href`}
              />
              <button
                onClick={() => removeSocial(i)}
                className="admin-btn danger text-[11px]"
                data-testid={`footer-social-${i}-remove`}
              >Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
 * Nav tab
 * ===================================================================== */
function NavTab({ nav, patchNavLabels, setDoc }) {
  const labels = nav.labels || {};
  const interior = Array.isArray(nav.interior_items) ? nav.interior_items : [];
  const services = Array.isArray(nav.services_items) ? nav.services_items : [];

  const setItems = (key, next) => setDoc((d) => ({ ...d, nav: { ...d.nav, [key]: next } }));

  return (
    <div className="space-y-6">
      <div className="admin-card p-6 md:p-8">
        <div className="overline mb-4">Top Navigation Labels</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {NAV_LABEL_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[10px] tracking-[0.28em] uppercase text-[#F5EEE0]/60 block mb-2">{f.label}</span>
              <input
                className="admin-input"
                value={labels[f.key] || ""}
                onChange={(e) => patchNavLabels({ [f.key]: e.target.value })}
                placeholder={f.label}
                data-testid={`nav-label-${f.key}`}
              />
            </label>
          ))}
        </div>
      </div>

      <NavItemsList
        title="Interior Projects · Dropdown Items"
        items={interior}
        setItems={(next) => setItems("interior_items", next)}
        testidBase="nav-interior"
      />

      <NavItemsList
        title="Services · Dropdown Items"
        subtitle='Any item containing "Restoration" or "Renovation" routes to the restoration gallery. All others open the consultation modal pre-filled with that service name.'
        items={services}
        setItems={(next) => setItems("services_items", next)}
        testidBase="nav-services"
      />
    </div>
  );
}

function NavItemsList({ title, subtitle, items, setItems, testidBase }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (items.includes(v)) { setDraft(""); return; }
    setItems([...items, v]);
    setDraft("");
  };
  const remove = (i) => setItems(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const patch = (i, val) => setItems(items.map((it, idx) => (idx === i ? val : it)));

  return (
    <div className="admin-card p-6 md:p-8">
      <div className="overline">{title}</div>
      {subtitle && (
        <p className="text-[11px] text-[#F5EEE0]/60 mt-1 max-w-2xl">{subtitle}</p>
      )}
      <div className="mt-4 space-y-2">
        {items.length === 0 && (
          <div className="text-[11px] text-[#F5EEE0]/40 py-4 text-center">No items yet.</div>
        )}
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
            <input
              className="admin-input"
              value={it}
              onChange={(e) => patch(i, e.target.value)}
              data-testid={`${testidBase}-item-${i}`}
            />
            <button onClick={() => move(i, -1)} className="admin-btn ghost text-[11px]" data-testid={`${testidBase}-up-${i}`}>↑</button>
            <button onClick={() => move(i, +1)} className="admin-btn ghost text-[11px]" data-testid={`${testidBase}-down-${i}`}>↓</button>
            <button onClick={() => remove(i)} className="admin-btn danger text-[11px]" data-testid={`${testidBase}-remove-${i}`}>×</button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <input
          className="admin-input flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add a menu item"
          data-testid={`${testidBase}-add-input`}
        />
        <button onClick={add} className="admin-btn ghost" data-testid={`${testidBase}-add`}>Add</button>
      </div>
    </div>
  );
}
