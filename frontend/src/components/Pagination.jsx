import { motion } from "framer-motion";

/**
 * Editorial pagination — Prev · [1] [2] [3] … [N] · Next
 *
 * Design contract (iteration 22):
 *   • Minimalist. Matches the luxury editorial voice — hairline borders,
 *     no rounded button pills, no shouting.
 *   • Numeric page selectors. Long ranges are collapsed with an ellipsis
 *     so the row never wraps past ~7 buttons: first, last, current, and
 *     one neighbour on either side of the current page.
 *   • Emits an `onChange(newPage)` callback. The parent decides whether to
 *     scroll to top / trigger analytics / etc — this component only draws.
 *   • Renders nothing when `totalPages < 2` — a single-page folder
 *     doesn't show a page switcher.
 */

// Build a compact set of visible page indices: first, last, current ± 1,
// with `null` inserted where an ellipsis should appear.
function buildPageWindow(page, totalPages) {
  const set = new Set([1, totalPages, page, page - 1, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push(null);   // ellipsis marker
    out.push(nums[i]);
  }
  return out;
}

export default function Pagination({ page, totalPages, onChange, testIdPrefix = "pagination" }) {
  if (!totalPages || totalPages < 2) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;
  const window = buildPageWindow(page, totalPages);

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

      {/* Numeric page selectors — 1, 2, 3 … N */}
      <ol
        data-testid={`${testIdPrefix}-pages`}
        className="flex items-center gap-1.5 md:gap-2"
      >
        {window.map((n, i) => {
          if (n === null) {
            return (
              <li
                key={`e-${i}`}
                aria-hidden="true"
                className="px-1 text-[11px] text-[var(--muted)] tracking-[0.28em]"
              >
                …
              </li>
            );
          }
          const active = n === page;
          return (
            <li key={n}>
              <button
                type="button"
                onClick={() => go(n)}
                disabled={active}
                aria-current={active ? "page" : undefined}
                data-testid={`${testIdPrefix}-page-${n}`}
                className={`min-w-[36px] h-9 flex items-center justify-center font-mono-alt text-[11px] tracking-[0.14em] border transition-all ${
                  active
                    ? "border-[var(--gold-hi)] text-[var(--gold-hi)] bg-[var(--gold-hi)]/5"
                    : "border-transparent text-[var(--ink)]/85 hover:border-[var(--line-strong)]/60 hover:text-[var(--gold)]"
                }`}
              >
                {String(n).padStart(2, "0")}
              </button>
            </li>
          );
        })}
      </ol>

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
