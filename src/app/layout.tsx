import type { Metadata } from "next";
import "./globals.css";

// Next.js App Router requires route metadata to be exported from this segment.
// oxlint-disable-next-line react/only-export-components
export const metadata: Metadata = {
  title: "Saathi Kosh — समूह की बचत, सबकी समझ",
  description: "हिंदी-प्रथम स्वयं सहायता समूह लेजर का सुरक्षित, सिम्युलेटेड डेमो।",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
