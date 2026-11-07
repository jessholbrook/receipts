"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const LAST_RESULTS_KEY = "receipts-last-results";

// Back to the list the visitor came from, filters intact. Falls back to the full list.
export default function BackToResults() {
  const [href, setHref] = useState("/");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(LAST_RESULTS_KEY);
      if (saved && saved.startsWith("/?")) setHref(saved);
    } catch {
      /* storage unavailable: keep the plain link */
    }
  }, []);
  return <Link href={href}>{href === "/" ? "All receipts" : "Back to results"}</Link>;
}
