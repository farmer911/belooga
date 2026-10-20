import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 Tech Salary Benchmark & Career ROI Calculator",
  description:
    "Compare P25, P50, P75, and P90 compensation percentiles by role, seniority, and high-scarcity skills.",
  alternates: { canonical: "/salary-benchmark" },
};

export default function SalaryBenchmarkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
