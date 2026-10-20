import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free ATS Resume Scanner & JD Keyword Matcher",
  description:
    "Scan your CV against any Job Description with Bot-Eye ATS parser, STAR metric density scoring, and 60-second video pitch script generator.",
  alternates: { canonical: "/ats-diagnostics" },
};

export default function ATSDiagnosticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
