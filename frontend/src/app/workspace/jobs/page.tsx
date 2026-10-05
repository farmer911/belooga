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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />

      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-cyan-400">Belooga Workspace</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-medium">Job Application Tracker (Kanban)</span>
          <Badge variant="outline" className="text-[10px] uppercase text-cyan-300 border-cyan-800">
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
            className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48"
          />

          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              💼 {interviewCount} Phỏng vấn
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              🏆 {offerCount} Offer
            </span>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-3 h-8 flex items-center gap-1"
          >
            <span>➕</span> Thêm Công Việc
          </Button>
        </div>
      </div>

      {/* Main Kanban Board (Horizontal Scroll Zero Dead-Space) */}
      <main className="flex-1 p-4 overflow-x-auto flex gap-3 min-h-[calc(100vh-140px)]">
        {isLoading && jobs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner className="w-8 h-8 text-cyan-500" />
          </div>
        ) : (
          <>
            <KanbanColumn
              id="TARGETING"
              title="Nhắm Mục Tiêu"
              icon="🎯"
              badgeColor="border-t-2 border-t-cyan-500"
              jobs={getJobsByStatus("TARGETING")}
              onMove={moveStatus}
              onDelete={deleteJob}
            />

            <KanbanColumn
              id="TAILORED"
              title="Đã Tối Ưu CV"
              icon="⚡"
              badgeColor="border-t-2 border-t-blue-500"
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
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-1.5 text-[11px] text-slate-500 flex justify-between items-center">
        <div>Hệ điều hành theo dõi ứng tuyển: <strong>Belooga Kanban OS</strong></div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-400">Đồng bộ đám mây thời gian thực</span>
        </div>
      </footer>
    </div>
  );
}
