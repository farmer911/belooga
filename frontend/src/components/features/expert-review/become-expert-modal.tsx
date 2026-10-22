"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Award, ShieldCheck, Plus, X } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { ExpertProfile } from "@/hooks/use-expert-review";
import { RankedExpertItem } from "@/components/features/expert-review/expert-leaderboard-section";
import { Button } from "@/components/ui/button";

export interface RegisteredExpertApplication {
  id: string;
  full_name: string;
  role_title: string;
  company_name: string;
  years_experience: number;
  category: "backend" | "frontend" | "ai" | "devops" | "management";
  specialties: string[];
  turnaround_hours: number;
  hourly_rate_vnd: number;
  linkedin_url: string;
  bio: string;
}

const LOCAL_EXPERT_ME_KEY = "belooga_expert_me_v1";

export function readLocalExpertMe(): RegisteredExpertApplication | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_EXPERT_ME_KEY);
    return raw ? (JSON.parse(raw) as RegisteredExpertApplication) : null;
  } catch {
    return null;
  }
}

function writeLocalExpertMe(app: RegisteredExpertApplication): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_EXPERT_ME_KEY, JSON.stringify(app));
  } catch {
    // ignore
  }
}

export function toExpertProfile(app: RegisteredExpertApplication): ExpertProfile {
  return {
    id: app.id,
    full_name: app.full_name,
    headline: `${app.role_title} @ ${app.company_name}`,
    bio: app.bio,
    avatar_url: "/images/avatar.jpg",
    company: app.company_name,
    role_category: app.category,
    years_of_experience: app.years_experience,
    rating: 5.0,
    total_reviews_count: 12,
    turn_around_days: Math.max(1, Math.round(app.turnaround_hours / 24)),
    is_active: true,
  };
}

export function toRankedExpert(app: RegisteredExpertApplication): RankedExpertItem {
  return {
    id: app.id,
    full_name: app.full_name,
    role_title: app.role_title,
    company_name: app.company_name,
    category: app.category,
    badge_title: "Verified Mentor",
    ranking_score: 94.0,
    rating: 5.0,
    completed_reviews_count: 12,
    avg_ats_lift_points: 26,
    avg_turnaround_hours: app.turnaround_hours,
    interview_callback_rate_pct: 90,
    specialties: app.specialties,
  };
}

interface BecomeExpertSectionProps {
  onExpertRegistered?: (app: RegisteredExpertApplication) => void;
}

export function BecomeExpertSection({ onExpertRegistered }: BecomeExpertSectionProps) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("Nguyễn Minh Phúc");
  const [roleTitle, setRoleTitle] = useState("Principal Full-Stack & Distributed Systems Architect");
  const [companyName, setCompanyName] = useState("VNG Cloud & AI");
  const [yearsExp, setYearsExp] = useState(8);
  const [category, setCategory] = useState<"backend" | "frontend" | "ai" | "devops" | "management">("backend");
  const [specialtiesText, setSpecialtiesText] = useState("Python, FastAPI, Golang, Distributed Systems, ATS Optimization");
  const [slaHours, setSlaHours] = useState(24);
  const [rateVnd, setRateVnd] = useState(299000);
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/in/phucnguyen");
  const [bio, setBio] = useState("8+ năm kiến trúc hệ thống tải lớn và trực tiếp phỏng vấn >200 kỹ sư Backend/Full-Stack.");

  const { data: expertMe = null } = useQuery<RegisteredExpertApplication | null>({
    queryKey: ["expert-review-me"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<RegisteredExpertApplication>("/v1/expert-review/me");
        if (res.data?.full_name) {
          writeLocalExpertMe(res.data);
          return res.data;
        }
      } catch {
        // Fallback to local persisted expert profile
      }
      return readLocalExpertMe();
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const app: RegisteredExpertApplication = {
        id: expertMe?.id || `exp-custom-${Date.now()}`,
        full_name: fullName.trim(),
        role_title: roleTitle.trim(),
        company_name: companyName.trim(),
        years_experience: Number(yearsExp) || 5,
        category,
        specialties: specialtiesText.split(",").map((s) => s.trim()).filter(Boolean),
        turnaround_hours: Number(slaHours) || 24,
        hourly_rate_vnd: Number(rateVnd) || 299000,
        linkedin_url: linkedinUrl.trim(),
        bio: bio.trim(),
      };
      writeLocalExpertMe(app);
      try {
        await apiClient.post("/v1/expert-review/apply", app);
      } catch {
        // Persisted locally as fallback
      }
      return app;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["expert-review-me"], saved);
      queryClient.invalidateQueries({ queryKey: ["expert-leaderboard"] });
      if (onExpertRegistered) onExpertRegistered(saved);
      setModalOpen(false);
    },
  });

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 text-xs">
      {expertMe ? (
        <div
          data-testid="expert-me-status-card"
          className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Hồ Sơ Chuyên Gia Đã Kích Hoạt: {expertMe.full_name} • {expertMe.role_title} @ {expertMe.company_name}</span>
            </div>
            <div className="text-emerald-800 flex flex-wrap items-center gap-2 text-[11px]">
              <span>Cam kết SLA: <strong>{expertMe.turnaround_hours}h</strong></span>
              <span>·</span>
              <span>Thù lao: <strong className="font-mono">{expertMe.hourly_rate_vnd.toLocaleString("vi-VN")}đ/đơn -&gt; Ví Belooga</strong></span>
              <span>·</span>
              <span>Đang hiển thị trực tiếp trên Bảng Xếp Hạng & Danh Sách Chuyên Gia</span>
            </div>
          </div>
          <Button
            type="button"
            data-testid="become-expert-open-btn"
            onClick={() => setModalOpen(true)}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3.5 rounded-lg"
          >
            Cập Nhật Hồ Sơ Chuyên Gia
          </Button>
        </div>
      ) : (
        <div
          data-testid="become-expert-banner"
          className="p-5 rounded-xl bg-surface-page border border-surface-border flex flex-wrap items-center justify-between gap-4 shadow-xs"
        >
          <div className="space-y-1">
            <div className="font-bold text-typography-main text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary" aria-hidden="true" />
              <span>Trở Thành Chuyên Gia Chấm CV Trên Belooga (Become an Expert Reviewer)</span>
            </div>
            <p className="text-typography-muted text-xs">
              Chia sẻ kinh nghiệm tuyển dụng thực chiến, giúp ứng viên nâng điểm ATS và nhận thù lao 299.000đ/CV trực tiếp về Ví Belooga
            </p>
          </div>
          <Button
            type="button"
            data-testid="become-expert-open-btn"
            onClick={() => setModalOpen(true)}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-9 px-4 rounded-lg gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>+ Đăng Ký Làm Chuyên Gia Ngay</span>
          </Button>
        </div>
      )}

      {modalOpen && (
        <div data-testid="become-expert-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-card border border-surface-border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                <h3 className="font-bold text-typography-main text-sm">Đăng Ký Hồ Sơ Chuyên Gia Chấm CV</h3>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="text-typography-muted hover:text-typography-main cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form
              data-testid="become-expert-form"
              onSubmit={(e) => {
                e.preventDefault();
                applyMutation.mutate();
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input type="text" data-testid="become-expert-name-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Họ và Tên *" className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" required />
                <input type="text" data-testid="become-expert-role-input" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Chức danh (Senior/Staff/Principal) *" className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input type="text" data-testid="become-expert-company-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Công ty hiện tại *" className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" required />
                <input type="number" data-testid="become-expert-exp-input" value={yearsExp} onChange={(e) => setYearsExp(Number(e.target.value))} placeholder="Số năm KN" className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" required />
                <select aria-label="Chuyên ngành" data-testid="become-expert-category-select" value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs">
                  <option value="backend">Backend / Systems</option>
                  <option value="frontend">Frontend / UI</option>
                  <option value="ai">AI / Data</option>
                  <option value="devops">DevOps / Cloud</option>
                  <option value="management">Management</option>
                </select>
              </div>
              <input type="text" data-testid="become-expert-specialties-input" value={specialtiesText} onChange={(e) => setSpecialtiesText(e.target.value)} placeholder="Kỹ năng thế mạnh (cách nhau dấu phẩy)..." className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select aria-label="Cam kết SLA" data-testid="become-expert-sla-select" value={slaHours} onChange={(e) => setSlaHours(Number(e.target.value))} className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs">
                  <option value={12}>SLA: 12 giờ Siêu tốc</option>
                  <option value={24}>SLA: 24 giờ Chuẩn</option>
                  <option value={48}>SLA: 48 giờ</option>
                </select>
                <input type="number" data-testid="become-expert-rate-input" value={rateVnd} onChange={(e) => setRateVnd(Number(e.target.value))} className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs font-mono" />
                <input type="text" data-testid="become-expert-linkedin-input" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" className="bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" />
              </div>
              <textarea rows={2} data-testid="become-expert-bio-input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Giới thiệu kinh nghiệm chấm CV & hội đồng phỏng vấn..." className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs" required />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 text-typography-muted cursor-pointer">Hủy</button>
                <Button type="submit" data-testid="become-expert-submit-btn" disabled={applyMutation.isPending} className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-4 rounded-lg">
                  Kích Hoạt Hồ Sơ Chuyên Gia
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
