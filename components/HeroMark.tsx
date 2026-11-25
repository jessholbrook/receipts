// The homepage figure: the receipt over a grey circle, after Fred Troller's Geigy posters.
// The overlap is drawn as its own clipped shape (not a blend mode) so it holds in dark mode.
const RECEIPT =
  "M430,70 H770 V600 L741.7,634 L713.3,600 L685,634 L656.7,600 L628.3,634 L600,600 L571.7,634 L543.3,600 L515,634 L486.7,600 L458.3,634 L430,600 Z";

export default function HeroMark() {
  return (
    <svg className="hero-mark" viewBox="430 40 680 594" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
      <defs>
        <clipPath id="hero-circle">
          <circle cx="820" cy="330" r="290" />
        </clipPath>
      </defs>
      <circle cx="820" cy="330" r="290" style={{ fill: "var(--grey-shape)" }} />
      <path d={RECEIPT} style={{ fill: "var(--signal)" }} />
      <path d={RECEIPT} clipPath="url(#hero-circle)" style={{ fill: "var(--signal-deep)" }} />
      <g style={{ fill: "var(--paper)" }}>
        <rect x="474" y="214" width="168" height="16" />
        <rect x="474" y="256" width="118" height="16" />
        <rect x="474" y="298" width="196" height="16" />
        <rect x="474" y="432" width="252" height="34" />
      </g>
      <line x1="430" y1="150" x2="770" y2="150" strokeWidth="8" strokeDasharray="14 12" style={{ stroke: "var(--paper)" }} />
    </svg>
  );
}
