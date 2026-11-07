"use client";

import { useState } from "react";

// Source preview image, loaded from the source's own preview image. Hides itself if it fails to load.
export default function Thumb({ src, className = "source-thumb" }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
