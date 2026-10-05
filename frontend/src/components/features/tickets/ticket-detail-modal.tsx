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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-surface-border rounded-xl max-w-xl w-full p-5 space-y-4 shadow-xl relative text-xs">
        <div className="flex items-center justify-between border-b border-surface-divider pb-3">
          <div className="flex items-center gap-2">
            <span className="text-brand-primary font-mono font-bold text-sm">{ticket.id}</span>
            <Badge variant="outline" className="text-[10px] text-typography-heading border-surface-border bg-surface-page">
              Sprint {ticket.sprint}
            </Badge>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-50 text-brand-dark border border-teal-200">
              {ticket.assignee}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-typography-muted hover:text-typography-main text-lg font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-typography-main">{ticket.title}</h3>
          <p className="text-typography-heading leading-relaxed bg-surface-page p-3 rounded-lg border border-surface-border">
            {ticket.description}
          </p>

          <div>
            <h4 className="font-semibold text-typography-heading uppercase tracking-wider text-[10px] mb-1.5">
              Tiêu Chí Nghiệm Thu (Acceptance Criteria - AC)
            </h4>
            <div className="space-y-1.5">
              {ticket.acceptanceCriteria.map((ac, i) => (
                <div key={i} className="flex items-center gap-2 text-typography-heading bg-surface-page p-2 rounded-md border border-surface-divider">
                  <span className="text-brand-primary font-bold">✓</span>
                  <span>{ac}</span>
                </div>
              ))}
            </div>
          </div>

          {ticket.evidenceCommand && (
            <div>
              <h4 className="font-semibold text-typography-heading uppercase tracking-wider text-[10px] mb-1">
                Lệnh Kiểm Định Nghiệm Thu (Evidence Command)
              </h4>
              <div className="p-2 rounded bg-neutral-900 border border-neutral-700 font-mono text-[11px] text-brand-accent">
                $ {ticket.evidenceCommand}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-surface-divider">
          <div className="flex items-center gap-2">
            <span className="text-typography-muted">Trạng thái:</span>
            <span
              className={`font-semibold uppercase font-mono px-2 py-0.5 rounded text-[10px] ${
                ticket.status === "DONE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                  : ticket.status === "IN_PROGRESS"
                  ? "bg-amber-50 text-amber-700 border border-amber-300"
                  : "bg-surface-page text-typography-heading border border-surface-border"
              }`}
            >
              {ticket.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {ticket.liveUrl && (
              <Link href={ticket.liveUrl}>
                <Button className="bg-brand-primary hover:bg-brand-hover text-white font-medium text-xs h-7 px-3 rounded-lg shadow-xs">
                  Mở Tính Năng Live
                </Button>
              </Link>
            )}
            <Button
              onClick={onClose}
              className="bg-white hover:bg-surface-page text-typography-heading hover:text-typography-main border border-surface-border text-xs h-7 px-3 rounded-lg shadow-xs"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
