"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTrackedJobPayload } from "@/hooks/use-job-tracker";
import { addJobSchema, AddJobFormValues } from "@/lib/schemas";

interface AddJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: CreateTrackedJobPayload) => Promise<unknown>;
}

const INPUT_CLS =
  "w-full bg-surface-page border border-surface-border rounded-lg p-2.5 text-xs text-typography-main focus:outline-none focus:border-brand-primary focus:bg-surface-card focus:ring-1 focus:ring-brand-primary";

export function AddJobDialog({ isOpen, onClose, onAdd }: AddJobDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<AddJobFormValues>({
    resolver: zodResolver(addJobSchema),
    defaultValues: {
      company: "",
      position: "",
      status: "TARGETING",
      salary: "",
      score: 85,
      notes: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await onAdd({
        company_name: values.company,
        position_title: values.position,
        status: values.status,
        expected_salary: values.salary || undefined,
        match_score: Number(values.score),
        notes: values.notes || undefined,
      });
      reset();
      onClose();
    } catch {
      // Handled in parent
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl max-w-md w-full p-6 space-y-4 text-xs shadow-xl">
        <div className="flex items-center justify-between border-b border-surface-divider pb-3">
          <h3 className="font-bold text-sm text-typography-main flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span>Thêm Công Việc Cần Theo Dõi</span>
          </h3>
          <button
            onClick={onClose}
            className="text-typography-muted hover:text-typography-main text-base font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-3.5">
          <div>
            <label className="block text-typography-heading mb-1 font-medium">Tên công ty *</label>
            <input
              type="text"
              placeholder="vd: Shopee, VNG, Grab, FPT"
              className={INPUT_CLS}
              {...register("company")}
            />
            {errors.company && <p className="mt-1 text-[11px] text-red-600">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-typography-heading mb-1 font-medium">Vị trí ứng tuyển *</label>
            <input
              type="text"
              placeholder="vd: Senior Backend Engineer"
              className={INPUT_CLS}
              {...register("position")}
            />
            {errors.position && <p className="mt-1 text-[11px] text-red-600">{errors.position.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-typography-heading mb-1 font-medium">Cột Kanban</label>
              <select className={INPUT_CLS} {...register("status")}>
                <option value="TARGETING">Nhắm Mục Tiêu</option>
                <option value="TAILORED">Đã Tối Ưu CV</option>
                <option value="APPLIED">Đã Nộp Đơn</option>
                <option value="INTERVIEW">Phỏng Vấn</option>
                <option value="OFFER">Nhận Offer</option>
              </select>
            </div>

            <div>
              <label className="block text-typography-heading mb-1 font-medium">Mức lương dự kiến</label>
              <input
                type="text"
                placeholder="vd: $2,500 - $3,000"
                className={INPUT_CLS}
                {...register("salary")}
              />
            </div>
          </div>

          <div>
            <label className="block text-typography-heading mb-1 font-medium">Điểm ATS Match (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              className={INPUT_CLS}
              {...register("score", { valueAsNumber: true })}
            />
            {errors.score && <p className="mt-1 text-[11px] text-red-600">{errors.score.message}</p>}
          </div>

          <div>
            <label className="block text-typography-heading mb-1 font-medium">Ghi chú cá nhân</label>
            <textarea
              rows={2}
              placeholder="vd: Bạn Quân giới thiệu, phỏng vấn System Design vào Thứ 5"
              className={`${INPUT_CLS} resize-none`}
              {...register("notes")}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-surface-divider">
            <Button
              type="button"
              onClick={onClose}
              className="h-8 text-xs bg-surface-card hover:bg-surface-page text-typography-heading hover:text-typography-main border border-surface-border rounded-lg shadow-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 text-xs bg-brand-primary hover:bg-brand-hover text-white font-medium rounded-lg shadow-xs"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu Công Việc"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
