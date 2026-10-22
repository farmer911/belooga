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
      const res = await apiClient.post<CompanyProfileItem>("/v1/companies/", {
        slug,
        name: name.trim(),
        industry,
        company_size: "100-500 nhân sự",
        location,
        website: `https://${slug}.vn`,
        description: description.trim() || "Doanh nghiệp công nghệ xác thực trên hệ sinh thái Belooga.",
        tech_stack: techText.split(",").map((s) => s.trim()).filter(Boolean),
      });
      return res.data;
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
            <Button
              type="submit"
              data-testid="company-create-submit-btn"
              disabled={createMutation.isPending}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-4 rounded-lg"
            >
              Tạo Hồ Sơ Công Ty
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
