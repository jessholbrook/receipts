// Shared rendering for Open Graph images (1200x630).
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const EV: Record<string, { label: string; fg: string; bg: string }> = {
  tested: { label: "TESTED", fg: "#15803d", bg: "#dcfce7" },
  measured: { label: "MEASURED", fg: "#1d4ed8", bg: "#dbeafe" },
  reported: { label: "REPORTED", fg: "#a16207", bg: "#fef3c7" },
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
        background: "#1d1b17",
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
}) {
  const { kicker, title, company, metric, evidence } = opts;
  const ev = evidence ? EV[evidence] : undefined;
  const allText = [kicker, title, company, metric, ev?.label, "Receipts", "TOTAL", "What has UX research ever done for us?"]
    .filter(Boolean)
    .join(" ");
  const [serif, mono, sans] = await Promise.all([
    googleFont("Fraunces", 600, allText),
    googleFont("JetBrains Mono", 600, allText),
    googleFont("Inter", 400, allText),
  ]);
  const fonts = [
    serif && { name: "Fraunces", data: serif, weight: 600 as const },
    mono && { name: "JetBrains Mono", data: mono, weight: 600 as const },
    sans && { name: "Inter", data: sans, weight: 400 as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 600 }[];

  const titleSize = title.length > 90 ? 50 : title.length > 60 ? 58 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f3ec",
          padding: "56px 64px",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fffdf8",
            border: "1px solid #d9d2c3",
            padding: "40px 48px",
            boxShadow: "0 4px 24px rgba(40,30,10,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Mark />
              <span style={{ fontFamily: "Fraunces", fontSize: 34, color: "#1d1b17" }}>Receipts</span>
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
                color: "#7a7468",
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
              fontFamily: "Fraunces",
              fontSize: titleSize,
              lineHeight: 1.08,
              color: "#1d1b17",
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
          {company ? (
            <div style={{ display: "flex", marginTop: 18, fontSize: 28, color: "#4a463e" }}>{company}</div>
          ) : null}
          <div style={{ flex: 1, display: "flex" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderTop: "2px dashed #b8af9c",
              paddingTop: 18,
              fontFamily: "JetBrains Mono",
            }}
          >
            <span style={{ fontSize: 22, color: "#7a7468", letterSpacing: 2 }}>TOTAL</span>
            <span style={{ fontSize: 36, color: "#1d1b17" }}>{metric ?? "What has UX research ever done for us?"}</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
