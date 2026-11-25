import type { Entry } from "@/lib/types";

// The four evidence levels as geometric signs, so they read at a glance and by shape, not colour:
// tested = solid circle, measured = half circle, reported = ring, decision = square.
export default function EvidenceSign({ level, size = "sm" }: { level: Entry["evidence_strength"]; size?: "sm" | "lg" }) {
  return <span className={`ev-sign ev-sign-${level} ev-sign-${size}`} aria-hidden="true" />;
}
