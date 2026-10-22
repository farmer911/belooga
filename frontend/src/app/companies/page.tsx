"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Star, MapPin, ShieldCheck, Plus, Briefcase, Users } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { CompanyProfileItem, CompanyCreateModal } from "@/components/features/companies/company-data";

const TECH_CHIPS = ["All", "Golang", "Python", "FastAPI", "React", "Kubernetes", "PostgreSQL"];
const INDUSTRIES = ["ALL", "AI / Cloud", "Fintech", "E-commerce", "SaaS"];

export default function CompaniesDirectoryPage() {
  const [query, setQuery] = useState("");
  const [selectedTech, setSelectedTech] = useState("All");
  const [industry, setIndustry] = useState("ALL");
  const [hiringOnly, setHiringOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"rating" | "open_jobs" | "salary">("rating");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: companies = [] } = useQuery<CompanyProfileItem[]>({
    queryKey: ["companies-directory", query, selectedTech, industry, hiringOnly],
    queryFn: async () => {
      const res = await apiClient.get<CompanyProfileItem[]>("/v1/companies/search", {
        params: {
          q: query,
          tech_stack: selectedTech === "All" ? undefined : selectedTech,
          industry: industry === "ALL" ? undefined : industry,
          hiring_only: hiringOnly,
        },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies
      .filter((c) => {
        if (hiringOnly && !c.hiring_now) return false;
        if (minRating > 0 && c.avg_rating < minRating) return false;
        if (industry !== "ALL" && c.industry !== industry) return false;
        if (selectedTech !== "All" && !c.tech_stack.some((t) => t.toLowerCase() === selectedTech.toLowerCase())) return false;
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tech_stack.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "open_jobs") return b.open_jobs_count - a.open_jobs_count;
        if (sortBy === "salary") return b.avg_salary_usd - a.avg_salary_usd;
        return b.avg_rating - a.avg_rating;
      });
  }, [companies, query, selectedTech, industry, hiringOnly, minRating, sortBy]);

  return (
    <div data-testid="companies-directory-page" className="flex-1 bg-surface-page text-typography-main min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="px-3 py-1.5 rounded-lg bg-surface-page border border-surface-border text-typography-heading text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tìm Ứng Viên (Candidates)</span>
            </Link>
            <span className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tìm Công Ty (Companies)</span>
            </span>
          </div>

          <Button
            type="button"
            data-testid="company-create-open-btn"
            onClick={() => setCreateOpen(true)}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3.5 rounded-lg gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>+ Tạo Hồ Sơ Công Ty</span>
          </Button>
        </div>

        <div data-testid="company-filter-bar" className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-3 shadow-xs text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-typography-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                data-testid="company-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm tên công ty, sản phẩm, tech stack (VD: VNG, MoMo, Golang)..."
                className="w-full bg-surface-page border border-surface-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-typography-main focus:outline-none focus:border-brand-primary"
              />
            </div>

            <select
              aria-label="Lọc theo ngành nghề"
              data-testid="company-industry-select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind === "ALL" ? "Mọi ngành nghề" : ind}</option>
              ))}
            </select>

            <select
              aria-label="Sắp xếp công ty"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating" | "open_jobs" | "salary")}
              className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main"
            >
              <option value="rating">Sắp xếp: Điểm đánh giá</option>
              <option value="open_jobs">Sắp xếp: Nhiều việc đang mở</option>
              <option value="salary">Sắp xếp: Mức lương trung bình</option>
            </select>

            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-page border border-surface-border cursor-pointer font-medium">
              <input
                type="checkbox"
                data-testid="company-hiring-only-toggle"
                checked={hiringOnly}
                onChange={(e) => setHiringOnly(e.target.checked)}
              />
              <span>Đang tuyển (Hiring Now)</span>
            </label>

            <button
              type="button"
              onClick={() => setMinRating((prev) => (prev === 4.5 ? 0 : 4.5))}
              className={`px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1 cursor-pointer ${
                minRating >= 4.5 ? "bg-brand-primary text-white border-brand-primary font-bold" : "bg-surface-page border-surface-border text-typography-heading"
              }`}
            >
              <Star className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>&gt;= 4.5 Sao</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-typography-muted mr-1">Tech Stack:</span>
            {TECH_CHIPS.map((tech) => {
              const slug = tech.toLowerCase();
              const active = selectedTech === tech;
              return (
                <button
                  key={tech}
                  type="button"
                  data-testid={`company-tech-chip-${slug}`}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                    active ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-page border-surface-border text-typography-heading hover:border-brand-primary"
                  }`}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((c) => (
            <div
              key={c.slug}
              data-testid={`company-card-${c.slug}`}
              className="p-5 rounded-xl bg-surface-card border border-surface-border shadow-xs flex flex-col justify-between space-y-3 text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-bold text-typography-main text-sm">{c.name}</h2>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    </div>
                    <div className="text-[11px] text-typography-muted flex items-center gap-2 mt-0.5">
                      <span>{c.industry}</span>
                      <span>·</span>
                      <span>{c.company_size}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                    <span>{c.avg_rating} ({c.review_count})</span>
                  </span>
                </div>

                <p className="text-typography-body line-clamp-2 leading-relaxed">{c.description}</p>

                <div className="flex items-center justify-between text-[11px] text-typography-muted">
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" /> {c.location}</span>
                  <span className="font-mono font-bold text-emerald-700">Avg: ${c.avg_salary_usd.toLocaleString("en-US")}/mo</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {c.tech_stack.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-surface-page border border-surface-border font-mono text-[10px] text-typography-heading">{t}</span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                  <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{c.open_jobs_count} vị trí đang mở</span>
                </span>
                <Link
                  href={`/companies/${encodeURIComponent(c.slug)}`}
                  data-testid={`company-card-link-${c.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-hover text-white font-semibold text-xs"
                >
                  Xem Hồ Sơ Công Ty
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CompanyCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
