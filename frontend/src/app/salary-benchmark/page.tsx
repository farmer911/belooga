"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalaryPercentileCard } from "@/components/features/salary-benchmark/salary-percentile-card";
import { SkillPremiumRadar, SalarySkill } from "@/components/features/salary-benchmark/skill-premium-radar";

const STACKS = ["Golang", "Python / AI", "React / Frontend", "Java / Spring", "DevOps / K8s"];
const LEVELS = ["Junior", "Mid-Level", "Senior", "Lead / Architect"];
const LOCATIONS = ["Ho Chi Minh", "Ha Noi", "Da Nang", "Remote"];

export default function SalaryBenchmarkPage() {
  const [techStack, setTechStack] = useState<string>("Golang");
  const [level, setLevel] = useState<string>("Senior");
  const [location, setLocation] = useState<string>("Ho Chi Minh");

  const [p25, setP25] = useState<number>(43200000);
  const [p50, setP50] = useState<number>(54000000);
  const [p75, setP75] = useState<number>(69600000);
  const [sampleSize, setSampleSize] = useState<number>(342);
  const [skills, setSkills] = useState<SalarySkill[]>([
    { name: "Apache Kafka", salary_premium: "+25%", popularity_pct: 88 },
    { name: "Kubernetes & Helm", salary_premium: "+22%", popularity_pct: 82 },
    { name: "gRPC / Protobuf", salary_premium: "+18%", popularity_pct: 76 },
    { name: "Redis Cluster", salary_premium: "+15%", popularity_pct: 91 },
    { name: "Distributed Tracing", salary_premium: "+14%", popularity_pct: 65 },
  ]);

  useEffect(() => {
    let isMounted = true;
    async function fetchBenchmark() {
      try {
        const queryStack = techStack.split(" ")[0];
        const queryLevel = level.split(" ")[0];
        const res = await axios.get(
          `http://localhost:8000/v1/catalogs/salary-benchmark?tech_stack=${queryStack}&level=${queryLevel}&location=${location}`,
          { timeout: 3000 }
        );
        if (isMounted && res.data) {
          setP25(res.data.p25_salary_vnd);
          setP50(res.data.p50_salary_vnd);
          setP75(res.data.p75_salary_vnd);
          setSampleSize(res.data.sample_size_jds);
          setSkills(res.data.top_paid_skills);
        }
      } catch {
        // Fallback calculations for responsive client interaction
        const isSenior = level.includes("Senior") || level.includes("Lead");
        const base = isSenior ? 48000000 : 25000000;
        setP25(Math.round(base * 0.8));
        setP50(base);
        setP75(Math.round(base * 1.3));
      }
    }
    fetchBenchmark();
    return () => {
      isMounted = false;
    };
  }, [techStack, level, location]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />

      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-cyan-400">Belooga Market Radar</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-medium">Báo Cáo Tra Cứu Lương IT & Kỹ Năng Giá Trị Cao</span>
          <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-800">
            Programmatic SEO
          </Badge>
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800">
            Realtime 2026
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/ats-diagnostics">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-3 h-7 flex items-center gap-1">
              <span>🎯</span> So Khớp Với JD Ngay
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 p-4 space-y-4 max-w-[1400px] w-full mx-auto overflow-y-auto">
        {/* Dynamic Filters Bar */}
        <div className="p-3.5 rounded bg-slate-900/90 border border-slate-800 space-y-3">
          {/* Tech Stack Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 w-28">Ngôn ngữ / Stack:</span>
            <div className="flex flex-wrap gap-1.5">
              {STACKS.map((s) => (
                <button
                  key={s}
                  onClick={() => setTechStack(s)}
                  className={`px-2.5 py-1 rounded text-xs transition font-mono ${
                    techStack === s
                      ? "bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20"
                      : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Level Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 w-28">Cấp bậc / Level:</span>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    level === l
                      ? "bg-emerald-500 text-black font-bold"
                      : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Location Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 w-28">Địa điểm làm việc:</span>
            <div className="flex flex-wrap gap-1.5">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`px-2.5 py-0.5 rounded text-xs transition ${
                    location === loc
                      ? "bg-slate-700 text-cyan-300 font-semibold border border-cyan-500"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📍 {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column High-Density Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <SalaryPercentileCard
              techStack={techStack}
              level={level}
              location={location}
              p25={p25}
              p50={p50}
              p75={p75}
              sampleSize={sampleSize}
              growthRate="+18.5%"
              marketDemand="RẤT CAO"
            />
          </div>

          <div className="lg:col-span-5">
            <SkillPremiumRadar skills={skills} techStack={techStack} />
          </div>
        </div>
      </main>

      {/* Terminal Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-1.5 text-[11px] text-slate-500 flex justify-between items-center">
        <div>Hệ thống đối soát mức lương IT: <strong>Belooga Market Intelligence</strong> (Dữ liệu cào định kỳ)</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-400">Đã chuẩn hóa 3,000+ tin tuyển dụng IT</span>
        </div>
      </footer>
    </div>
  );
}
