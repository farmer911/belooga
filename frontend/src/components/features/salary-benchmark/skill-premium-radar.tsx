"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export interface SalarySkill {
  name: string;
  salary_premium: string;
  popularity_pct: number;
}

interface SkillPremiumRadarProps {
  skills: SalarySkill[];
  techStack: string;
}

export function SkillPremiumRadar({ skills, techStack }: SkillPremiumRadarProps) {
  return (
    <div className="p-5 rounded-xl bg-white border border-surface-border space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-surface-divider pb-3">
        <div>
          <h4 className="font-bold text-typography-main text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>🚀</span> Top Kỹ Năng Kéo Lương Tăng Vọt (+15% - +35%)
          </h4>
          <p className="text-[11px] text-typography-muted mt-0.5">
            Các kỹ năng xuất hiện nhiều nhất trong nhóm JD trả lương P75 cho {techStack}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] text-brand-dark border-brand-primary/40 bg-teal-50/50">
          Cần Bổ Sung Vào CV
        </Badge>
      </div>

      <div className="space-y-2.5">
        {skills.map((skill, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-surface-page border border-surface-border flex items-center justify-between hover:border-brand-primary transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-teal-50/50 border border-teal-200 text-brand-dark text-[10px] font-mono flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              <div>
                <div className="text-xs font-semibold text-typography-main">{skill.name}</div>
                <div className="text-[10px] text-typography-muted">
                  Xuất hiện trong {skill.popularity_pct}% tin tuyển dụng P75
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                {skill.salary_premium}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 text-[11px] text-brand-dark leading-relaxed">
        💡 <strong>Mẹo Đàm Phán Lương:</strong> Bổ sung 2 trong số các kỹ năng trên vào CV trước khi nộp có thể giúp bạn tự tin deal thêm 5 - 10 triệu VNĐ/tháng.
      </div>
    </div>
  );
}
