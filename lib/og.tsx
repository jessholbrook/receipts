// Shared rendering for Open Graph images (1200x630).
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const EV: Record<string, { label: string; fg: string; bg: string }> = {
  tested: { label: "TESTED", fg: "#166534", bg: "#dcfce7" },
  measured: { label: "MEASURED", fg: "#1d4ed8", bg: "#dbeafe" },
  reported: { label: "REPORTED", fg: "#854d0e", bg: "#fef3c7" },
  decision: { label: "DECISION", fg: "#7e22ce", bg: "#f3e8ff" },
};

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
        width: 30,
        height: 36,
        background: "#0e0e0e",
        clipPath: "polygon(0 0, 100% 0, 100% 88%, 83% 100%, 67% 88%, 50% 100%, 33% 88%, 17% 100%, 0 88%)",
      }}
    />
  );
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
  const ev = evidence ? EV[evidence] : undefined;
  const allText = [kicker, title, company, metric, ev?.label, source?.text, resultLabel, "Receipts", "What has UX research ever done for us?"]
    .filter(Boolean)
    .join(" ");
  const [serif, mono, sans] = await Promise.all([
    googleFont("Newsreader", 600, allText),
    googleFont("JetBrains Mono", 600, allText),
    googleFont("Source Sans 3", 400, allText),
  ]);
  const fonts = [
    serif && { name: "Newsreader", data: serif, weight: 600 as const },
    mono && { name: "JetBrains Mono", data: mono, weight: 600 as const },
    sans && { name: "Source Sans 3", data: sans, weight: 400 as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 600 }[];

  const titleSize = title.length > 110 ? 40 : title.length > 80 ? 46 : title.length > 55 ? 54 : 66;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f7f7f5",
          padding: "56px 64px",
          fontFamily: "Source Sans 3",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            border: "1px solid #e0e0dc",
            padding: "40px 48px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Mark />
              <span style={{ fontFamily: "Newsreader", fontSize: 34, color: "#0e0e0e" }}>Receipts</span>
            </div>
            {ev ? (
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontSize: 22,
                  letterSpacing: 2,
                  color: ev.fg,
                  background: ev.bg,
                  padding: "6px 18px",
                  borderRadius: 999,
                }}
              >
                {ev.label}
              </div>
            ) : null}
          </div>
          {kicker ? (
            <div
              style={{
                display: "flex",
                marginTop: 34,
                fontFamily: "JetBrains Mono",
                fontSize: 20,
                letterSpacing: 2,
                color: "#5a5a5a",
                textTransform: "uppercase",
              }}
            >
              {kicker}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: kicker ? 14 : 48,
              fontFamily: "Newsreader",
              fontSize: titleSize,
              lineHeight: 1.08,
              color: "#0e0e0e",
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
          {company || source ? (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16, marginTop: 18 }}>
              {company ? <span style={{ fontSize: 28, color: "#383838" }}>{company}</span> : null}
              {source ? (
                <div
                  style={
                    source.vendor
                      ? {
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 22,
                          color: "#9a3412",
                          background: "#fdecdf",
                          border: "2px solid #e8b48f",
                          borderRadius: 8,
                          padding: "4px 12px",
                        }
                      : { display: "flex", fontSize: 22, color: "#383838" }
                  }
                >
                  {source.vendor ? (
                    <svg width="22" height="22" viewBox="0 0 16 16">
                      <path d="M8 1.5 15 14H1z" fill="none" stroke="#9a3412" strokeWidth="1.6" strokeLinejoin="round" />
                      <path d="M8 6v3.6M8 11.6v.4" stroke="#9a3412" strokeWidth="1.6" strokeLinecap="round" />
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
              borderTop: "2px dashed #bdbdb7",
              paddingTop: 18,
              fontFamily: "JetBrains Mono",
            }}
          >
            <span style={{ fontSize: 22, color: "#5a5a5a", letterSpacing: 2 }}>{resultLabel}</span>
            <span style={{ fontSize: 36, color: "#0e0e0e" }}>{metric ?? "What has UX research ever done for us?"}</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
