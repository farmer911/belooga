"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { reportProfileSchema, ReportProfileFormValues } from "@/lib/schemas";

export interface ReportProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  username: string;
}

export function ReportProfileModal({
  isOpen,
  onClose,
  candidateId,
  username,
}: ReportProfileModalProps) {
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportProfileFormValues>({
    resolver: zodResolver(reportProfileSchema),
    defaultValues: { reason: "" },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ reason }: ReportProfileFormValues) => {
      await apiClient.post(`/v1/profile/${candidateId}/report/`, { reason });
    },
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        reset();
      }, 2000);
    },
    onError: () => {
      alert("Failed to submit report. Please try again.");
    },
  });

  if (!isOpen) return null;

  const onSubmit = handleSubmit(async (values) => {
    if (!candidateId) return;
    await reportMutation.mutateAsync(values);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface-card rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b pb-3 border-surface-divider">
          <h3 className="text-lg font-bold text-typography-main">Report Candidate Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-4 text-center text-sm font-semibold text-emerald-600">
            Thank you. Report received and sent to moderation team.
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <p className="text-xs text-typography-muted">
              Please specify the reason for reporting @{username}&apos;s profile (e.g. misleading credentials, inappropriate content).
            </p>
            <div className="space-y-1">
              <textarea
                rows={4}
                placeholder="Describe the issue..."
                className="w-full p-3 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                {...register("reason")}
              />
              {errors.reason && <p className="text-[11px] text-red-600">{errors.reason.message}</p>}
            </div>
            <Button
              type="submit"
              disabled={reportMutation.isPending}
              data-testid="report-modal-submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Submit Report
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
