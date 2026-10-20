import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Verified Tech Talent & Video Resumes",
  description:
    "Search verified engineers, product designers, and leaders by skill, location, and 30-second video elevator pitches.",
  alternates: { canonical: "/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
