import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, NAV_CATEGORIES } from "../lib/api";
import { ProjectCard } from "../components/FeaturedWorks";
import { Rise } from "../components/Rise";

export default function WorksPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "all";
  const sub = params.get("sub") || "all";

  useEffect(() => {
    setLoading(true);
    const q = category === "all" ? "" : `?category=${category}`;
    api.get(`/projects${q}`)
      .then((r) => setProjects(r.data))
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = sub === "all"
    ? projects
    : projects.filter((p) => p.subcategory === sub);

  const setCat = (c) => {
    const p = new URLSearchParams();
    if (c !== "all") p.set("category", c);
    setParams(p);
  };

  const setSub = (s) => {
    const p = new URLSearchParams(params);
    if (s === "all") p.delete("sub"); else p.set("sub", s);
    setParams(p);
  };

  const subOptions = category !== "all" ? NAV_CATEGORIES[category]?.items ?? [] : [];

  return (
    <main data-testid="works-page" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[var(--bg-0)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <Rise>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">The Portfolio</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] tracking-[-0.02em] leading-[0.9]">
            Our <span className="italic text-[var(--gold)]">Works</span>
          </h1>
        </Rise>
        <Rise delay={160}>
          <p className="mt-6 max-w-2xl text-[15px] md:text-[17px] text-[var(--ink)]/80 leading-relaxed">
            A curated ledger of interiors, restorations and renewals — filter by practice and sub-discipline.
          </p>
        </Rise>

        <div className="hairline mt-14 mb-8" />

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="overline text-[10px] text-[var(--muted)] mr-2">Practice ·</span>
            {[["all", "All"], ["interiors", "Interiors"], ["restoration", "Restoration & Renovation"]].map(([k, l]) => (
              <button
                key={k}
                data-testid={`filter-category-${k}`}
                onClick={() => setCat(k)}
                className={`px-4 py-2 border text-[12px] uppercase tracking-[0.14em] transition-colors ${
                  category === k
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-[var(--line-strong)] text-[var(--ink)]/80 hover:border-[var(--line-strong)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {subOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="overline text-[10px] text-[var(--muted)] mr-2">Sub ·</span>
              {["all", ...subOptions].map((s, i) => (
                <button
                  key={s}
                  data-testid={`filter-sub-${i}`}
                  onClick={() => setSub(s)}
                  className={`px-3 py-1.5 text-[12px] tracking-[0.06em] transition-colors ${
                    sub === s ? "text-[var(--gold)]" : "text-[var(--ink)]/70 hover:text-[var(--ink)]"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-[var(--bg-1)] animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-24 text-center text-[var(--muted)] font-serif italic text-2xl">
              No projects in this category yet.
            </div>
          ) : (
            filtered.map((p, i) => (
              <Rise key={p.id} delay={i * 60}>
                <ProjectCard project={p} />
              </Rise>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
