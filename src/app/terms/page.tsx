import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

// oxlint-disable-next-line react/only-export-components
export const metadata: Metadata = {
  title: "Terms of use | Saathi Kosh",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
