import { renderOg, OG_SIZE } from "@/lib/og";

export const alt = "Receipts: About";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOg({
    kicker: "About",
    title: "What has UX research ever done for us?",
    company: "Why this atlas exists, and how it works.",
    metric: "Show me the receipts.",
    resultLabel: "TOTAL",
  });
}
