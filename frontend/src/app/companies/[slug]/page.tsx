"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Star, MapPin, ShieldCheck, Briefcase, CheckCircle2, Users, Plus } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import {
  CompanyProfileItem,
  CompanyReviewItem,
  DEFAULT_COMPANIES,
  readCompanies,
  writeCompanies,
} from "@/components/features/companies/company-data";
import { RecruiterAnalyticsPanel } from "@/components/features/analytics/multi-persona-analytics";
import { CompanyGrowthSuite } from "@/components/features/growth/community-company-suite";

export default function CompanyProfileDetailPage() {
  const params = useParams();
  const slug = String(params.slug || "vng-cloud").toLowerCase();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "reviews" | "alumni">("overview");
  const [following, setFollowing] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revTitle, setRevTitle] = useState("");
  const [revComment, setRevComment] = useState("");
  const [revRating, setRevRating] = useState(5);

  const { data: company } = useQuery<CompanyProfileItem>({
    queryKey: ["company-profile", slug],
    queryFn: async () => {
      try {
        const res = await apiClient.get<CompanyProfileItem>(`/v1/companies/${slug}`);
        if (res.data?.name) return res.data;
      } catch {
        // Fallback to local persisted company directory
      }
      const list = readCompanies();
      return list.find((c) => c.slug === slug) ?? DEFAULT_COMPANIES[0];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const newRev: CompanyReviewItem = {
        id: `rev-${Date.now()}`,
        author_role: "Verified Belooga Engineer",
        rating: revRating,
        title: revTitle.trim() || "Môi trường kỹ thuật chất lượng",
        comment: revComment.trim(),
        created_at: "Vừa xong",
      };
      try {
        await apiClient.post(`/v1/companies/${slug}/reviews`, newRev);
      } catch {
        // Fallback local save
      }
      const all = readCompanies().map((c) =>
        c.slug === slug ? { ...c, review_count: c.review_count + 1, reviews: [newRev, ...c.reviews] } : c
      );
      writeCompanies(all);
      return all.find((c) => c.slug === slug);
    },
    onSuccess: (updated) => {
      if (updated) queryClient.setQueryData(["company-profile", slug], updated);
      setRevTitle("");
      setRevComment("");
      setShowReviewForm(false);
      setActiveTab("reviews");
    },
  });

  if (!company) return null;

  return (
    <div data-testid="company-profile-page" className="flex-1 bg-surface-page text-typography-main min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 text-xs">
        <div data-testid="company-profile-header" className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-brand-primary" aria-hidden="true" />
              <h1 className="text-lg font-bold text-typography-main">{company.name}</h1>
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-typography-muted">
              <span>{company.industry}</span><span>·</span><span>{company.company_size}</span><span>·</span>
              <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {company.location}</span><span>·</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> {company.avg_rating} ({company.review_count} đánh giá)
              </span><span>·</span>
              <span className="font-mono font-bold text-emerald-700">Avg: ${company.avg_salary_usd.toLocaleString("en-US")}/mo</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" data-testid="company-follow-btn" onClick={() => setFollowing((p) => !p)} className={`px-3.5 py-1.5 rounded-lg border font-semibold cursor-pointer ${following ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-surface-page border-surface-border text-typography-heading"}`}>
              {following ? "✓ Đang Theo Dõi" : "+ Theo Dõi Công Ty"}
            </button>
            <Button type="button" data-testid="company-review-open-btn" onClick={() => setShowReviewForm((p) => !p)} className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3.5 rounded-lg gap-1">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /><span>Viết Đánh Giá</span>
            </Button>
          </div>
        </div>

        {showReviewForm && (
          <form onSubmit={(e) => { e.preventDefault(); reviewMutation.mutate(); }} className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input type="text" value={revTitle} onChange={(e) => setRevTitle(e.target.value)} placeholder="Tiêu đề đánh giá..." className="sm:col-span-3 bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" required />
              <select aria-label="Điểm đánh giá sao" value={revRating} onChange={(e) => setRevRating(Number(e.target.value))} className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs">
                <option value={5}>5 Sao — Tuyệt vời</option><option value={4}>4 Sao — Tốt</option><option value={3}>3 Sao — Khá</option>
              </select>
            </div>
            <textarea rows={2} value={revComment} onChange={(e) => setRevComment(e.target.value)} placeholder="Chia sẻ trải nghiệm làm việc, lương thưởng và văn hóa kỹ thuật..." className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" required />
            <Button type="submit" data-testid="company-review-submit-btn" className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-4 rounded-lg">Gửi Đánh Giá Xác Thực</Button>
          </form>
        )}

        <div data-testid="company-profile-tabs" className="flex flex-wrap gap-2 border-b border-surface-border pb-2">
          <button type="button" data-testid="company-tab-overview" onClick={() => setActiveTab("overview")} className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${activeTab === "overview" ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading"}`}>1. Giới Thiệu & Tech Stack</button>
          <button type="button" data-testid="company-tab-jobs" onClick={() => setActiveTab("jobs")} className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${activeTab === "jobs" ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading"}`}>2. Vị Trí Đang Tuyển ({company.open_jobs.length})</button>
          <button type="button" data-testid="company-tab-reviews" onClick={() => setActiveTab("reviews")} className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${activeTab === "reviews" ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading"}`}>3. Lương & Đánh Giá ({company.reviews.length})</button>
          <button type="button" data-testid="company-tab-alumni" onClick={() => setActiveTab("alumni")} className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${activeTab === "alumni" ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading"}`}>4. Nhân Sự & Chuyên Gia ({company.alumni.length})</button>
        </div>

        {activeTab === "overview" && (
          <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-4">
            <p className="text-sm text-typography-body leading-relaxed">{company.description}</p>
            <RecruiterAnalyticsPanel />
            <CompanyGrowthSuite slug={slug} companyName={company.name} />
            <div className="space-y-1.5">
              <div className="font-bold text-typography-main">Tech Stack Chủ Lực:</div>
              <div className="flex flex-wrap gap-1.5">
                {company.tech_stack.map((t) => <span key={t} className="px-2.5 py-1 rounded-md bg-surface-page border border-surface-border font-mono font-semibold">{t}</span>)}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-typography-main">Phúc Lợi & Văn Hóa Kỹ Thuật:</div>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {company.benefits.map((b) => (
                  <li key={b} className="p-3 rounded-lg bg-surface-page border border-surface-border flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" /><span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-3">
            {company.open_jobs.map((job) => {
              const applied = appliedJobIds.includes(job.id);
              return (
                <div key={job.id} className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-typography-main flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-brand-primary" aria-hidden="true" /><span>{job.title}</span>
                    </div>
                    <div className="text-typography-muted mt-0.5">{job.work_mode} · Lương: <strong className="font-mono text-emerald-700">{job.salary_range}</strong></div>
                  </div>
                  <Button type="button" data-testid={`company-job-apply-btn-${job.id}`} disabled={applied} onClick={() => setAppliedJobIds((prev) => [...prev, job.id])} className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-4 rounded-lg">
                    {applied ? "✓ Đã Ứng Tuyển & Lưu Kanban" : "1-Click Apply Ngay"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3">
            {company.reviews.map((rev) => (
              <div key={rev.id} data-testid={`company-review-card-${rev.id}`} className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-typography-main">{rev.title}</span>
                  <span className="font-bold text-amber-600">{rev.rating}/5 Sao</span>
                </div>
                <p className="text-typography-body">{rev.comment}</p>
                <div className="text-[11px] text-typography-muted">{rev.author_role} · {rev.created_at}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "alumni" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {company.alumni.map((al) => (
              <div key={al.username} data-testid={`company-alumni-card-${al.username}`} className="p-4 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                  <div>
                    <div className="font-bold text-typography-main">{al.full_name}</div>
                    <div className="text-typography-muted">{al.role}</div>
                  </div>
                </div>
                <Link href={`/public/${encodeURIComponent(al.username)}`} className="text-brand-primary font-semibold underline">Xem Hồ Sơ</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
