"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, MapPin } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalaryPercentileCard } from "@/components/features/salary-benchmark/salary-percentile-card";
import { SkillPremiumRadar, SalarySkill } from "@/components/features/salary-benchmark/skill-premium-radar";
import { SalaryCrawlerPanel, CrawlerSourceMeta } from "@/components/features/salary-benchmark/salary-crawler-panel";
import { SalaryHistoricalChart, HistoricalSalaryPoint } from "@/components/features/salary-benchmark/salary-historical-chart";
import { SalaryNegotiationAndRoadmapSuite } from "@/components/features/growth/career-acceleration-suite";

const STACKS = ["Golang", "Python / AI", "React / Frontend", "Java / Spring", "DevOps / K8s"];
const LEVELS = ["Junior", "Mid-Level", "Senior", "Lead / Architect"];
const LOCATIONS = ["Ho Chi Minh", "Ha Noi", "Da Nang", "Remote"];

interface SalaryBenchmarkData {
  p25_salary_vnd: number;
  p50_salary_vnd: number;
  p75_salary_vnd: number;
  sample_size_jds: number;
  top_paid_skills: SalarySkill[];
  growth_rate_yoy?: string;
  growth_since_2024_pct?: number;
  last_crawled_at?: string;
  crawler_sources?: CrawlerSourceMeta[];
  historical_series?: HistoricalSalaryPoint[];
  market_demand?: string;
}

interface CareerRoiData {
  current_median_vnd: number;
  projected_upskill_vnd: number;
  annual_comp_gain_vnd: number;
  upskill_recommendations: Array<{
    skill: string;
    salary_premium_pct?: string;
    salary_boost_pct?: string | number;
    monthly_delta_vnd?: number;
    learning_weeks: number;
    roi_score?: number;
    roi_verdict?: string;
  }>;
  negotiation_leverage_script: string;
}

export default function SalaryBenchmarkPage() {
  const queryClient = useQueryClient();
  const [techStack, setTechStack] = useState<string>("Golang");
  const [level, setLevel] = useState<string>("Senior");
  const [location, setLocation] = useState<string>("Ho Chi Minh");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const queryStack = techStack.split(" ")[0];
  const role = techStack.toLowerCase().includes("react") ? "frontend" : techStack.toLowerCase().includes("devops") ? "devops" : techStack.toLowerCase().includes("ai") ? "ai" : "backend";
  const city = location;
  const normalizedLevel = level.replace("-Level", "").split(" ")[0];

  const { data: benchmark } = useQuery<SalaryBenchmarkData>({
    queryKey: ["salary-benchmark", role, techStack, level, location, selectedYear],
    queryFn: async () => {
      const res = await apiClient.get<SalaryBenchmarkData>("/v1/catalogs/salary-benchmark", {
        params: { role, tech_stack: queryStack, level: level.replace("-Level", ""), city, location, year: selectedYear },
      });
      return res.data;
    },
  });

  const crawlMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<SalaryBenchmarkData>("/v1/catalogs/salary-benchmark/crawl", {
        role,
        tech_stack: queryStack,
        level: level.replace("-Level", ""),
        city,
        location,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-benchmark"] });
    },
  });

  const { data: careerRoi } = useQuery<CareerRoiData>({
    queryKey: ["career-upskill-roi", techStack, normalizedLevel, location],
    queryFn: async () => {
      const res = await apiClient.get<CareerRoiData>("/v1/catalogs/career-roi", {
        params: { tech_stack: queryStack, level: level.replace("-Level", ""), city, location },
      });
      return res.data;
    },
  });

  const p25 = benchmark?.p25_salary_vnd ?? 0;
  const p50 = benchmark?.p50_salary_vnd ?? 0;
  const p75 = benchmark?.p75_salary_vnd ?? 0;
  const sampleSize = benchmark?.sample_size_jds ?? 0;
  const skills = benchmark?.top_paid_skills ?? [];
  const growthSince2024 = benchmark?.growth_since_2024_pct ?? 0;
  const crawlerSources: CrawlerSourceMeta[] = benchmark?.crawler_sources ?? [];
  const historicalSeries: HistoricalSalaryPoint[] = benchmark?.historical_series ?? [];

  return (
    <div className="flex-1 bg-surface-page text-typography-main flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-dark">
      <div className="border-b border-surface-border bg-surface-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-primary">Belooga Market Radar</span>
          <span className="text-surface-border">/</span>
          <span className="text-typography-heading font-medium">Báo Cáo Tra Cứu Lương IT & Kỹ Năng Giá Trị Cao</span>
          <Badge variant="outline" className="text-[10px] text-brand-dark border-brand-primary/40 bg-teal-50/50">Programmatic SEO</Badge>
          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">Realtime 2024–2026</Badge>
        </div>
        <Link href="/ats-diagnostics">
          <Button className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-3.5 h-8 rounded-lg shadow-xs flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" aria-hidden="true" />
            <span>So Khớp Với JD Ngay</span>
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-7xl w-full mx-auto overflow-y-auto">
        <SalaryCrawlerPanel
          sampleSize={sampleSize}
          lastCrawledAt={benchmark?.last_crawled_at || "Live PostgreSQL"}
          growthSince2024Pct={growthSince2024}
          sources={crawlerSources}
          isCrawling={crawlMutation.isPending}
          onTriggerCrawl={() => crawlMutation.mutate()}
        />

        <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-typography-heading w-28">Ngôn ngữ / Stack:</span>
            <div className="flex flex-wrap gap-1.5">
              {STACKS.map((s) => (
                <button key={s} onClick={() => setTechStack(s)} className={`px-3 py-1 rounded-md text-xs transition-colors font-mono cursor-pointer ${techStack === s ? "bg-brand-primary text-white font-bold shadow-xs" : "bg-surface-page border border-surface-border text-typography-heading hover:bg-surface-divider"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-typography-heading w-28">Cấp bậc / Level:</span>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevel(l)} className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${level === l ? "bg-brand-dark text-white font-bold shadow-xs" : "bg-surface-page border border-surface-border text-typography-heading hover:bg-surface-divider"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-typography-heading w-28">Địa điểm làm việc:</span>
            <div className="flex flex-wrap gap-1.5">
              {LOCATIONS.map((loc) => (
                <button key={loc} onClick={() => setLocation(loc)} className={`px-2.5 py-1 rounded-md text-xs transition-colors inline-flex items-center gap-1 cursor-pointer ${location === loc ? "bg-brand-overlay text-brand-dark font-semibold border border-teal-200" : "bg-surface-page border border-surface-border text-typography-muted hover:text-typography-main"}`}>
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  <span>{loc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <SalaryHistoricalChart selectedYear={selectedYear} onSelectYear={setSelectedYear} series={historicalSeries} techStack={techStack} level={level} location={location} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7"><SalaryPercentileCard techStack={techStack} level={level} location={location} p25={p25} p50={p50} p75={p75} sampleSize={sampleSize} growthRate={benchmark?.growth_rate_yoy || "0%"} marketDemand={benchmark?.market_demand || ""} /></div>
          <div className="lg:col-span-5"><SkillPremiumRadar skills={skills} techStack={techStack} /></div>
        </div>
        <SalaryNegotiationAndRoadmapSuite techStack={techStack} level={level} />
        {careerRoi && (
          <div data-testid="career-upskill-roi-card" className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-typography-main uppercase tracking-wider">Mô Phỏng ROI Nâng Cấp Kỹ Năng & Kịch Bản Đàm Phán Lương</div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">+{(careerRoi.annual_comp_gain_vnd / 1_000_000).toFixed(0)}M VNĐ / Năm</span>
            </div>
            {careerRoi.upskill_recommendations?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {careerRoi.upskill_recommendations.map((rec) => (
                  <div key={rec.skill} className="p-2.5 rounded-lg bg-surface-page border border-surface-border text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-typography-main">
                      <span>• {rec.skill}</span>
                      <span className="text-emerald-700">{rec.salary_boost_pct ?? rec.salary_premium_pct}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-typography-muted">
                      <span>Lộ trình: {rec.learning_weeks} tuần</span>
                      <span className="font-semibold text-brand-primary">{rec.roi_verdict ?? `ROI ${rec.roi_score ?? 9.5}/10`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-typography-heading bg-teal-50/50 border border-teal-200 rounded-lg p-2.5">{careerRoi.negotiation_leverage_script}</p>
          </div>
        )}
      </div>
    </div>
  );
}
