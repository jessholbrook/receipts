// "27.6% → 72.9%" drawn as two circles whose AREAS are the two percentages, sitting on one line
// and overlapping like a Troller poster. Only drawn for results that are two percentages; anything
// else returns null.
const PAIR = /(~?)(\d+(?:\.\d+)?)%\s*(?:→|->)\s*(~?)(\d+(?:\.\d+)?)%/;

export function parsePercentPair(metric: string | null): { a: number; b: number; aLabel: string; bLabel: string } | null {
  const m = metric?.match(PAIR);
  if (!m) return null;
  const a = Number(m[2]);
  const b = Number(m[4]);
  if (!(a > 0 && a <= 100 && b > 0 && b <= 100)) return null;
  return { a, b, aLabel: `${m[1]}${m[2]}%`, bLabel: `${m[3]}${m[4]}%` };
}

export default function ResultCircles({ metric }: { metric: string | null }) {
  const p = parsePercentPair(metric);
  if (!p) return null;
  const R = 230; // radius of a 100% circle
  const ra = R * Math.sqrt(p.a / 100);
  const rb = R * Math.sqrt(p.b / 100);
  const base = 520;
  const cxA = 40 + ra;
  const cxB = cxA + ra + rb - Math.min(ra, rb) * 0.9; // overlap by most of the smaller circle
  // A fixed minimum width keeps every entry's circles on the same scale, and leaves room for
  // the label of a small "after" circle.
  const width = Math.max(cxB + rb + 20, cxB + 90, 2 * R + 120);
  const inside = rb >= 80; // room for the label inside the circle
  // Crop the frame to the tallest shape (and the outside label, when there is one).
  const top = Math.max(0, Math.min(base - 2 * ra, base - 2 * rb - (inside ? 0 : 80)) - 16);
  const fs = Math.min(96, Math.max(40, rb * 0.42));
  return (
    <figure className="result-circles">
      <svg viewBox={`0 ${Math.round(top)} ${Math.round(width)} ${Math.round(600 - top)}`} role="img" aria-label={`Before ${p.aLabel}, after ${p.bLabel}. Circle areas are to scale.`}>
        <defs>
          <clipPath id="rc-a">
            <circle cx={cxA} cy={base - ra} r={ra} />
          </clipPath>
        </defs>
        <circle cx={cxA} cy={base - ra} r={ra} style={{ fill: "var(--grey-shape)" }} />
        <circle cx={cxB} cy={base - rb} r={rb} style={{ fill: "var(--signal)" }} />
        <circle cx={cxB} cy={base - rb} r={rb} clipPath="url(#rc-a)" style={{ fill: "var(--signal-deep)" }} />
        <line x1="0" y1={base} x2={width} y2={base} strokeWidth="3" style={{ stroke: "var(--ink)" }} />
        {inside ? (
          <text x={cxB} y={base - rb + fs * 0.35} textAnchor="middle" className="rc-big" style={{ fill: "#ffffff", fontSize: fs }}>
            {p.bLabel}
          </text>
        ) : (
          <text x={cxB} y={base - 2 * rb - 16} textAnchor="middle" className="rc-big" style={{ fill: "var(--ink)", fontSize: 56 }}>
            {p.bLabel}
          </text>
        )}
        <text x="0" y={base + 46} textAnchor="start" className="rc-small" style={{ fill: "var(--ink)" }}>
          {p.aLabel} before
        </text>
        <text x={width} y={base + 46} textAnchor="end" className="rc-small" style={{ fill: "var(--ink)" }}>
          after
        </text>
      </svg>
      <figcaption>Circle areas to scale.</figcaption>
    </figure>
  );
}
