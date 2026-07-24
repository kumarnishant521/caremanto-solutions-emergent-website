import { useCallback, useEffect, useRef } from "react";
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

  const clamp = (i) => (i + total) % total;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const goPrev = useCallback(() => { if (total > 1) onIndex(clamp(index - 1)); }, [index, total, onIndex]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const goNext = useCallback(() => { if (total > 1) onIndex(clamp(index + 1)); }, [index, total, onIndex]);

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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          data-testid={`${testIdPrefix}-lightbox`}
          onClick={onClose}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
        >
          {/* --- Top toolbar (share + close) --------------------------- */}
          <div
            className="absolute top-6 right-6 flex items-center gap-2 z-[2]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={share}
              aria-label="Share"
              title="Share"
              data-testid={`${testIdPrefix}-lightbox-share`}
              className="w-11 h-11 flex items-center justify-center border border-white/40 text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] transition-colors"
            >
              <Share2 size={16} strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              data-testid={`${testIdPrefix}-lightbox-close`}
              className="w-11 h-11 flex items-center justify-center border border-white/40 text-white hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] transition-colors"
            >
              <CloseIcon size={16} strokeWidth={1.6} />
            </button>
          </div>

          {/* --- Prev / Next floating arrows --------------------------- */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Previous photo"
                data-testid={`${testIdPrefix}-lightbox-prev`}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-[2] w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border border-white/30 text-white/90 hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] bg-black/20 backdrop-blur-sm transition-colors"
              >
                <ChevronLeft size={22} strokeWidth={1.4} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Next photo"
                data-testid={`${testIdPrefix}-lightbox-next`}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-[2] w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border border-white/30 text-white/90 hover:border-[var(--gold-hi)] hover:text-[var(--gold-hi)] bg-black/20 backdrop-blur-sm transition-colors"
              >
                <ChevronRight size={22} strokeWidth={1.4} />
              </button>
            </>
          )}

          {/* --- Body (image + editorial caption) ---------------------- */}
          {photo && (
            <div
              className="max-w-[1200px] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={photo.id || photo.image}
                initial={{ opacity: 0.3, scale: 0.995 }}
                animate={{ opacity: 1,   scale: 1     }}
                transition={{ duration: 0.35, ease: [0.2, 0.7, 0.15, 1] }}
                src={photo.image}
                alt={photo.alt_text || altFor(photo, index)}
                data-testid={`${testIdPrefix}-lightbox-img`}
                draggable={false}
                className="w-full max-h-[80vh] object-contain select-none"
              />
              <div className="mt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <div className="overline text-[var(--gold-hi)] mb-1">
                    {photo.category}{photo.subcategory ? ` · ${photo.subcategory}` : ""}
                  </div>
                  {photo.title && (
                    <div className="font-serif text-[24px] md:text-[32px] text-white">
                      {photo.title}
                    </div>
                  )}
                  {photo.description && (
                    <div className="text-[14px] text-white/70 mt-1 max-w-xl">
                      {photo.description}
                    </div>
                  )}
                </div>
                {total > 1 && (
                  <div
                    data-testid={`${testIdPrefix}-lightbox-counter`}
                    className="font-mono-alt text-[11px] tracking-[0.28em] uppercase text-white/60 self-start md:self-end"
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
