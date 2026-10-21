"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SampleFeedbackReport() {
  const [activeTab, setActiveTab] = useState<"comparison" | "checklist">("comparison");

  return (
    <section className="py-16 bg-surface-subtle border-b border-surface-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="teal" className="mb-2">
            Real Sample Preview
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-typography-main">
            What Your Review Report Looks Like
          </h2>
          <p className="mt-2 text-sm text-typography-body">
            Every candidate receives an in-depth rubric scoring, actionable line-by-line rewrites, and senior engineer insights.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto border border-surface-border bg-surface-card shadow-sm overflow-hidden">
          {/* Header Score Overview */}
          <CardHeader className="bg-surface-page border-b border-surface-border p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-xs">
                    Sample Report
                  </Badge>
                  <span className="text-xs text-typography-muted">Evaluated for Senior Fullstack Engineer</span>
                </div>
                <h3 className="text-xl font-bold text-typography-main mt-1.5">
                  CV Health Score: 88 / 100
                </h3>
                <p className="text-xs text-typography-heading mt-1 max-w-lg">
                  "Strong technical fundamentals, but previous work experiences bury the lead. Quantifying system impact will instantly elevate callback rates."
                </p>
              </div>

              {/* Score Badges */}
              <div className="flex items-center gap-3">
                <div className="text-center bg-surface-card p-3 rounded-lg border border-surface-border shadow-2xs">
                  <div className="text-xl font-extrabold text-brand-primary">94%</div>
                  <div className="text-[10px] text-typography-body uppercase font-semibold">ATS Score</div>
                </div>
                <div className="text-center bg-surface-card p-3 rounded-lg border border-surface-border shadow-2xs">
                  <div className="text-xl font-extrabold text-brand-dark">86%</div>
                  <div className="text-[10px] text-typography-body uppercase font-semibold">Impact</div>
                </div>
                <div className="text-center bg-surface-card p-3 rounded-lg border border-surface-border shadow-2xs">
                  <div className="text-xl font-extrabold text-amber-600">84%</div>
                  <div className="text-[10px] text-typography-body uppercase font-semibold">Brevity</div>
                </div>
              </div>
            </div>

            {/* Toggle Tabs */}
            <div className="flex gap-2 mt-6 border-t border-surface-border pt-4">
              <button
                onClick={() => setActiveTab("comparison")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === "comparison"
                    ? "bg-brand-primary text-white"
                    : "bg-surface-card text-typography-heading border border-surface-border"
                }`}
              >
                Line-by-Line Rewrites (Before vs. After)
              </button>
              <button
                onClick={() => setActiveTab("checklist")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === "checklist"
                    ? "bg-brand-primary text-white"
                    : "bg-surface-card text-typography-heading border border-surface-border"
                }`}
              >
                Strengths & Action Items
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            {activeTab === "comparison" ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-surface-border p-4 bg-surface-subtle">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Original Bullet (Weak)
                    </span>
                  </div>
                  <p className="text-sm text-typography-muted italic line-through">
                    "Responsible for developing backend APIs and working with database tables for our web application."
                  </p>

                  <div className="flex items-center gap-2 my-3">
                    <ArrowRight className="h-4 w-4 text-brand-primary" />
                    <span className="text-xs font-bold text-brand-dark bg-brand-overlay px-2 py-0.5 rounded border border-brand-overlay">
                      Expert Rewrite (High-Impact XYZ Formula)
                    </span>
                  </div>
                  <p className="text-sm font-medium text-typography-main bg-surface-card p-3 rounded border border-brand-primary/40 shadow-xs">
                    "Architected 14 async FastAPI endpoints in PostgreSQL, reducing query latency by 34% across 1.2M daily active requests."
                  </p>
                  <p className="text-xs text-brand-primary mt-2 font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" /> Reviewer Note: Replaced passive duty phrasing with strong action verb + quantified performance gain.
                  </p>
                </div>

                <div className="rounded-lg border border-surface-border p-4 bg-surface-subtle">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Original Bullet (Vague)
                    </span>
                  </div>
                  <p className="text-sm text-typography-muted italic line-through">
                    "Helped the frontend team refactor UI components and improve web page speed."
                  </p>

                  <div className="flex items-center gap-2 my-3">
                    <ArrowRight className="h-4 w-4 text-brand-primary" />
                    <span className="text-xs font-bold text-brand-dark bg-brand-overlay px-2 py-0.5 rounded border border-brand-overlay">
                      Expert Rewrite (High-Impact XYZ Formula)
                    </span>
                  </div>
                  <p className="text-sm font-medium text-typography-main bg-surface-card p-3 rounded border border-brand-primary/40 shadow-xs">
                    "Modularized monolithic React codebase into Atomic Design primitives, cutting initial JS bundle by 42% and accelerating CI build times by 3x."
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-typography-main flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Key Strengths Highlighted
                  </h4>
                  <ul className="space-y-2 text-xs text-typography-heading">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      Excellent clear timeline chronology without gaps.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      High keyword density for Modern TypeScript & Python frameworks.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      Clean single-column layout passes all modern ATS parsers.
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-typography-main flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Priority Action Items
                  </h4>
                  <ul className="space-y-2 text-xs text-typography-heading">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      Shift from list of daily tasks to measurable business achievements.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      Shorten summary header to 3 concise lines focusing on target role.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      Remove obsolete 2018 libraries to declutter skills section.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
