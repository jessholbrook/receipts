import { renderOg, OG_SIZE } from "@/lib/og";
import { getEntries } from "@/lib/supabase";

export const alt = "Receipts: What has UX research ever done for us?";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image() {
  const entries = await getEntries().catch(() => []);
  return renderOg({
    kicker: entries.length ? `${entries.length} documented UX research wins` : "Documented UX research wins",
    title: "What has UX research ever done for us?",
    company: "Rated for evidence strength. Filter by method, industry and metric.",
    metric: "Show me the receipts.",
  });
}
