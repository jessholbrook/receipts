import type { Metadata } from "next";

// Link-preview tags (Slack, iMessage, LinkedIn). A page's openGraph replaces the layout's wholesale
// rather than merging, so every page builds its tags here to keep the site name on the card.
export const SITE_NAME = "Receipts";

export function shareMeta(
  title: string,
  description: string,
  extra: { type?: "website" | "article"; url?: string } = {},
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { title, description, siteName: SITE_NAME, type: extra.type ?? "website", ...(extra.url ? { url: extra.url } : {}) },
    twitter: { card: "summary_large_image", title, description },
  };
}
