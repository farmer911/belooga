"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ToolItem {
  name: string;
  desc: string;
  href: string;
  icon: string;
  badge?: string;
}

const TOOLS: ToolItem[] = [
  {
    name: "ATS Diagnostics",
    desc: "Chẩn đoán điểm số & so khớp JD chuẩn ATS",
    href: "/ats-diagnostics",
    icon: "🎯",
    badge: "Hot",
  },
  {
    name: "Tra Cứu Lương IT",
    desc: "Báo cáo lương & kỹ năng giá trị cao 2026",
    href: "/salary-benchmark",
    icon: "💵",
  },
  {
    name: "Pro CV Studio",
    desc: "Trình soạn thảo CV chuẩn Vector A4",
    href: "/cv-studio",
    icon: "📄",
    badge: "Mới",
  },
  {
    name: "Job Tracker",
    desc: "Bảng Kanban theo dõi ứng tuyển việc làm",
    href: "/workspace/jobs",
    icon: "💼",
  },
  {
    name: "Executive Analytics",
    desc: "Bảng điều khiển tài chính & doanh thu",
    href: "/admin/analytics",
    icon: "📊",
  },
];

export function EcosystemMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isCurrentActive = TOOLS.some((t) => pathname.startsWith(t.href));

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer ${
          isCurrentActive || isOpen
            ? "text-brand-primary"
            : "text-typography-heading hover:text-brand-primary"
        }`}
        aria-expanded={isOpen}
      >
        <span>Công Cụ</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-xl bg-surface-card border border-surface-border shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-typography-muted uppercase tracking-wider border-b border-surface-divider mb-1">
            Belooga Ecosystem
          </div>
          <div className="space-y-0.5">
            {TOOLS.map((tool) => {
              const active = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                    active
                      ? "bg-brand-overlay/40 text-brand-dark"
                      : "hover:bg-surface-page text-typography-main"
                  }`}
                >
                  <span className="text-base select-none mt-0.5">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">
                        {tool.name}
                      </span>
                      {tool.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-primary/15 text-brand-dark">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-typography-muted line-clamp-1 mt-0.5">
                      {tool.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
