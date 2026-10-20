import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1-on-1 Expert CV Review & Senior Engineering Coaching",
  description:
    "Get your resume audited by Staff Engineers and Engineering Managers from Stripe, Figma, and OpenAI with 48-hour turnaround.",
  alternates: { canonical: "/expert-review" },
};

export default function ExpertReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
