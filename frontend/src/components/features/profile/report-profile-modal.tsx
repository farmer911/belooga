"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";

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
  const [reason, setReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/v1/profile/${candidateId}/report/`, {
        reason,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setReason("");
      }, 2000);
    } catch (err) {
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b pb-3 border-[#f0f2f5]">
          <h3 className="text-lg font-bold text-[#252525]">Report Candidate Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-4 text-center text-sm font-semibold text-emerald-600">
            Thank you. Report received and sent to moderation team.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[#737475]">
              Please specify the reason for reporting @{username}&apos;s profile (e.g. misleading credentials, inappropriate content).
            </p>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full p-3 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
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
