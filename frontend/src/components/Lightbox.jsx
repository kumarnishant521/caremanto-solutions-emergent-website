import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Share2, X as CloseIcon } from "lucide-react";
import { toast } from "sonner";
import { sharePhoto } from "../lib/share";
import { altFor } from "../lib/seo";

/**
 * Lightbox — carousel-enabled full-screen viewer used by /works and
 * /gallery.
 *
 * Props:
 *   photos     : Array<GalleryPhoto>  — the full list to swipe through
 *   index      : number               — currently visible photo index
 *   onIndex    : (i:number) => void   — parent-controlled index setter
 *   onClose    : () => void
 *   testIdPrefix : "portfolio" | "gallery"  (drives data-testid names for
 *                  regression tests: `${prefix}-lightbox`, etc.)
 *
 * Behaviours:
 *   • Floating prev / next chevrons (Lucide) — minimal, hairline border.
 *   • Keyboard : ArrowLeft / ArrowRight / Escape.
 *   • Touch    : horizontal swipe (>60px threshold) navigates prev / next.
 *   • Share    : icon-only in the top toolbar (no "SHARE AS PIN" pill,
 *                no floating pin/arrow badge). Calls `sharePhoto()` — the
 *                copy-link / Web Share behaviour is unchanged.
 *   • Aspect / watermark rules preserved via `object-contain`.
 */
export default function Lightbox({ photos, index, onIndex, onClose, testIdPrefix = "portfolio" }) {
  const open  = Number.isInteger(index) && photos && photos.length > 0;
  const total = photos ? photos.length : 0;
  const photo = open ? photos[index] : null;
  // Track the direction of the last navigation so AnimatePresence can slide
  // the image out to the opposite side. 1 = next, -1 = prev.
  const [direction, setDirection] = useState(0);

  const clamp = (i) => (i + total) % total;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const goPrev = useCallback(() => { if (total > 1) { setDirection(-1); onIndex(clamp(index - 1)); } }, [index, total, onIndex]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const goNext = useCallback(() => { if (total > 1) { setDirection( 1); onIndex(clamp(index + 1)); } }, [index, total, onIndex]);

  // Body scroll lock while the lightbox is mounted — the visitor's scroll
  // position never drifts and mobile browsers stop bouncing the page.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Keyboard navigation — attach/detach with the lightbox open state.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape")       onClose();
      else if (e.key === "ArrowLeft")  goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  // Touch swipe — pointer events cover both mouse-drag and finger gestures.
  const startRef = useRef({ x: 0, y: 0, active: false });
  const onPointerDown = (e) => {
    if (!open) return;
    startRef.current = { x: e.clientX, y: e.clientY, active: true };
  };
  const onPointerUp = (e) => {
    if (!startRef.current.active) return;
    startRef.current.active = false;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    // Only respond to mostly-horizontal swipes so vertical scrolls aren't
    // hijacked (dy tolerance is a small multiple of dx).
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else        goPrev();
    }
  };

  // Preload the ±3 neighbouring images so arrow-navigation lands zero-lag
  // even with the black backdrop. Uses the browser's native decode cache.
  useEffect(() => {
    if (!open) return;
    const preload = (i) => {
      const p = photos[clamp(i)];
      if (!p || !p.image) return;
      const img = new Image();
      img.src = p.image;
    };
    for (let k = 1; k <= 3; k++) {
      preload(index - k);
      preload(index + k);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, photos]);

  const share = async (e) => {
    e.stopPropagation();
    if (!photo) return;
    const result = await sharePhoto(photo);
    if (result === "shared")            toast.success("Shared.");
    else if (result === "copied")       toast.success("Pin link copied — paste anywhere to share.");
    else if (result === "unsupported")  toast.error("Sharing not supported on this device.");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={`${testIdPrefix}-lightbox`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.15, 1] }}
          role="dialog"
          aria-modal="true"
          data-testid={`${testIdPrefix}-lightbox`}
          onClick={onClose}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {/* --- Top toolbar (share + close) — round pills, backdrop-blur --- */}
          <div
            className="absolute top-4 md:top-6 right-4 md:right-6 flex items-center gap-2 z-[2]"
            style={{ top: "max(1rem, env(safe-area-inset-top))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              type="button"
              onClick={share}
              whileTap={{ scale: 0.92 }}
              aria-label="Share"
              title="Share"
              data-testid={`${testIdPrefix}-lightbox-share`}
              className="w-11 h-11 rounded-full flex items-center justify-center border border-white/25 bg-white/5 backdrop-blur-md text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] hover:bg-white/10 transition-colors"
            >
              <Share2 size={16} strokeWidth={1.6} />
            </motion.button>
            <motion.button
              type="button"
              onClick={onClose}
              whileTap={{ scale: 0.92 }}
              aria-label="Close"
              data-testid={`${testIdPrefix}-lightbox-close`}
              className="w-11 h-11 rounded-full flex items-center justify-center border border-white/25 bg-white/5 backdrop-blur-md text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] hover:bg-white/10 transition-colors"
            >
              <CloseIcon size={16} strokeWidth={1.6} />
            </motion.button>
          </div>

          {/* --- Prev / Next floating arrows — round pills, backdrop-blur --- */}
          {total > 1 && (
            <>
              <motion.button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                whileTap={{ scale: 0.92 }}
                aria-label="Previous photo"
                data-testid={`${testIdPrefix}-lightbox-prev`}
                className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-[2] w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border border-white/25 text-white/95 hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={22} strokeWidth={1.4} />
              </motion.button>
              <motion.button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                whileTap={{ scale: 0.92 }}
                aria-label="Next photo"
                data-testid={`${testIdPrefix}-lightbox-next`}
                className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-[2] w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border border-white/25 text-white/95 hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={22} strokeWidth={1.4} />
              </motion.button>
            </>
          )}

          {/* --- Body (image + editorial caption) ---------------------- */}
          {photo && (
            <div
              className="max-w-[1200px] w-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <LightboxImage
                photo={photo}
                index={index}
                direction={direction}
                testIdPrefix={testIdPrefix}
              />
              <div className="mt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <div className="overline text-[var(--gold-hi)] mb-1">
                    {photo.category}{photo.subcategory ? ` · ${photo.subcategory}` : ""}
                  </div>
                  {photo.title && (
                    <div className="font-serif text-[22px] md:text-[32px] text-white leading-tight">
                      {photo.title}
                    </div>
                  )}
                  {photo.description && (
                    <div className="text-[13px] md:text-[14px] text-white/70 mt-1 max-w-xl">
                      {photo.description}
                    </div>
                  )}
                </div>
                {total > 1 && (
                  <div
                    data-testid={`${testIdPrefix}-lightbox-counter`}
                    className="font-mono-alt text-[11px] tracking-[0.28em] uppercase text-white/70 self-start md:self-end"
                  >
                    {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * LightboxImage — directional slide + per-image blur-up skeleton.
 *
 * AnimatePresence with a directional `x` variant creates a continuous
 * left/right slide when arrows/swipe/keys fire. Custom slide distance is
 * bounded so tall portraits don't fly off-screen on huge monitors.
 * Zero-crop rule preserved via `object-contain` + `max-h-[85vh]`.
 */
const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir === 0 ? 0 : dir > 0 ? 60 : -60 }),
  center:        { opacity: 1, x: 0 },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

function LightboxImage({ photo, index, direction, testIdPrefix }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); }, [photo.id, photo.image]);

  return (
    <div className="relative w-full min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[50vh] md:h-[60vh] max-h-[85vh] portfolio-card-skeleton"
          style={{ maxWidth: "100%" }}
        />
      )}
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.img
          key={photo.id || photo.image}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x:       { type: "spring", stiffness: 340, damping: 34, mass: 0.9 },
            opacity: { duration: 0.22, ease: [0.2, 0.7, 0.15, 1] },
          }}
          src={photo.image}
          alt={photo.alt_text || altFor(photo, index)}
          data-testid={`${testIdPrefix}-lightbox-img`}
          draggable={false}
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
          className="relative z-[1] w-auto max-w-full max-h-[85vh] object-contain select-none"
        />
      </AnimatePresence>
    </div>
  );
}
