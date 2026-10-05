"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateTrackedJobPayload, KanbanStatus } from "@/hooks/use-job-tracker";

interface AddJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: CreateTrackedJobPayload) => Promise<unknown>;
}

export function AddJobDialog({ isOpen, onClose, onAdd }: AddJobDialogProps) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<KanbanStatus>("TARGETING");
  const [salary, setSalary] = useState("");
  const [score, setScore] = useState(85);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        company_name: company.trim(),
        position_title: position.trim(),
        status,
        expected_salary: salary.trim() || undefined,
        match_score: score,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-5 space-y-4 text-xs shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <span>➕</span> Thêm Công Việc Cần Theo Dõi
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Tên công ty *</label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="vd: Shopee, VNG, Grab, FPT"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Vị trí ứng tuyển *</label>
            <input
              type="text"
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="vd: Senior Backend Engineer"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cột Kanban</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as KanbanStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="TARGETING">🎯 Nhắm Mục Tiêu</option>
                <option value="TAILORED">⚡ Đã Tối Ưu CV</option>
                <option value="APPLIED">📨 Đã Nộp Đơn</option>
                <option value="INTERVIEW">💼 Phỏng Vấn</option>
                <option value="OFFER">🏆 Nhận Offer</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Mức lương dự kiến</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="vd: $2,500 - $3,000"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Điểm ATS Match (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Ghi chú cá nhân</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="vd: Bạn Quân giới thiệu, phỏng vấn System Design vào Thứ 5"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="h-8 text-xs border-slate-700">
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu Công Việc"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
