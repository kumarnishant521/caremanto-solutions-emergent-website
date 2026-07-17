import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Rise } from "../components/Rise";

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/videos")
      .then((r) => setVideos(r.data || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const absUrl = (u) => (u.startsWith("http") ? u : `${process.env.REACT_APP_BACKEND_URL}${u}`);

  return (
    <main data-testid="videos-page" className="pt-[100px] bg-[var(--bg-0)] min-h-screen">
      <section className="max-w-[1500px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-14">
        <Rise>
          <div className="flex items-center gap-3 mb-8">
            <span className="w-10 h-[1px] bg-[var(--gold)]" />
            <span className="overline">Films · Motion</span>
          </div>
        </Rise>
        <Rise delay={80}>
          <h1 className="font-serif text-[clamp(3rem,9vw,8rem)] tracking-[-0.02em] leading-[0.88] max-w-[1100px] text-[var(--ink)]">
            Studio in <span className="italic text-[var(--gold)]">motion.</span>
          </h1>
        </Rise>
      </section>

      <section className="max-w-[1500px] mx-auto px-6 md:px-14 pb-32">
        {loading ? (
          <div className="py-24 text-center overline text-[var(--muted)]">Loading…</div>
        ) : videos.length === 0 ? (
          <div className="py-24 text-center text-[var(--muted)]">No films yet. Please check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {videos.map((v, i) => (
              <Rise key={v.id} delay={(i % 6) * 60}>
                <button
                  data-testid={`video-item-${i}`}
                  onClick={() => setActive(v)}
                  className="w-full text-left group"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-2)]">
                    {v.poster ? (
                      <img src={absUrl(v.poster)} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.04]"/>
                    ) : (
                      <video src={absUrl(v.url)} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-14 h-14 rounded-full border border-white/70 text-white flex items-center justify-center backdrop-blur-sm bg-black/20 group-hover:bg-[var(--gold)] group-hover:border-[var(--gold)] transition-colors">
                        ▶
                      </span>
                    </span>
                  </div>
                  {(v.title || v.description) && (
                    <div className="pt-3">
                      {v.title && <div className="font-serif text-[20px] text-[var(--ink)]">{v.title}</div>}
                      {v.description && <div className="text-[13px] text-[var(--muted)] mt-1">{v.description}</div>}
                    </div>
                  )}
                </button>
              </Rise>
            ))}
          </div>
        )}
      </section>

      {active && (
        <div
          role="dialog"
          data-testid="video-player"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setActive(null); }}
            className="absolute top-6 right-6 w-11 h-11 border border-white/40 text-white hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
          >×</button>
          <video
            src={absUrl(active.url)}
            poster={active.poster ? absUrl(active.poster) : undefined}
            controls autoPlay playsInline
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[85vh] w-auto h-auto"
          />
        </div>
      )}
    </main>
  );
}
