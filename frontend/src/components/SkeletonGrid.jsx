/**
 * SkeletonGrid — Apple-style shimmer/blur-up placeholder used while the
 * gallery API resolves. Preserves the 3-column CSS masonry rhythm so
 * hydration flips cleanly into real content with no layout jump.
 *
 * Preserves the zero-crop rule: skeleton tiles use aspect-ratio locks
 * only for the placeholder — the real `.portfolio-item-card img` styles
 * (`object-fit: contain !important` in index.css) remain untouched.
 */
const ASPECTS = ["3 / 4", "1 / 1", "4 / 5", "2 / 3", "1 / 1", "3 / 4", "4 / 5", "2 / 3", "1 / 1"];

export default function SkeletonGrid({ count = 9 }) {
  return (
    <div
      className="portfolio-gallery-container"
      data-testid="gallery-skeleton-grid"
      aria-busy="true"
      aria-label="Loading portfolio"
    >
      {Array.from({ length: count }).map((_, i) => (
        <figure key={`sk-${i}`} className="portfolio-item-card">
          <div
            className="portfolio-card-skeleton w-full"
            style={{ aspectRatio: ASPECTS[i % ASPECTS.length] }}
            aria-hidden="true"
          />
        </figure>
      ))}
    </div>
  );
}
