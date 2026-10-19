"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { publicContactSchema, PublicContactFormValues } from "@/lib/schemas";

export interface PublicContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  fullName: string;
}

const INPUT_CLS =
  "w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary";

export function PublicContactModal({
  isOpen,
  onClose,
  username,
  fullName,
}: PublicContactModalProps) {
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PublicContactFormValues>({
    resolver: zodResolver(publicContactSchema),
    defaultValues: { name: "", email: "", company: "", message: "" },
  });

  const contactMutation = useMutation({
    mutationFn: async (values: PublicContactFormValues) => {
      const prefix = values.company
        ? `[Inquiry for @${username} from ${values.company}] `
        : `[Inquiry for @${username}] `;
      await apiClient.post("/v1/contact/", {
        name: values.name,
        email: values.email,
        message: `${prefix}${values.message}`,
      });
    },
    onSuccess: () => {
      setErrorMsg(null);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        reset();
      }, 2000);
    },
    onError: () => {
      setErrorMsg("Failed to send direct inquiry. Please try again.");
    },
  });

  if (!isOpen) return null;

  const onSubmit = handleSubmit(async (values) => {
    setErrorMsg(null);
    await contactMutation.mutateAsync(values);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface-card rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b pb-3 border-surface-divider">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-bold text-typography-main">Contact @{username}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-base font-bold text-typography-main">Message Dispatched!</p>
            <p className="text-xs text-typography-muted">
              Your direct inquiry was sent to {fullName}&apos;s verified contact inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-3">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Your Name *</label>
              <input
                type="text"
                placeholder="Recruiter Name"
                className={INPUT_CLS}
                {...register("name")}
              />
              {errors.name && <p className="text-[11px] text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Your Work Email *</label>
              <input
                type="email"
                placeholder="recruiter@company.com"
                className={INPUT_CLS}
                {...register("email")}
              />
              {errors.email && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Stripe, OpenAI"
                className={INPUT_CLS}
                {...register("company")}
              />
              {errors.company && <p className="text-[11px] text-red-600">{errors.company.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Message / Opportunity *</label>
              <textarea
                rows={3}
                placeholder="We loved your video pitch and would like to invite you..."
                className={INPUT_CLS}
                {...register("message")}
              />
              {errors.message && <p className="text-[11px] text-red-600">{errors.message.message}</p>}
            </div>
            <Button
              type="submit"
              disabled={contactMutation.isPending}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white cursor-pointer"
            >
              {contactMutation.isPending ? "Sending..." : "Send Direct Inquiry"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
