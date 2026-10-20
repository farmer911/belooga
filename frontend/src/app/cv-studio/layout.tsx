import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro CV Studio — 1-Page ATS Vector Resume Builder",
  description:
    "Build a zero-dead-space 1-page A4 engineering resume with live STAR metric auditing and instant cloud draft persistence.",
  alternates: { canonical: "/cv-studio" },
};

export default function CVStudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
