import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { motion, useScroll, useTransform } from "framer-motion";
import { Rise } from "../components/Rise";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const { scrollY } = useScroll();
  const parY = useTransform(scrollY, [0, 800], [0, 160]);

  useEffect(() => {
    api.get(`/projects/${id}`).then((r) => setProject(r.data)).catch(() => setNotFound(true));
    api.get("/projects").then((r) => setNeighbors(r.data));
  }, [id]);

  const related = useMemo(() => {
    if (!project) return [];
    return neighbors.filter((n) => n.id !== project.id && n.category === project.category).slice(0, 3);
  }, [neighbors, project]);

  if (notFound) {
    return (
      <main className="pt-32 pb-32 min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="overline mb-4">404</div>
          <h1 className="font-serif text-4xl mb-6">Project not found</h1>
          <Link to="/works" className="btn-pill">Back to Portfolio</Link>
        </div>
      </main>
    );
  }

  if (!project) {
    return <main className="pt-40 min-h-[70vh]"><div className="max-w-[1200px] mx-auto px-6 animate-pulse"><div className="h-8 w-32 bg-[var(--bg-1)] mb-6" /><div className="aspect-[16/9] bg-[var(--bg-1)]" /></div></main>;
  }

  return (
    <main data-testid="project-detail" className="bg-[var(--bg-0)]">
      {/* Hero */}
      <section className="relative h-[80vh] min-h-[560px] overflow-hidden">
        <motion.div style={{ y: parY }} className="absolute inset-0 will-change-transform">
          <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-0)] via-[var(--bg-0)]/40 to-transparent" />
        <div className="absolute inset-0 flex items-end pb-16 md:pb-20">
          <div className="max-w-[1440px] mx-auto w-full px-6 md:px-14">
            <div className="overline text-[var(--gold)] mb-6">
              {project.category === "interiors" ? "Interiors" : "Restoration & Renovation"} · {project.subcategory}
            </div>
            <h1 className="font-serif text-[clamp(2.6rem,7vw,6rem)] leading-[0.92] tracking-[-0.02em] max-w-4xl">
              {project.title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-8 text-[13px] text-[var(--ink)]/80">
              {project.location && (<div><div className="overline text-[10px] text-[var(--muted)]">Location</div><div className="mt-1">{project.location}</div></div>)}
              {project.year && (<div><div className="overline text-[10px] text-[var(--muted)]">Year</div><div className="mt-1">{project.year}</div></div>)}
              <div><div className="overline text-[10px] text-[var(--muted)]">Discipline</div><div className="mt-1">{project.subcategory}</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      {project.story && (
        <section className="py-24 md:py-32">
          <div className="max-w-[1200px] mx-auto px-6 md:px-14 grid grid-cols-1 md:grid-cols-12 gap-10">
            <Rise className="md:col-span-3">
              <div className="overline">Studio Notes</div>
            </Rise>
            <Rise className="md:col-span-8 md:col-start-5">
              <p className="font-serif text-[clamp(1.4rem,2.4vw,2rem)] italic leading-[1.35] text-[var(--ink)]/90">
                {project.story}
              </p>
            </Rise>
          </div>
        </section>
      )}

      {/* Gallery */}
      {project.images?.length > 0 && (
        <section className="pb-24 md:pb-32">
          <div className="max-w-[1440px] mx-auto px-6 md:px-14 grid grid-cols-1 md:grid-cols-12 gap-6">
            {project.images.map((img, i) => (
              <Rise key={i} className={i % 3 === 0 ? "md:col-span-8" : "md:col-span-4"}>
                <div className="overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </Rise>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="pb-24 md:pb-32 border-t border-white/10 pt-20">
          <div className="max-w-[1440px] mx-auto px-6 md:px-14">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] tracking-tight">Related Projects</h2>
              <Link to="/works" className="btn-pill">All Works</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {related.map((p) => (
                <Link key={p.id} to={`/works/${p.id}`} className="proj-card block group">
                  <div className="aspect-[4/5]">
                    <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 z-10">
                    <div className="overline text-[10px] text-[var(--gold)] mb-1">{p.subcategory}</div>
                    <div className="font-serif text-[22px]">{p.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
