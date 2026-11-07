"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";

// Copy link / Copy as citation, with a visible preview of exactly what went to the clipboard.
export default function CiteActions({ url, citation }: { url: string; citation: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <div className="cite">
      <div className="cite-actions">
        <CopyButton label="Copy link" text={url} onCopied={() => setCopied(url)} />
        <CopyButton label="Copy as citation" text={citation} onCopied={() => setCopied(citation)} />
      </div>
      {copied && (
        <figure className="cite-preview">
          <figcaption>Copied to your clipboard</figcaption>
          <pre>{copied}</pre>
        </figure>
      )}
    </div>
  );
}
