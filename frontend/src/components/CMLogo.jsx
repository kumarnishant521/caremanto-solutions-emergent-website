/**
 * Placeholder CM monogram — visually approximates the architectural CM logo
 * (interlocking C and M with vertical construction lines).
 *
 * REPLACE WITH REAL LOGO:
 *   Drop your official PNG / SVG at /app/frontend/public/caremanto-logo.png
 *   The Nav component will auto-detect it (see BrandMark component).
 */
export default function CMLogo({ size = 44, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Caremanto"
    >
      {/* Construction grid lines */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.35">
        <line x1="16" y1="4"  x2="16" y2="60" />
        <line x1="26" y1="4"  x2="26" y2="60" />
        <line x1="38" y1="4"  x2="38" y2="60" />
        <line x1="48" y1="4"  x2="48" y2="60" />
        <line x1="4"  y1="24" x2="60" y2="24" />
        <line x1="4"  y1="44" x2="60" y2="44" />
      </g>
      {/* C */}
      <path
        d="M32 18 A14 14 0 1 0 32 46"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
        strokeLinecap="butt"
      />
      {/* M */}
      <path
        d="M30 46 V22 L40 38 L50 22 V46"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
        strokeLinejoin="miter"
        strokeMiterlimit="4"
      />
    </svg>
  );
}
