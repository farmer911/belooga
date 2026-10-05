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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Header />

      {/* Action Sub-Header / Tool Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-cyan-400">Belooga Command</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-medium">Jira & Linear Engineering Sprint Board</span>
          <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-800">
            {MASTER_TICKETS.length} Tickets Phân Bổ
          </Badge>
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800 bg-emerald-950/40">
            {doneTickets.length} Đã Xong
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/analytics">
            <Button className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 h-7">
              📈 Doanh Thu Analytics
            </Button>
          </Link>
          <Link href="/ats-diagnostics">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-3 h-7">
              🎯 Test Tính Năng Live
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Ribbon: Sprints & Pod Assignees */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Sprint selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-500 text-[11px] mr-1">Sprint:</span>
          {(["ALL", 1, 2, 3, 4] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSprint(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                selectedSprint === s
                  ? "bg-cyan-500 text-black font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {s === "ALL" ? "Tất Cả" : `Sprint ${s}`}
            </button>
          ))}
        </div>

        {/* Assignee Pod selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-500 text-[11px] mr-1">Assignee:</span>
          {ASSIGNEES.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAssignee(a.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                selectedAssignee === a.id
                  ? "bg-purple-600 text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
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
        <div className="flex flex-col bg-slate-950/80 rounded border border-slate-800/80 overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Backlog & Gán Việc ({todoTickets.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Chờ Kéo Làm</span>
          </div>
          <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[300px]">
            {todoTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} onClick={setActiveTicket} />
            ))}
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div className="flex flex-col bg-slate-950/80 rounded border border-amber-500/30 overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-amber-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300">
                Đang Làm Việc Active ({inProgressTickets.length})
              </h3>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">Đang Code & Test</span>
          </div>
          <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[300px]">
            {inProgressTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} onClick={setActiveTicket} />
            ))}
          </div>
        </div>

        {/* Column 3: DONE & VERIFIED */}
        <div className="flex flex-col bg-slate-950/80 rounded border border-emerald-500/30 overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-emerald-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                Đã Xong & Nghiệm Thu ({doneTickets.length})
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Pass 100% Tests</span>
          </div>
          <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[300px]">
            {doneTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} onClick={setActiveTicket} />
            ))}
          </div>
        </div>
      </main>

      {/* Ticket Detail Drawer/Modal */}
      <TicketDetailModal ticket={activeTicket} onClose={() => setActiveTicket(null)} />

      {/* Terminal Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-1.5 text-[11px] text-slate-500 flex justify-between items-center">
        <div>Hệ thống quản lý vé công nghệ: <strong>Belooga Linear Enterprise Board</strong></div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-emerald-400">Đã gán việc 28 tickets cho 5 Pods</span>
        </div>
      </footer>
    </div>
  );
}
