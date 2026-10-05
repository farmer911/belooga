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
    <aside className="lg:col-span-3 border-r border-slate-800 bg-slate-950 p-4 space-y-4 overflow-y-auto text-xs">
      <div>
        <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
          <span>☰</span> Cấu Trúc Các Mục
        </h4>
        <div className="space-y-1">
          {["Thông tin liên hệ", "Tóm tắt sự nghiệp", "Kinh nghiệm làm việc", "Dự án tiêu biểu", "Kỹ năng chuyên môn", "Học vấn & Bằng cấp"].map(
            (sec, i) => (
              <div
                key={i}
                className="p-1.5 rounded bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-300 cursor-move"
              >
                <span>{sec}</span>
                <span className="text-slate-600">::</span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="border-t border-slate-800 pt-4 space-y-3">
        <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <span>⚙️</span> Tùy Biến Layout Realtime
        </h4>

        <div>
          <div className="flex justify-between text-slate-400 text-[11px] mb-1">
            <span>Cỡ chữ</span>
            <span className="text-cyan-400 font-mono">{fontSize} pt</span>
          </div>
          <input
            type="range"
            min="9.0"
            max="12.0"
            step="0.2"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 text-[11px] mb-1">
            <span>Khoảng cách dòng</span>
            <span className="text-cyan-400 font-mono">{lineHeight}</span>
          </div>
          <input
            type="range"
            min="1.15"
            max="1.50"
            step="0.05"
            value={lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 text-[11px] mb-1">
            <span>Lề trang (Margin)</span>
            <span className="text-cyan-400 font-mono">{marginSize} in</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={marginSize}
            onChange={(e) => setMarginSize(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-2">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={snapOnePage}
              onChange={(e) => setSnapOnePage(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="font-semibold text-cyan-300">Khóa khít đúng 1 trang A4</span>
          </label>
          <div className="text-[10px] text-slate-500">
            Tự động ép lề và khoảng cách dòng để đảm bảo không bị tràn sang trang thứ 2.
          </div>
        </div>
      </div>
    </aside>
  );
}
