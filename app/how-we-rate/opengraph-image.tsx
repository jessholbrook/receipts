import { renderOg, OG_SIZE } from "@/lib/og";

export const alt = "Receipts: How we rate";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOg({
    kicker: "How we rate",
    title: "Tested, Measured, Reported or Decision",
    company: "Four evidence levels. Vendors flagged.",
    metric: "No receipt, no claim.",
    resultLabel: "RULE",
  });
}
