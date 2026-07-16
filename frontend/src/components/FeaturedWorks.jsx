import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Rise } from "./Rise";

export default function FeaturedWorks() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const featured = projects.filter((p) => p.featured).slice(0, 4);
  const list = featured.length ? featured : projects.slice(0, 4);

  return (
    <section
      id="featured"
      data-testid="featured-works-section"
      className="relative bg-[var(--bg-0)] py-24 md:py-32"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <Rise>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-[1px] bg-[var(--gold)]" />
                <span className="overline">Selected Works</span>
              </div>
              <h2 className="font-serif text-[clamp(2.4rem,6vw,5.5rem)] tracking-[-0.02em] leading-[0.95] max-w-[900px]">
                A ledger of <span className="italic text-[var(--gold)]">rooms, ruins</span><br /> and returns.
              </h2>
            </div>
          </Rise>
          <Rise delay={120}>
            <Link to="/works" data-testid="view-all-works" className="btn-pill">
              View Full Portfolio
            </Link>
          </Rise>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {list.map((p, i) => (
            <Rise
              key={p.id}
              delay={i * 90}
              className={
                // Editorial staggered bento
                i === 0 ? "md:col-span-7 md:row-span-2" :
                i === 1 ? "md:col-span-5 md:mt-24" :
                i === 2 ? "md:col-span-5" :
                          "md:col-span-7 md:mt-[-40px]"
              }
            >
              <ProjectCard project={p} large={i === 0} />
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectCard({ project, large = false }) {
  return (
    <Link
      to={`/works/${project.id}`}
      data-testid={`project-card-${project.id}`}
      className="proj-card block group"
    >
      <div className={large ? "aspect-[4/5] md:aspect-[5/6]" : "aspect-[4/5]"}>
        <img
          src={project.cover_image}
          alt={project.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-7 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] tracking-[0.28em] uppercase text-[var(--gold-hi)] mb-2 font-medium">
            {project.category === "interiors" ? "Interiors" : "Restoration"} · {project.subcategory}
          </div>
          <h3 className="font-serif text-[22px] md:text-[30px] leading-none tracking-tight text-white">
            {project.title}
          </h3>
          <div className="text-[12px] text-white/70 mt-2">
            {project.location}{project.location && project.year ? " · " : ""}{project.year}
          </div>
        </div>
        <span className="hidden md:inline-block w-9 h-9 rounded-full border border-white/40 text-white text-center leading-[34px] group-hover:border-[var(--gold-hi)] group-hover:bg-[var(--gold-hi)] transition-colors">↗</span>
      </div>
    </Link>
  );
}
