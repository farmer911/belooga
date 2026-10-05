"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EngineeringTicket, PodAssignee } from "@/components/features/tickets/ticket-types";
import { MASTER_TICKETS } from "@/components/features/tickets/master-tickets";
import { TicketCard } from "@/components/features/tickets/ticket-card";
import { TicketDetailModal } from "@/components/features/tickets/ticket-detail-modal";

const ASSIGNEES: { id: PodAssignee | "ALL"; label: string }[] = [
  { id: "ALL", label: "Tất Cả Pods" },
  { id: "@be-senior", label: "Backend (@be-senior)" },
  { id: "@fe-lead", label: "Frontend (@fe-lead)" },
  { id: "@qc-lead", label: "QC Automation (@qc-lead)" },
  { id: "@des-lead", label: "Design (@des-lead)" },
  { id: "@ops-lead", label: "DevOps (@ops-lead)" },
];

export default function AdminTicketsPage() {
  const [selectedSprint, setSelectedSprint] = useState<number | "ALL">("ALL");
  const [selectedAssignee, setSelectedAssignee] = useState<PodAssignee | "ALL">("ALL");
  const [activeTicket, setActiveTicket] = useState<EngineeringTicket | null>(null);

  const filteredTickets = MASTER_TICKETS.filter((t) => {
    const matchSprint = selectedSprint === "ALL" || t.sprint === selectedSprint;
    const matchAssignee = selectedAssignee === "ALL" || t.assignee === selectedAssignee;
    return matchSprint && matchAssignee;
  });

  const todoTickets = filteredTickets.filter((t) => t.status === "TODO");
  const inProgressTickets = filteredTickets.filter((t) => t.status === "IN_PROGRESS");
  const doneTickets = filteredTickets.filter((t) => t.status === "DONE");

  return (
    <div className="min-h-screen bg-surface-page text-typography-main flex flex-col font-sans selection:bg-brand-primary/20 selection:text-brand-dark">
      <Header />

      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-surface-border bg-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-primary">Belooga Command</span>
          <span className="text-surface-border">/</span>
          <span className="text-typography-heading font-medium">Jira & Linear Engineering Sprint Board</span>
          <Badge variant="outline" className="text-[10px] text-brand-dark border-brand-primary/40 bg-teal-50/50">
            {MASTER_TICKETS.length} Tickets Phân Bổ
          </Badge>
          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
            {doneTickets.length} Đã Xong
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/analytics">
            <Button className="bg-white hover:bg-surface-page text-typography-heading hover:text-typography-main border border-surface-border text-xs px-2.5 h-7 shadow-xs">
              📈 Doanh Thu Analytics
            </Button>
          </Link>
          <Link href="/ats-diagnostics">
            <Button className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs px-3 h-7 shadow-xs">
              🎯 Test Tính Năng Live
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Ribbon: Sprints & Pod Assignees */}
      <div className="border-b border-surface-border bg-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Sprint selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-typography-muted text-[11px] mr-1 font-medium">Sprint:</span>
          {(["ALL", 1, 2, 3, 4] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSprint(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                selectedSprint === s
                  ? "bg-brand-primary text-white font-bold shadow-xs"
                  : "bg-surface-page text-typography-heading hover:bg-surface-divider border border-surface-border"
              }`}
            >
              {s === "ALL" ? "Tất Cả" : `Sprint ${s}`}
            </button>
          ))}
        </div>

        {/* Assignee Pod selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-typography-muted text-[11px] mr-1 font-medium">Assignee:</span>
          {ASSIGNEES.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAssignee(a.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                selectedAssignee === a.id
                  ? "bg-brand-dark text-white font-bold shadow-xs"
                  : "bg-surface-page text-typography-heading hover:bg-surface-divider border border-surface-border"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Engineering Kanban Board */}
      <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto max-w-[1600px] w-full mx-auto">
        {/* Column 1: TODO / ASSIGNED */}
        <div className="flex flex-col bg-surface-divider/60 rounded-xl border border-surface-border overflow-hidden shadow-xs">
          <div className="p-3 border-b border-surface-border bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-typography-muted"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-typography-heading">
                Backlog & Gán Việc ({todoTickets.length})
              </h3>
            </div>
            <span className="text-[10px] text-typography-muted font-mono">Chờ Kéo Làm</span>
          </div>
          <div className="p-2.5 space-y-2 flex-1 overflow-y-auto min-h-[300px]">
            {todoTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} onClick={setActiveTicket} />
            ))}
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div className="flex flex-col bg-amber-50/30 rounded-xl border border-amber-200 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-amber-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800">
                Đang Làm Việc Active ({inProgressTickets.length})
              </h3>
            </div>
            <span className="text-[10px] text-amber-700 font-mono">Đang Code & Test</span>
          </div>
          <div className="p-2.5 space-y-2 flex-1 overflow-y-auto min-h-[300px]">
            {inProgressTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} onClick={setActiveTicket} />
            ))}
          </div>
        </div>

        {/* Column 3: DONE & VERIFIED */}
        <div className="flex flex-col bg-emerald-50/30 rounded-xl border border-emerald-200 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-emerald-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                Đã Xong & Nghiệm Thu ({doneTickets.length})
              </h3>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono">Pass 100% Tests</span>
          </div>
          <div className="p-2.5 space-y-2 flex-1 overflow-y-auto min-h-[300px]">
            {doneTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} onClick={setActiveTicket} />
            ))}
          </div>
        </div>
      </main>

      {/* Ticket Detail Drawer/Modal */}
      <TicketDetailModal ticket={activeTicket} onClose={() => setActiveTicket(null)} />

      {/* Terminal Status Bar */}
      <footer className="border-t border-surface-border bg-white px-4 py-2 text-[11px] text-typography-muted flex justify-between items-center shadow-xs">
        <div>Hệ thống quản lý vé công nghệ: <strong className="text-typography-main">Belooga Linear Enterprise Board</strong></div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-700 font-medium">Đã gán việc 28 tickets cho 5 Pods</span>
        </div>
      </footer>
    </div>
  );
}
