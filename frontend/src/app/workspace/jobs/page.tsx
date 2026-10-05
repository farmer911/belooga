"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useJobTracker, KanbanStatus } from "@/hooks/use-job-tracker";
import { KanbanColumn } from "@/components/features/job-tracker/kanban-column";
import { AddJobDialog } from "@/components/features/job-tracker/add-job-dialog";

export default function JobTrackerKanbanPage() {
  const { jobs, isLoading, error, addJob, moveStatus, deleteJob } = useJobTracker();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = jobs.filter(
    (j) =>
      j.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.position_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getJobsByStatus = (status: KanbanStatus) =>
    filteredJobs.filter((j) => j.status === status);

  const interviewCount = jobs.filter((j) => j.status === "INTERVIEW").length;
  const offerCount = jobs.filter((j) => j.status === "OFFER").length;

  return (
    <div className="min-h-screen bg-surface-page text-typography-main flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-dark">
      <Header />

      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-surface-border bg-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-primary">Belooga Workspace</span>
          <span className="text-surface-border">/</span>
          <span className="text-typography-heading font-medium">Job Application Tracker (Kanban)</span>
          <Badge variant="outline" className="text-[10px] uppercase text-brand-dark border-brand-primary/40 bg-teal-50/50">
            {jobs.length} Cơ hội đang theo dõi
          </Badge>
        </div>

        {/* Search & Quick Stats */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc công ty hoặc vị trí..."
            className="bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main focus:outline-none focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary w-48"
          />

          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium">
              💼 {interviewCount} Phỏng vấn
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
              🏆 {offerCount} Offer
            </span>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-3.5 h-8 rounded-lg shadow-xs flex items-center gap-1"
          >
            <span>➕</span> Thêm Công Việc
          </Button>
        </div>
      </div>

      {/* Main Kanban Board (Horizontal Scroll Zero Dead-Space) */}
      <main className="flex-1 p-4 overflow-x-auto flex gap-3.5 min-h-[calc(100vh-140px)]">
        {isLoading && jobs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner className="w-8 h-8 text-brand-primary" />
          </div>
        ) : (
          <>
            <KanbanColumn
              id="TARGETING"
              title="Nhắm Mục Tiêu"
              icon="🎯"
              badgeColor="border-t-2 border-t-brand-primary"
              jobs={getJobsByStatus("TARGETING")}
              onMove={moveStatus}
              onDelete={deleteJob}
            />

            <KanbanColumn
              id="TAILORED"
              title="Đã Tối Ưu CV"
              icon="⚡"
              badgeColor="border-t-2 border-t-brand-blue"
              jobs={getJobsByStatus("TAILORED")}
              onMove={moveStatus}
              onDelete={deleteJob}
            />

            <KanbanColumn
              id="APPLIED"
              title="Đã Nộp Đơn"
              icon="📨"
              badgeColor="border-t-2 border-t-purple-500"
              jobs={getJobsByStatus("APPLIED")}
              onMove={moveStatus}
              onDelete={deleteJob}
            />

            <KanbanColumn
              id="INTERVIEW"
              title="Đang Phỏng Vấn"
              icon="💼"
              badgeColor="border-t-2 border-t-amber-500"
              jobs={getJobsByStatus("INTERVIEW")}
              onMove={moveStatus}
              onDelete={deleteJob}
            />

            <KanbanColumn
              id="OFFER"
              title="Nhận Offer / Hired"
              icon="🏆"
              badgeColor="border-t-2 border-t-emerald-500"
              jobs={getJobsByStatus("OFFER")}
              onMove={moveStatus}
              onDelete={deleteJob}
            />
          </>
        )}
      </main>

      {/* Add Job Modal Dialog */}
      <AddJobDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addJob}
      />

      {/* Terminal Status Bar */}
      <footer className="border-t border-surface-border bg-white px-4 py-2 text-[11px] text-typography-muted flex justify-between items-center shadow-xs">
        <div>Hệ điều hành theo dõi ứng tuyển: <strong className="text-typography-main">Belooga Kanban OS</strong></div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-700 font-medium">Đồng bộ đám mây thời gian thực</span>
        </div>
      </footer>
    </div>
  );
}
