// Shared rendering for Open Graph images (1200x630), in the site's Troller style:
// paper, one heavy grotesque, the evidence sign, a red circle cropped off the corner.
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#111111";
const INK_2 = "#33332f";
const INK_3 = "#55554f";
const PAPER = "#f5f5f2";
const RED = "#e3231b";
const GREY = "#c9c9c4";

const EV_LABEL: Record<string, string> = { tested: "tested", measured: "measured", reported: "reported", decision: "decision" };

async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`,
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

function Mark() {
  return (
    <div
      style={{
        width: 26,
        height: 32,
        background: RED,
        clipPath: "polygon(0 0, 100% 0, 100% 88%, 83% 100%, 67% 88%, 50% 100%, 33% 88%, 17% 100%, 0 88%)",
      }}
    />
  );
}

// The evidence levels as shapes: solid circle, half circle, ring, square.
function Sign({ level }: { level: string }) {
  const base = { display: "flex", width: 26, height: 26 } as const;
  if (level === "tested") return <div style={{ ...base, borderRadius: 13, background: RED }} />;
  if (level === "measured")
    return <div style={{ ...base, borderRadius: 13, backgroundImage: `linear-gradient(90deg, ${RED} 50%, ${GREY} 50%)` }} />;
  if (level === "reported") return <div style={{ ...base, borderRadius: 13, border: `6px solid ${INK}` }} />;
  return <div style={{ ...base, width: 23, height: 23, margin: 1.5, background: INK }} />;
}

export async function renderOg(opts: {
  kicker?: string;
  title: string;
  company?: string;
  metric?: string | null;
  evidence?: string;
  /** who is telling the story; vendor accounts are flagged like they are on the site */
  source?: { text: string; vendor: boolean };
  resultLabel?: string;
}) {
  const { kicker, title, metric, evidence, source, resultLabel = "TOTAL" } = opts;
  // one line for the company; the full name is on the page
  const company = opts.company && opts.company.length > 52 ? `${opts.company.slice(0, 50).trimEnd()}…` : opts.company;
  const ev = evidence ? EV_LABEL[evidence] : undefined;
  const allText = [kicker, title, company, metric, ev, source?.text, resultLabel, "receipts", "What has UX research ever done for us?"]
    .filter(Boolean)
    .join(" ");
  // The kicker and labels render uppercased (textTransform), so the font subset needs capitals too.
  const glyphs = `${allText} ${allText.toUpperCase()} …`;
  const [heavy, bold, regular] = await Promise.all([
    googleFont("Inter Tight", 800, glyphs),
    googleFont("Inter Tight", 700, glyphs),
    googleFont("Inter Tight", 500, glyphs),
  ]);
  const fonts = [
    heavy && { name: "Inter Tight", data: heavy, weight: 800 as const },
    bold && { name: "Inter Tight", data: bold, weight: 700 as const },
    regular && { name: "Inter Tight", data: regular, weight: 500 as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 500 | 700 | 800 }[];

  const titleSize = title.length > 110 ? 40 : title.length > 80 ? 46 : title.length > 55 ? 54 : 68;
  const metricText = metric ?? "What has UX research ever done for us?";
  const metricSize = metricText.length > 34 ? 30 : metricText.length > 24 ? 36 : 44;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: PAPER,
          padding: "56px 64px 52px",
          fontFamily: "Inter Tight",
          color: INK,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -110,
            top: -110,
            width: 260,
            height: 260,
            borderRadius: 130,
            background: RED,
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Mark />
            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.6 }}>receipts</span>
          </div>

          {ev || kicker ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 40 }}>
              {ev && evidence ? <Sign level={evidence} /> : null}
              {ev ? <span style={{ fontSize: 24, fontWeight: 700 }}>{ev}</span> : null}
              {kicker ? (
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: INK_3,
                    textTransform: "uppercase",
                    marginLeft: ev ? 6 : 0,
                  }}
                >
                  {ev ? `· ${kicker}` : kicker}
                </span>
              ) : null}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              marginTop: ev || kicker ? 16 : 48,
              maxWidth: 1000,
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -titleSize * 0.025,
            }}
          >
            {title}
          </div>

          {company || source ? (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 18, marginTop: 20 }}>
              {company ? <span style={{ fontSize: 26, fontWeight: 500, color: INK_2 }}>{company}</span> : null}
              {source ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, fontWeight: source.vendor ? 700 : 500, color: source.vendor ? INK : INK_3 }}>
                  {source.vendor ? (
                    <svg width="20" height="18" viewBox="0 0 12 11">
                      <path d="M6,0 L12,11 L0,11 Z" fill={RED} />
                    </svg>
                  ) : null}
                  {source.text}
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ flex: 1, display: "flex" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 24,
              borderTop: `4px solid ${INK}`,
              paddingTop: 16,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: INK_3, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {resultLabel}
            </span>
            <span style={{ fontSize: metricSize, fontWeight: 800, letterSpacing: -metricSize * 0.025 }}>{metricText}</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
