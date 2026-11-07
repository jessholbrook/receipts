"use client";

import { useState } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API blocked (permissions, insecure context): fall back to a hidden textarea.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// `text` may be a function so values that depend on the current URL are read at click time.
export default function CopyButton({
  label,
  text,
  className = "btn secondary",
  onCopied,
}: {
  label: string;
  text: string | (() => string);
  className?: string;
  onCopied?: () => void;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <button
      type="button"
      className={`${className} copy-btn`}
      data-state={state}
      onClick={async () => {
        const ok = await copyText(typeof text === "function" ? text() : text);
        setState(ok ? "copied" : "failed");
        if (ok) onCopied?.();
        window.setTimeout(() => setState("idle"), 2200);
      }}
    >
      <span aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? "Couldn’t copy" : label}
      </span>
    </button>
  );
}
