"use client";

import React from "react";

interface CVStudioSidebarProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (lh: number) => void;
  marginSize: number;
  setMarginSize: (m: number) => void;
  snapOnePage: boolean;
  setSnapOnePage: (snap: boolean) => void;
}

export function CVStudioSidebar({
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  marginSize,
  setMarginSize,
  snapOnePage,
  setSnapOnePage,
}: CVStudioSidebarProps) {
  return (
    <aside className="lg:col-span-3 border-r border-surface-border bg-white p-4 space-y-4 overflow-y-auto text-xs">
      <div>
        <h4 className="font-bold text-typography-main uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
          <span>☰</span> Cấu Trúc Các Mục
        </h4>
        <div className="space-y-1">
          {["Thông tin liên hệ", "Tóm tắt sự nghiệp", "Kinh nghiệm làm việc", "Dự án tiêu biểu", "Kỹ năng chuyên môn", "Học vấn & Bằng cấp"].map(
            (sec, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-surface-page border border-surface-border hover:border-brand-primary flex items-center justify-between text-typography-heading cursor-move transition-colors"
              >
                <span>{sec}</span>
                <span className="text-typography-muted">::</span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="border-t border-surface-divider pt-4 space-y-3.5">
        <h4 className="font-bold text-typography-main uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <span>⚙️</span> Tùy Biến Layout Realtime
        </h4>

        <div>
          <div className="flex justify-between text-typography-heading text-[11px] mb-1 font-medium">
            <span>Cỡ chữ</span>
            <span className="text-brand-primary font-mono font-bold">{fontSize} pt</span>
          </div>
          <input
            type="range"
            min="9.0"
            max="12.0"
            step="0.2"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-brand-primary cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-typography-heading text-[11px] mb-1 font-medium">
            <span>Khoảng cách dòng</span>
            <span className="text-brand-primary font-mono font-bold">{lineHeight}</span>
          </div>
          <input
            type="range"
            min="1.15"
            max="1.50"
            step="0.05"
            value={lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
            className="w-full accent-brand-primary cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-typography-heading text-[11px] mb-1 font-medium">
            <span>Lề trang (Margin)</span>
            <span className="text-brand-primary font-mono font-bold">{marginSize} in</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={marginSize}
            onChange={(e) => setMarginSize(Number(e.target.value))}
            className="w-full accent-brand-primary cursor-pointer"
          />
        </div>

        <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2">
          <label className="flex items-center gap-2 text-brand-dark cursor-pointer">
            <input
              type="checkbox"
              checked={snapOnePage}
              onChange={(e) => setSnapOnePage(e.target.checked)}
              className="accent-brand-primary rounded"
            />
            <span className="font-bold text-brand-dark">Khóa khít đúng 1 trang A4</span>
          </label>
          <div className="text-[10px] text-typography-heading leading-relaxed">
            Tự động ép lề và khoảng cách dòng để đảm bảo không bị tràn sang trang thứ 2.
          </div>
        </div>
      </div>
    </aside>
  );
}
