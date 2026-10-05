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
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">P0 Blocker</Badge>;
      case "P1":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">P1 High</Badge>;
      default:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold">P2 Normal</Badge>;
    }
  };

  const getAssigneeColor = (a: string) => {
    switch (a) {
      case "@be-senior":
        return "bg-teal-50 text-brand-dark border-teal-200";
      case "@fe-lead":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "@qc-lead":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "@des-lead":
        return "bg-pink-50 text-pink-700 border-pink-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div
      onClick={() => onClick(ticket)}
      data-testid={`ticket-card-${ticket.id}`}
      className="p-3 rounded-lg bg-white border border-surface-border hover:border-brand-primary hover:shadow-xs transition cursor-pointer space-y-2 shadow-xs group"
    >
      <div className="flex items-center justify-between">
        <span className="text-brand-primary font-mono font-bold text-xs group-hover:underline">
          {ticket.id}
        </span>
        <div className="flex items-center gap-1.5">
          {getPriorityBadge(ticket.priority)}
          <span className="text-[10px] text-typography-muted font-mono">{ticket.points} pts</span>
        </div>
      </div>

      <div className="text-xs font-semibold text-typography-main line-clamp-2 group-hover:text-brand-hover transition-colors">
        {ticket.title}
      </div>

      <p className="text-[11px] text-typography-body line-clamp-2 leading-relaxed">
        {ticket.description}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-surface-divider">
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
            className="text-[10px] text-brand-primary hover:text-brand-hover font-medium flex items-center gap-0.5"
          >
            <span>🔗 Live</span>
          </Link>
        )}
      </div>
    </div>
  );
}
