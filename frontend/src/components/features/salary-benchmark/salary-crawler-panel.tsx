"use client";

import React from "react";
import { Database, Clock, CheckCircle2, RefreshCw, TrendingUp } from "lucide-react";

export interface CrawlerSourceMeta {
  source_name: string;
  sample_count: number;
  status?: string;
}

interface SalaryCrawlerPanelProps {
  sampleSize: number;
  lastCrawledAt: string;
  growthSince2024Pct: number;
  sources: CrawlerSourceMeta[];
  isCrawling: boolean;
  onTriggerCrawl: () => void;
}

export function SalaryCrawlerPanel({
  sampleSize,
  lastCrawledAt,
  growthSince2024Pct,
  sources,
  isCrawling,
  onTriggerCrawl,
}: SalaryCrawlerPanelProps) {
  return (
    <div
      data-testid="salary-crawler-telemetry-panel"
      className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-xs flex flex-wrap items-center justify-between gap-4"
    >
      <div className="space-y-2 flex-1 min-w-[260px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-typography-main">
            <Database className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Hệ Thống Thu Thập Lương Tự Động (Live Salary Crawler)</span>
          </span>
          <span
            data-testid="salary-growth-since-2024-badge"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold"
          >
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            <span>+{growthSince2024Pct}% từ 2024 -&gt; 2026</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {sources.map((src) => {
            const slug = src.source_name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
            return (
              <span
                key={src.source_name}
                data-testid={`crawler-source-pill-${slug}`}
                className="inline-flex items-center gap-1 bg-surface-subtle text-typography-heading border border-surface-border px-2.5 py-1 rounded-full text-[11px] font-semibold"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                <span>{src.source_name}</span>
                <span className="text-typography-muted font-mono">({src.sample_count} JD)</span>
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-typography-muted">
          <span>
            Tổng mẫu đối soát: <strong className="text-typography-main font-mono">{sampleSize.toLocaleString("en-US")} JD thực tế</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand-primary" aria-hidden="true" />
            <span>Đồng bộ gần nhất: {lastCrawledAt}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        data-testid="trigger-salary-crawl-btn"
        disabled={isCrawling}
        onClick={onTriggerCrawl}
        className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold bg-brand-primary hover:bg-brand-hover text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isCrawling ? "animate-spin" : ""}`} aria-hidden="true" />
        <span>{isCrawling ? "Đang Crawl Dữ Liệu..." : "Crawl Dữ Liệu Thị Trường Mới Nhất"}</span>
      </button>
    </div>
  );
}
