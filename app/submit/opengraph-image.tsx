import { renderOg, OG_SIZE } from "@/lib/og";

export const alt = "Receipts: Submit a receipt";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOg({
    kicker: "Submit a receipt",
    title: "Got a research win? Add the receipt.",
    company: "Anonymized cases welcome.",
    metric: "Reviewed before it goes live.",
    resultLabel: "NEXT",
  });
}
