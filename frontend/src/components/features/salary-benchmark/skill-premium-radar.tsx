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
    <div className="p-4 rounded bg-slate-900/90 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>🚀</span> Top Kỹ Năng Kéo Lương Tăng Vọt (+15% - +35%)
          </h4>
          <p className="text-[11px] text-slate-400">
            Các kỹ năng xuất hiện nhiều nhất trong nhóm JD trả lương P75 cho {techStack}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-800">
          Cần Bổ Sung Vào CV
        </Badge>
      </div>

      <div className="space-y-2.5">
        {skills.map((skill, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80 flex items-center justify-between hover:border-cyan-500/50 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-mono flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              <div>
                <div className="text-xs font-semibold text-slate-200">{skill.name}</div>
                <div className="text-[10px] text-slate-500">
                  Xuất hiện trong {skill.popularity_pct}% tin tuyển dụng P75
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                {skill.salary_premium}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 rounded bg-cyan-950/20 border border-cyan-800/40 text-[10px] text-cyan-300">
        💡 <strong>Mẹo Đàm Phán Lương:</strong> Bổ sung 2 trong số các kỹ năng trên vào CV trước khi nộp có thể giúp bạn tự tin deal thêm 5 - 10 triệu VNĐ/tháng.
      </div>
    </div>
  );
}
