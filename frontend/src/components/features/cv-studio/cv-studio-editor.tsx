"use client";

import React from "react";
import { PenLine, Plus, Trash2 } from "lucide-react";

export interface CVProjectItem {
  name: string;
  role: string;
  tech: string;
  impact: string;
}

export interface CVData {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  headline: string;
  summary: string;
  experience: { company: string; role: string; period: string; bullets: string[] }[];
  projects?: CVProjectItem[];
  education?: { school: string; degree: string; period: string }[];
  skills: string;
  sectionOrder?: string[];
}

interface CVStudioEditorProps {
  cvData: CVData;
  onChange: (updated: CVData) => void;
  autoSaveLabel?: string;
}

export function CVStudioEditor({ cvData, onChange, autoSaveLabel }: CVStudioEditorProps) {
  const educationList = cvData.education ?? [];
  const projectList = cvData.projects ?? [];
  const inputCls = "w-full bg-surface-page border border-surface-border rounded-lg p-2 text-typography-main text-xs focus:outline-none focus:border-brand-primary focus:bg-surface-card";

  const handleBulletChange = (expIndex: number, bulletIndex: number, val: string) => {
    const nextExp = cvData.experience.map((exp, i) =>
      i === expIndex ? { ...exp, bullets: exp.bullets.map((b, bi) => (bi === bulletIndex ? val : b)) } : exp
    );
    onChange({ ...cvData, experience: nextExp });
  };

  const addBullet = (expIndex: number) => {
    const nextExp = cvData.experience.map((exp, i) =>
      i === expIndex ? { ...exp, bullets: [...exp.bullets, "Thiết kế / Triển khai hệ thống mới..."] } : exp
    );
    onChange({ ...cvData, experience: nextExp });
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const nextExp = cvData.experience.map((exp, i) =>
      i === expIndex ? { ...exp, bullets: exp.bullets.filter((_, bi) => bi !== bulletIndex) } : exp
    );
    onChange({ ...cvData, experience: nextExp });
  };

  const addExperience = () =>
    onChange({
      ...cvData,
      experience: [
        ...cvData.experience,
        { company: "Công ty mới", role: "Software Engineer", period: "2023 - Hiện tại", bullets: ["Xây dựng và tối ưu hệ thống..."] },
      ],
    });

  const removeExperience = (expIndex: number) =>
    onChange({ ...cvData, experience: cvData.experience.filter((_, i) => i !== expIndex) });

  const updateEducation = (eduIdx: number, field: "school" | "degree" | "period", value: string) => {
    const nextEdu = educationList.map((edu, i) => (i === eduIdx ? { ...edu, [field]: value } : edu));
    onChange({ ...cvData, education: nextEdu });
  };

  const addEducation = () =>
    onChange({
      ...cvData,
      education: [...educationList, { school: "Trường Đại Học", degree: "Cử nhân / Kỹ sư CNTT", period: "2018 - 2022" }],
    });

  const removeEducation = (eduIdx: number) =>
    onChange({ ...cvData, education: educationList.filter((_, i) => i !== eduIdx) });

  const updateProject = (idx: number, field: keyof CVProjectItem, value: string) =>
    onChange({ ...cvData, projects: projectList.map((p, i) => (i === idx ? { ...p, [field]: value } : p)) });

  const addProject = () =>
    onChange({
      ...cvData,
      projects: [...projectList, { name: "Dự án mới", role: "Lead Engineer", tech: "Golang, PostgreSQL", impact: "Tăng 40% hiệu năng xử lý..." }],
    });

  const removeProject = (idx: number) =>
    onChange({ ...cvData, projects: projectList.filter((_, i) => i !== idx) });

  return (
    <section className="lg:col-span-4 border-r border-surface-border bg-surface-card p-4 space-y-4 overflow-y-auto text-xs">
      <div className="flex items-center justify-between border-b border-surface-divider pb-3">
        <h4 className="font-bold text-typography-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <PenLine className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
          <span>Biên Tập Form STAR Định Lượng</span>
        </h4>
        <span data-testid="cv-autosave-status" className="text-[10px] text-brand-primary font-medium">
          {autoSaveLabel || "Đã tự động lưu nháp"}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-typography-heading mb-1 font-medium">Họ và tên</label>
          <input type="text" value={cvData.fullName} onChange={(e) => onChange({ ...cvData, fullName: e.target.value })} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-typography-heading mb-1 font-medium">Email</label>
            <input type="text" value={cvData.email} onChange={(e) => onChange({ ...cvData, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-typography-heading mb-1 font-medium">Số điện thoại</label>
            <input type="text" value={cvData.phone} onChange={(e) => onChange({ ...cvData, phone: e.target.value })} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-typography-heading mb-1 font-medium">Địa điểm</label>
            <input type="text" value={cvData.location ?? "Hồ Chí Minh, Việt Nam"} onChange={(e) => onChange({ ...cvData, location: e.target.value })} placeholder="Hồ Chí Minh, Việt Nam" className={inputCls} />
          </div>
          <div>
            <label className="block text-typography-heading mb-1 font-medium">LinkedIn / Portfolio</label>
            <input type="text" value={cvData.linkedin ?? "linkedin.com/in/belooga-talent"} onChange={(e) => onChange({ ...cvData, linkedin: e.target.value })} placeholder="linkedin.com/in/username" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-typography-heading mb-1 font-medium">Tiêu đề nghề nghiệp</label>
          <input type="text" value={cvData.headline} onChange={(e) => onChange({ ...cvData, headline: e.target.value })} className={inputCls} />
        </div>

        <div>
          <label className="block text-typography-heading mb-1 font-medium">Tóm tắt sự nghiệp (Summary)</label>
          <textarea rows={3} value={cvData.summary} onChange={(e) => onChange({ ...cvData, summary: e.target.value })} className={`${inputCls} resize-none`} />
        </div>

        {/* Work Experience Blocks */}
        <div className="border-t border-surface-divider pt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-typography-main text-[11px]">Kinh nghiệm làm việc</div>
            <button type="button" onClick={addExperience} className="text-[11px] text-brand-primary hover:text-brand-hover font-semibold inline-flex items-center gap-1 cursor-pointer">
              <Plus className="w-3 h-3" /> Thêm kinh nghiệm
            </button>
          </div>
          {cvData.experience.map((exp, expIdx) => (
            <div key={expIdx} className="p-3 bg-surface-page rounded-xl border border-surface-border space-y-2">
              <div className="grid grid-cols-3 gap-1.5 items-center">
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => {
                    const nextExp = [...cvData.experience];
                    nextExp[expIdx] = { ...nextExp[expIdx], company: e.target.value };
                    onChange({ ...cvData, experience: nextExp });
                  }}
                  className="bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-xs font-semibold"
                  placeholder="Công ty"
                />
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => {
                    const nextExp = [...cvData.experience];
                    nextExp[expIdx] = { ...nextExp[expIdx], role: e.target.value };
                    onChange({ ...cvData, experience: nextExp });
                  }}
                  className="bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-xs font-semibold"
                  placeholder="Vị trí"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={exp.period}
                    onChange={(e) => {
                      const nextExp = [...cvData.experience];
                      nextExp[expIdx] = { ...nextExp[expIdx], period: e.target.value };
                      onChange({ ...cvData, experience: nextExp });
                    }}
                    className="w-full bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-[11px]"
                    placeholder="Thời gian"
                  />
                  {cvData.experience.length > 1 && (
                    <button type="button" onClick={() => removeExperience(expIdx)} className="text-typography-muted hover:text-rose-600 p-1 cursor-pointer" title="Xóa kinh nghiệm">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-typography-muted font-medium">Các thành tựu định lượng STAR:</label>
                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex gap-1.5 items-start">
                    <span className="text-brand-primary font-bold mt-1">•</span>
                    <textarea rows={2} value={bullet} onChange={(e) => handleBulletChange(expIdx, bIdx, e.target.value)} className="flex-1 bg-surface-card border border-surface-border rounded-lg p-2 text-typography-main text-[11px] resize-none" />
                    {exp.bullets.length > 1 && (
                      <button type="button" onClick={() => removeBullet(expIdx, bIdx)} className="text-typography-muted hover:text-rose-600 mt-1 cursor-pointer" title="Xóa dòng">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addBullet(expIdx)} className="text-[11px] text-brand-primary hover:text-brand-hover font-semibold cursor-pointer">+ Thêm thành tựu</button>
              </div>
            </div>
          ))}
        </div>

        {/* Projects Blocks */}
        <div className="border-t border-surface-divider pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-typography-main text-[11px]">Dự Án Tiêu Biểu (Projects)</div>
            <button type="button" onClick={addProject} className="text-[11px] text-brand-primary hover:text-brand-hover font-semibold inline-flex items-center gap-1 cursor-pointer">
              <Plus className="w-3 h-3" /> Thêm dự án
            </button>
          </div>
          {projectList.map((proj, pIdx) => (
            <div key={pIdx} className="p-2.5 bg-surface-page rounded-xl border border-surface-border space-y-1.5">
              <div className="grid grid-cols-3 gap-1.5 items-center">
                <input type="text" value={proj.name} onChange={(e) => updateProject(pIdx, "name", e.target.value)} placeholder="Tên dự án" className="bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-[11px] font-semibold" />
                <input type="text" value={proj.role} onChange={(e) => updateProject(pIdx, "role", e.target.value)} placeholder="Vai trò" className="bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-[11px]" />
                <div className="flex items-center gap-1">
                  <input type="text" value={proj.tech} onChange={(e) => updateProject(pIdx, "tech", e.target.value)} placeholder="Công nghệ" className="w-full bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-[11px]" />
                  {projectList.length > 1 && (
                    <button type="button" onClick={() => removeProject(pIdx)} className="text-typography-muted hover:text-rose-600 p-1 cursor-pointer" title="Xóa dự án">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <input type="text" value={proj.impact} onChange={(e) => updateProject(pIdx, "impact", e.target.value)} placeholder="Tác động định lượng (STAR impact)" className="w-full bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-[11px]" />
            </div>
          ))}
        </div>

        {/* Education Blocks */}
        <div className="border-t border-surface-divider pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-typography-main text-[11px]">Học vấn & Bằng cấp</div>
            <button type="button" onClick={addEducation} className="text-[11px] text-brand-primary hover:text-brand-hover font-semibold inline-flex items-center gap-1 cursor-pointer">
              <Plus className="w-3 h-3" /> Thêm học vấn
            </button>
          </div>
          {educationList.map((edu, eduIdx) => (
            <div key={eduIdx} className="p-2 bg-surface-page rounded-xl border border-surface-border grid grid-cols-3 gap-1.5 items-center">
              <input type="text" value={edu.school} onChange={(e) => updateEducation(eduIdx, "school", e.target.value)} placeholder="Trường học" className="bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-[11px] font-semibold" />
              <input type="text" value={edu.degree} onChange={(e) => updateEducation(eduIdx, "degree", e.target.value)} placeholder="Chuyên ngành / GPA" className="bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-[11px]" />
              <div className="flex items-center gap-1">
                <input type="text" value={edu.period} onChange={(e) => updateEducation(eduIdx, "period", e.target.value)} placeholder="Niên khóa" className="w-full bg-surface-card border border-surface-border rounded-lg p-1.5 text-typography-main text-[11px]" />
                {educationList.length > 1 && (
                  <button type="button" onClick={() => removeEducation(eduIdx)} className="text-typography-muted hover:text-rose-600 p-1 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-typography-heading mb-1 font-medium">Danh mục kỹ năng</label>
          <input type="text" value={cvData.skills} onChange={(e) => onChange({ ...cvData, skills: e.target.value })} className={inputCls} />
        </div>
      </div>
    </section>
  );
}
