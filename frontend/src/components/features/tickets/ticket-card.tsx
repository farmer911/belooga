"use client";

import React from "react";
import Link from "next/link";
import { EngineeringTicket } from "./ticket-types";
import { Badge } from "@/components/ui/badge";

interface TicketCardProps {
  ticket: EngineeringTicket;
  onClick: (t: EngineeringTicket) => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "P0":
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-800 text-[10px]">P0 Blocker</Badge>;
      case "P1":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-800 text-[10px]">P1 High</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-800 text-[10px]">P2 Normal</Badge>;
    }
  };

  const getAssigneeColor = (a: string) => {
    switch (a) {
      case "@be-senior":
        return "bg-cyan-950 text-cyan-300 border-cyan-800";
      case "@fe-lead":
        return "bg-purple-950 text-purple-300 border-purple-800";
      case "@qc-lead":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "@des-lead":
        return "bg-pink-950 text-pink-300 border-pink-800";
      default:
        return "bg-amber-950 text-amber-300 border-amber-800";
    }
  };

  return (
    <div
      onClick={() => onClick(ticket)}
      data-testid={`ticket-card-${ticket.id}`}
      className="p-3 rounded bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-2.5 shadow-sm group"
    >
      <div className="flex items-center justify-between">
        <span className="text-cyan-400 font-mono font-bold text-xs group-hover:underline">
          {ticket.id}
        </span>
        <div className="flex items-center gap-1.5">
          {getPriorityBadge(ticket.priority)}
          <span className="text-[10px] text-slate-500 font-mono">{ticket.points} pts</span>
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-cyan-300 transition">
        {ticket.title}
      </div>

      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
        {ticket.description}
      </p>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getAssigneeColor(
            ticket.assignee
          )}`}
        >
          {ticket.assignee}
        </span>

        {ticket.liveUrl && (
          <Link
            href={ticket.liveUrl}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5"
          >
            <span>🔗 Live</span>
          </Link>
        )}
      </div>
    </div>
  );
}
