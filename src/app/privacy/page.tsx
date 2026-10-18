import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

// oxlint-disable-next-line react/only-export-components
export const metadata: Metadata = {
  title: "Privacy notice | Saathi Kosh",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
