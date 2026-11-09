"use client";

import { useEffect, useRef, useState } from "react";
import CopyButton from "./CopyButton";
import { track } from "@/lib/track";

// Copy link / Copy as citation, with a visible preview of exactly what went to the clipboard.
// If the clipboard is blocked, the same text appears selected so it can be copied by hand.
export default function CiteActions({ slug, url, citation }: { slug: string; url: string; citation: string }) {
  const [shown, setShown] = useState<{ text: string; ok: boolean } | null>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (shown && !shown.ok && preRef.current) {
      const range = document.createRange();
      range.selectNodeContents(preRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [shown]);

  return (
    <div className="cite">
      <div className="cite-actions">
        <CopyButton
          label="Copy link"
          text={url}
          onCopied={() => {
            setShown({ text: url, ok: true });
            track("copy_link", { slug });
          }}
          onFailed={() => setShown({ text: url, ok: false })}
        />
        <CopyButton
          label="Copy as citation"
          text={citation}
          onCopied={() => {
            setShown({ text: citation, ok: true });
            track("copy_citation", { slug });
          }}
          onFailed={() => setShown({ text: citation, ok: false })}
        />
      </div>
      {shown && (
        <figure className="cite-preview" data-ok={shown.ok}>
          <figcaption>
            {shown.ok ? "Copied to your clipboard" : "Your browser blocked copying. It’s selected below: press Ctrl+C or ⌘C."}
          </figcaption>
          <pre ref={preRef}>{shown.text}</pre>
        </figure>
      )}
    </div>
  );
}
