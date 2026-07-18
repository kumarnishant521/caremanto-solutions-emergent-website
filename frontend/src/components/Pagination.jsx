import { motion } from "framer-motion";

/**
 * Editorial pagination — page 1 of N · Prev · Next
 *
 * Design contract (iteration 16 studio brief):
 *   • Minimalist. Matches the luxury editorial voice — no rounded buttons,
 *     no aggressive numbers-row, no shouting.
 *   • Emits an `onChange(newPage)` callback. The parent decides whether to
 *     scroll to top / trigger analytics / etc — this component only draws.
 *   • Deterministic — page numbers clamp to `[1, totalPages]`, disabled
 *     buttons for out-of-range moves. Zero layout shift when the current
 *     page number changes.
 *   • Renders nothing when `totalPages < 2` — a single-page folder
 *     doesn't show a page switcher.
 */
export default function Pagination({ page, totalPages, onChange, testIdPrefix = "pagination" }) {
  if (!totalPages || totalPages < 2) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const go = (n) => {
    const clamped = Math.max(1, Math.min(totalPages, n));
    if (clamped !== page) onChange(clamped);
  };

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      aria-label="Portfolio pagination"
      data-testid={testIdPrefix}
      className="mt-14 md:mt-20 pt-8 md:pt-10 border-t border-[var(--line-strong)]/50 flex items-center justify-between gap-6 flex-wrap"
    >
      {/* Prev */}
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={!canPrev}
        data-testid={`${testIdPrefix}-prev`}
        className={`nav-label text-[11px] tracking-[0.28em] uppercase transition-colors ${
          canPrev ? "text-[var(--ink)] hover:text-[var(--gold)]" : "text-[var(--muted)] cursor-not-allowed"
        }`}
      >
        ← Previous
      </button>

      {/* Counter — "PAGE 2 OF 11" */}
      <div
        data-testid={`${testIdPrefix}-counter`}
        className="flex items-baseline gap-3 text-[var(--ink)]"
      >
        <span className="text-[9px] tracking-[0.32em] uppercase text-[var(--muted)]">Page</span>
        <span className="font-serif text-[22px] leading-none text-[var(--gold-hi)]">
          {String(page).padStart(2, "0")}
        </span>
        <span className="text-[10px] tracking-[0.28em] uppercase text-[var(--muted)]">
          of {String(totalPages).padStart(2, "0")}
        </span>
      </div>

      {/* Next */}
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={!canNext}
        data-testid={`${testIdPrefix}-next`}
        className={`nav-label text-[11px] tracking-[0.28em] uppercase transition-colors ${
          canNext ? "text-[var(--ink)] hover:text-[var(--gold)]" : "text-[var(--muted)] cursor-not-allowed"
        }`}
      >
        Next →
      </button>
    </motion.nav>
  );
}
