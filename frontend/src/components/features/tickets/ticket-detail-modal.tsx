"use client";

import React from "react";
import Link from "next/link";
import { EngineeringTicket } from "./ticket-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TicketDetailModalProps {
  ticket: EngineeringTicket | null;
  onClose: () => void;
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl relative text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono font-bold text-sm">{ticket.id}</span>
            <Badge variant="outline" className="text-[10px] text-slate-300">
              Sprint {ticket.sprint}
            </Badge>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {ticket.assignee}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-100">{ticket.title}</h3>
          <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800">
            {ticket.description}
          </p>

          <div>
            <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
              Tiêu Chí Nghiệm Thu (Acceptance Criteria - AC)
            </h4>
            <div className="space-y-1.5">
              {ticket.acceptanceCriteria.map((ac, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300 bg-slate-900/40 p-1.5 rounded">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{ac}</span>
                </div>
              ))}
            </div>
          </div>

          {ticket.evidenceCommand && (
            <div>
              <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                Lệnh Kiểm Định Nghiệm Thu (Evidence Command)
              </h4>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
                $ {ticket.evidenceCommand}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Trạng thái:</span>
            <span
              className={`font-semibold uppercase font-mono px-2 py-0.5 rounded text-[10px] ${
                ticket.status === "DONE"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : ticket.status === "IN_PROGRESS"
                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                  : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              {ticket.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {ticket.liveUrl && (
              <Link href={ticket.liveUrl}>
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs h-7 px-3">
                  Mở Tính Năng Live
                </Button>
              </Link>
            )}
            <Button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs h-7 px-3"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
