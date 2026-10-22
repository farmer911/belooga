"use client";

import React, { useState } from "react";
import { Building2, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface CareerJobItem {
  id: string;
  title: string;
  company_name?: string;
  department: string;
  location: string;
  salary_range?: string;
  skills?: string[];
  is_partner?: boolean;
  description: string;
}

interface PostCareerModalProps {
  open: boolean;
  onClose: () => void;
  onCreateJob: (job: Omit<CareerJobItem, "id">) => Promise<void>;
  isSubmitting: boolean;
}

export function PostCareerModal({ open, onClose, onCreateJob, isSubmitting }: PostCareerModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Ho Chi Minh City / Hybrid");
  const [salaryRange, setSalaryRange] = useState("50M - 80M VNĐ");
  const [skillsText, setSkillsText] = useState("Golang, PostgreSQL, Docker, React");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !title.trim() || !description.trim()) return;
    const skills = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
    await onCreateJob({
      company_name: companyName.trim(),
      title: title.trim(),
      department: department.trim() || "Engineering",
      location: location.trim() || "Remote",
      salary_range: salaryRange.trim() || "Negotiable",
      skills,
      is_partner: true,
      description: description.trim(),
    });
    setCompanyName("");
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-typography-main flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-primary" />
            <span>Đăng Tin Tuyển Dụng Cho Công Ty Của Bạn</span>
          </DialogTitle>
          <DialogDescription>
            Đăng vị trí tuyển dụng của công ty bạn lên mạng lưới nhân tài Belooga và nhận hồ sơ kèm Video Pitch 30s.
          </DialogDescription>
        </DialogHeader>

        <form data-testid="post-career-form" onSubmit={handleSubmit} className="space-y-3 text-xs mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-typography-heading mb-1">Tên công ty *</label>
              <input
                type="text"
                required
                data-testid="career-input-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="VD: Shopee, Momo, الف Tech..."
                className="w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-typography-main"
              />
            </div>
            <div>
              <label className="block font-semibold text-typography-heading mb-1">Vị trí tuyển dụng *</label>
              <input
                type="text"
                required
                data-testid="career-input-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Senior Backend Engineer"
                className="w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-typography-main"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-typography-heading mb-1">Phòng ban</label>
              <input type="text" data-testid="career-input-department" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-typography-main" />
            </div>
            <div>
              <label className="block font-semibold text-typography-heading mb-1">Địa điểm</label>
              <input type="text" data-testid="career-input-location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-typography-main" />
            </div>
            <div>
              <label className="block font-semibold text-typography-heading mb-1">Mức đãi ngộ</label>
              <input type="text" data-testid="career-input-salary" value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} className="w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-typography-main" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-typography-heading mb-1">Kỹ năng yêu cầu (cách nhau dấu phẩy)</label>
            <input type="text" data-testid="career-input-skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-typography-main" />
          </div>

          <div>
            <label className="block font-semibold text-typography-heading mb-1">Mô tả công việc (JD) *</label>
            <textarea
              rows={4}
              required
              data-testid="career-input-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả trách nhiệm, yêu cầu kỹ thuật và quyền lợi..."
              className="w-full rounded-lg border border-surface-border bg-surface-page p-3 text-typography-main"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" data-testid="career-submit-post-btn" disabled={isSubmitting} className="bg-brand-primary hover:bg-brand-hover text-white gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? "Đang đăng..." : "Đăng Tin Tuyển Dụng"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
