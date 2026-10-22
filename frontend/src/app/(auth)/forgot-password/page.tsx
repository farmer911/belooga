"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/lib/schemas";
import { apiClient } from "@/services/api-client";

interface ForgotPasswordResponse {
  message: string;
  reset_token?: string | null;
}

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const deepLinkToken = searchParams.get("token") || "";
  const deepLinkEmail = searchParams.get("email") || "";

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(
    deepLinkToken ? deepLinkEmail || "your account" : null,
  );
  const [resetToken, setResetToken] = useState(deepLinkToken);
  const [newPassword, setNewPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: deepLinkEmail },
  });

  const forgotMutation = useMutation({
    mutationFn: async (values: ForgotPasswordFormValues) => {
      const res = await apiClient.post<ForgotPasswordResponse>("/v1/auth/forgot-password/", values);
      return { email: values.email, data: res.data };
    },
    onSuccess: ({ email, data }) => {
      setSubmittedEmail(email);
      if (data.reset_token) setResetToken(data.reset_token);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ message: string }>("/v1/auth/reset-password/", {
        token: resetToken,
        new_password: newPassword,
      });
      return res.data;
    },
    onSuccess: () => setResetComplete(true),
  });

  const onSubmit = handleSubmit((values) => {
    forgotMutation.mutate(values);
  });

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-surface-page px-4 py-12">
      <div className="max-w-md w-full bg-surface-card border border-surface-border rounded-xl p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-typography-main">Reset Your Password</h1>
          <p className="text-sm text-typography-muted">
            Enter your registered email address and we&apos;ll issue a single-use recovery token.
          </p>
        </div>

        {resetComplete ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-3" data-testid="password-reset-success">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-emerald-800">Password Updated</p>
            <p className="text-xs text-emerald-700">Your password has been rotated and active sessions revoked.</p>
            <div className="pt-1">
              <Link href="/login">
                <Button size="sm" className="bg-brand-primary hover:bg-brand-hover text-white">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : submittedEmail ? (
          <div className="space-y-4" data-testid="reset-password-form">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-emerald-800">Recovery Token Issued</p>
              <p className="text-xs text-emerald-700">
                Enter your recovery token for <strong>{submittedEmail}</strong> and choose a new password.
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Paste recovery token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-lg text-xs"
              />
              <input
                type="password"
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-lg text-xs"
              />
              {resetMutation.isError && (
                <p className="text-[11px] text-red-600">Invalid, expired, or already used recovery token.</p>
              )}
              <Button
                type="button"
                disabled={resetMutation.isPending || resetToken.length < 8 || newPassword.length < 8}
                onClick={() => resetMutation.mutate()}
                className="w-full bg-brand-primary hover:bg-brand-hover text-white py-2.5 gap-1.5"
              >
                <KeyRound className="w-4 h-4" /> Confirm New Password
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="forgot-password-form">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-typography-heading">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={forgotMutation.isPending}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white py-2.5"
            >
              {forgotMutation.isPending ? "Issuing Token..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] bg-surface-page" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
