"use client";

import React from "react";

export interface CVData {
  fullName: string;
  email: string;
  phone: string;
  headline: string;
  summary: string;
  experience: {
    company: string;
    role: string;
    period: string;
    bullets: string[];
  }[];
  skills: string;
}

interface CVStudioEditorProps {
  cvData: CVData;
  onChange: (updated: CVData) => void;
}

export function CVStudioEditor({ cvData, onChange }: CVStudioEditorProps) {
  const handleBulletChange = (expIndex: number, bulletIndex: number, val: string) => {
    const nextExp = [...cvData.experience];
    nextExp[expIndex].bullets[bulletIndex] = val;
    onChange({ ...cvData, experience: nextExp });
  };

  const addBullet = (expIndex: number) => {
    const nextExp = [...cvData.experience];
    nextExp[expIndex].bullets.push("Thiết kế / Triển khai hệ thống mới...");
    onChange({ ...cvData, experience: nextExp });
  };

  return (
    <section className="lg:col-span-4 border-r border-surface-border bg-white p-4 space-y-4 overflow-y-auto text-xs">
      <div className="flex items-center justify-between border-b border-surface-divider pb-3">
        <h4 className="font-bold text-typography-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <span>✍️</span> Biên Tập Form STAR Định Lượng
        </h4>
        <span className="text-[10px] text-brand-primary font-medium">Tự động lưu nháp</span>
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="block text-typography-heading mb-1 font-medium">Họ và tên</label>
          <input
            type="text"
            value={cvData.fullName}
            onChange={(e) => onChange({ ...cvData, fullName: e.target.value })}
            className="w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-typography-main text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-typography-heading mb-1 font-medium">Email</label>
            <input
              type="text"
              value={cvData.email}
              onChange={(e) => onChange({ ...cvData, email: e.target.value })}
              className="w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-typography-main text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <div>
            <label className="block text-typography-heading mb-1 font-medium">Số điện thoại</label>
            <input
              type="text"
              value={cvData.phone}
              onChange={(e) => onChange({ ...cvData, phone: e.target.value })}
              className="w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-typography-main text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-typography-heading mb-1 font-medium">Tiêu đề nghề nghiệp</label>
          <input
            type="text"
            value={cvData.headline}
            onChange={(e) => onChange({ ...cvData, headline: e.target.value })}
            className="w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-typography-main text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <div>
          <label className="block text-typography-heading mb-1 font-medium">Tóm tắt sự nghiệp (Summary)</label>
          <textarea
            rows={3}
            value={cvData.summary}
            onChange={(e) => onChange({ ...cvData, summary: e.target.value })}
            className="w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-typography-main text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary resize-none"
          />
        </div>

        {/* Work Experience Blocks */}
        <div className="border-t border-surface-divider pt-3.5 space-y-3">
          <div className="font-bold text-typography-main text-[11px]">Kinh nghiệm làm việc</div>
          {cvData.experience.map((exp, expIdx) => (
            <div key={expIdx} className="p-3.5 bg-surface-page rounded-xl border border-surface-border space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => {
                    const nextExp = [...cvData.experience];
                    nextExp[expIdx].company = e.target.value;
                    onChange({ ...cvData, experience: nextExp });
                  }}
                  className="bg-white border border-surface-border rounded-lg p-2 text-typography-main text-xs font-semibold focus:outline-none focus:border-brand-primary"
                  placeholder="Công ty"
                />
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => {
                    const nextExp = [...cvData.experience];
                    nextExp[expIdx].role = e.target.value;
                    onChange({ ...cvData, experience: nextExp });
                  }}
                  className="bg-white border border-surface-border rounded-lg p-2 text-typography-main text-xs font-semibold focus:outline-none focus:border-brand-primary"
                  placeholder="Vị trí"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-typography-muted font-medium">Các thành tựu định lượng STAR:</label>
                {exp.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex gap-2 items-start">
                    <span className="text-brand-primary font-bold mt-1">•</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) => handleBulletChange(expIdx, bIdx, e.target.value)}
                      className="flex-1 bg-white border border-surface-border rounded-lg p-2 text-typography-main text-[11px] focus:outline-none focus:border-brand-primary resize-none"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBullet(expIdx)}
                  className="text-[11px] text-brand-primary hover:text-brand-hover font-semibold cursor-pointer"
                >
                  + Thêm thành tựu
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-typography-heading mb-1 font-medium">Danh mục kỹ năng</label>
          <input
            type="text"
            value={cvData.skills}
            onChange={(e) => onChange({ ...cvData, skills: e.target.value })}
            className="w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-typography-main text-xs focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>
    </section>
  );
}
