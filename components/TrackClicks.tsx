"use client";

import { useEffect } from "react";
import { track, type EventName } from "@/lib/track";

// Server-rendered links opt in with data attributes, e.g.
// <a data-track="source_click" data-slug="..." data-host="...">. One listener for the whole page.
export default function TrackClicks() {
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const { track: name, ...rest } = el.dataset;
      const props: Record<string, string> = {};
      for (const [k, v] of Object.entries(rest)) if (v) props[k] = v.slice(0, 120);
      track(name as EventName, props);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
