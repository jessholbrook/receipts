import type { Metadata } from "next";
import Link from "next/link";
import SubmitForm from "./SubmitForm";

export const metadata: Metadata = { title: "Submit a win" };

export default function SubmitPage() {
  return (
    <div className="wrap">
      <div className="prose" style={{ paddingBottom: 12 }}>
        <h1>Submit a receipt</h1>
        <p>
          Got a case where research changed a product, a metric or a decision? Add it. Every submission is reviewed
          before it appears. Anonymized cases are welcome. Be honest about the evidence: a well-labeled
          &ldquo;Reported&rdquo; beats an inflated &ldquo;Tested&rdquo;. See <Link href="/how-we-rate">how we rate</Link>.
        </p>
      </div>
      <SubmitForm />
    </div>
  );
}
