"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, X } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";

export interface CompanyJobItem {
  id: string;
  title: string;
  salary_range: string;
  work_mode: string;
  skills: string[];
}

export interface CompanyReviewItem {
  id: string;
  author_role: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
}

export interface CompanyAlumniItem {
  username: string;
  full_name: string;
  role: string;
  verified_expert?: boolean;
}

export interface CompanyProfileItem {
  slug: string;
  name: string;
  industry: string;
  company_size: string;
  location: string;
  website: string;
  avg_rating: number;
  review_count: number;
  avg_salary_usd: number;
  open_jobs_count: number;
  hiring_now: boolean;
  description: string;
  tech_stack: string[];
  benefits: string[];
  open_jobs: CompanyJobItem[];
  reviews: CompanyReviewItem[];
  alumni: CompanyAlumniItem[];
}

const LOCAL_COMPANIES_KEY = "belooga_companies_v1";

export const DEFAULT_COMPANIES: CompanyProfileItem[] = [
  {
    slug: "vng-cloud",
    name: "VNG Cloud & AI Platform",
    industry: "AI / Cloud",
    company_size: "500-1000 nhân sự",
    location: "Ho Chi Minh",
    website: "https://vngcloud.vn",
    avg_rating: 4.8,
    review_count: 42,
    avg_salary_usd: 2800,
    open_jobs_count: 6,
    hiring_now: true,
    description: "Hạ tầng đám mây và nền tảng AI/GPU quy mô lớn phục vụ hàng chục triệu người dùng Đông Nam Á.",
    tech_stack: ["Golang", "Kubernetes", "Python", "PostgreSQL", "React"],
    benefits: ["Lương tháng 13 + Thưởng hiệu suất 3–6 tháng", "Bảo hiểm sức khỏe cao cấp PVI", "Ngân sách đào tạo Cloud/K8s $2,000/năm"],
    open_jobs: [
      { id: "vng-job-1", title: "Principal Golang & Distributed Systems Engineer", salary_range: "$2,800 - $3,800", work_mode: "Hybrid (HCMC)", skills: ["Golang", "Kubernetes", "PostgreSQL"] },
      { id: "vng-job-2", title: "Senior AI Infrastructure Engineer", salary_range: "$2,500 - $3,500", work_mode: "On-site (HCMC)", skills: ["Python", "PyTorch", "Kubernetes"] },
    ],
    reviews: [
      { id: "rev-1", author_role: "Senior Backend Engineer", rating: 5, title: "Môi trường kỹ thuật chiều sâu, bài toán tải lớn", comment: "Hệ thống microservices Golang chuẩn mực, đồng nghiệp rất giỏi.", created_at: "2026-10-15" },
    ],
    alumni: [
      { username: "phucnguyen", full_name: "Nguyễn Minh Phúc", role: "Principal Architect", verified_expert: true },
      { username: "huypham", full_name: "Phạm Gia Huy", role: "Senior Cloud Engineer" },
    ],
  },
  {
    slug: "momo-fintech",
    name: "M_Service (MoMo Fintech SuperApp)",
    industry: "Fintech",
    company_size: "1000+ nhân sự",
    location: "Ho Chi Minh / Hybrid",
    avg_rating: 4.7,
    review_count: 68,
    avg_salary_usd: 3100,
    open_jobs_count: 9,
    hiring_now: true,
    website: "https://momo.vn",
    description: "Siêu ứng dụng tài chính số hàng đầu Việt Nam xử lý hàng chục triệu giao dịch thời gian thực mỗi ngày.",
    tech_stack: ["Golang", "Python", "FastAPI", "React", "Kafka"],
    benefits: ["ESOP cho vị trí Senior/Lead", "Hybrid làm việc linh hoạt", "Khám sức khỏe toàn diện hàng năm"],
    open_jobs: [
      { id: "momo-job-1", title: "Staff Payment Core & Ledger Architect", salary_range: "$3,000 - $4,200", work_mode: "Hybrid", skills: ["Golang", "PostgreSQL", "Kafka"] },
    ],
    reviews: [
      { id: "rev-2", author_role: "Tech Lead Payment", rating: 5, title: "Bài toán Fintech chuẩn ACID & High Availability", comment: "Lương thưởng cạnh tranh top thị trường.", created_at: "2026-10-18" },
    ],
    alumni: [
      { username: "maivo", full_name: "Võ Thị Mai", role: "Staff Full-Stack Lead", verified_expert: true },
    ],
  },
  {
    slug: "shopee-vn",
    name: "Shopee & SeaMoney Engineering VN",
    industry: "E-commerce",
    company_size: "1000+ nhân sự",
    location: "Ho Chi Minh / Ha Noi",
    avg_rating: 4.6,
    review_count: 54,
    avg_salary_usd: 2950,
    open_jobs_count: 5,
    hiring_now: true,
    website: "https://careers.shopee.vn",
    description: "Trung tâm R&D thương mại điện tử và thanh toán số quy mô khu vực châu Á.",
    tech_stack: ["Golang", "React", "TypeScript", "Kubernetes", "PostgreSQL"],
    benefits: ["15 ngày phép năm", "Phụ cấp ăn trưa & thiết bị MacBook Pro M4", "Thưởng RSU theo kỳ"],
    open_jobs: [
      { id: "shopee-job-1", title: "Senior High-Concurrency Backend Engineer", salary_range: "$2,600 - $3,600", work_mode: "Hybrid", skills: ["Golang", "Redis", "PostgreSQL"] },
    ],
    reviews: [
      { id: "rev-3", author_role: "Senior Software Engineer", rating: 5, title: "Quy trình code review & kiến trúc rất bài bản", comment: "Học được rất nhiều về distributed caching.", created_at: "2026-10-12" },
    ],
    alumni: [
      { username: "phucnguyen", full_name: "Nguyễn Minh Phúc", role: "Ex-Staff Engineer", verified_expert: true },
    ],
  },
];

export function readCompanies(): CompanyProfileItem[] {
  if (typeof window === "undefined") return DEFAULT_COMPANIES;
  try {
    const raw = window.localStorage.getItem(LOCAL_COMPANIES_KEY);
    return raw ? (JSON.parse(raw) as CompanyProfileItem[]) : DEFAULT_COMPANIES;
  } catch {
    return DEFAULT_COMPANIES;
  }
}

export function writeCompanies(list: CompanyProfileItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

interface CompanyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyCreateModal({ isOpen, onClose }: CompanyCreateModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("AI / Cloud");
  const [location, setLocation] = useState("Ho Chi Minh / Remote");
  const [techText, setTechText] = useState("Golang, Python, FastAPI, React");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `company-${Date.now()}`;
      const newCompany: CompanyProfileItem = {
        slug,
        name: name.trim(),
        industry,
        company_size: "100-500 nhân sự",
        location,
        website: `https://${slug}.vn`,
        avg_rating: 4.9,
        review_count: 1,
        avg_salary_usd: 2700,
        open_jobs_count: 3,
        hiring_now: true,
        description: description.trim() || "Doanh nghiệp công nghệ xác thực trên hệ sinh thái Belooga.",
        tech_stack: techText.split(",").map((s) => s.trim()).filter(Boolean),
        benefits: ["Lương thưởng hấp dẫn theo năng lực", "Làm việc Hybrid / Remote linh hoạt"],
        open_jobs: [
          { id: `${slug}-job-1`, title: `Senior Engineer @ ${name.trim()}`, salary_range: "$2,500 - $3,400", work_mode: "Hybrid", skills: ["Golang", "React"] },
        ],
        reviews: [],
        alumni: [],
      };
      try {
        await apiClient.post("/v1/companies/", newCompany);
      } catch {
        // Fallback local save
      }
      const next = [newCompany, ...readCompanies()];
      writeCompanies(next);
      return next;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies-directory"] });
      setName("");
      setDescription("");
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div data-testid="company-create-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <h3 className="font-bold text-typography-main text-sm">Tạo Hồ Sơ Công Ty Mới Trên Belooga</h3>
          </div>
          <button type="button" onClick={onClose} className="text-typography-muted hover:text-typography-main cursor-pointer">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createMutation.mutate();
          }}
          className="space-y-3"
        >
          <input
            type="text"
            data-testid="company-create-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên công ty (VD: Zalo AI Cloud)..."
            className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Ngành nghề công ty"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main"
            >
              <option value="AI / Cloud">AI / Cloud</option>
              <option value="Fintech">Fintech</option>
              <option value="E-commerce">E-commerce</option>
              <option value="SaaS">SaaS</option>
            </select>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Địa điểm..."
              className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main"
            />
          </div>
          <input
            type="text"
            value={techText}
            onChange={(e) => setTechText(e.target.value)}
            placeholder="Tech Stack (VD: Golang, React, Kubernetes)..."
            className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Giới thiệu sứ mệnh, sản phẩm và văn hóa kỹ thuật..."
            className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-typography-muted cursor-pointer">Hủy</button>
            <Button type="submit" data-testid="company-create-submit-btn" className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-4 rounded-lg">
              Tạo Hồ Sơ Công Ty
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
