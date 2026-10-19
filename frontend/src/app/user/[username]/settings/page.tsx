"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { passwordChangeSchema, PasswordFormValues } from "@/lib/schemas";

const INPUT_CLS =
  "w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary";

export default function AccountSettingsPage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  const [passwordChanged, setPasswordChanged] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onPasswordSubmit = handleSubmit(() => {
    setPasswordChanged(true);
    setTimeout(() => setPasswordChanged(false), 3000);
    reset();
  });

  return (
    <div className="min-h-screen bg-surface-page py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/user/${username}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </Link>
          <span className="text-xs text-typography-muted">Account Security @{username}</span>
        </div>

        <div className="bg-surface-card rounded-xl border border-surface-border p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-typography-main">Account Settings</h1>
            <p className="text-sm text-typography-muted">
              Manage your credentials, password security, and account preferences.
            </p>
          </div>

          {passwordChanged && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Password updated successfully!</span>
            </div>
          )}

          <form onSubmit={onPasswordSubmit} noValidate className="space-y-4 pt-2" data-testid="settings-password-form">
            <h3 className="text-base font-bold text-typography-main flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-primary" /> Change Password
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-typography-heading">Current Password</label>
              <input type="password" className={INPUT_CLS} {...register("currentPassword")} />
              {errors.currentPassword && <p className="text-[11px] text-red-600">{errors.currentPassword.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">New Password</label>
                <input type="password" className={INPUT_CLS} {...register("newPassword")} />
                {errors.newPassword && <p className="text-[11px] text-red-600">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-typography-heading">Confirm New Password</label>
                <input type="password" className={INPUT_CLS} {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-[11px] text-red-600">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <Button type="submit" className="bg-brand-primary hover:bg-brand-hover text-white">
              Update Password
            </Button>
          </form>

          <div className="pt-8 border-t border-surface-divider space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Danger Zone
              </h3>
              <p className="text-xs text-typography-muted">
                Once you delete your account, your profile, video pitch, timeline, and resume will be permanently erased.
              </p>
            </div>

            <Button
              type="button"
              variant="destructive"
              data-testid="settings-delete-account-btn"
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (confirm("Are you sure you want to permanently delete your Belooga account?")) {
                  alert("Account deletion cascade triggered. Redirecting to home.");
                  router.push("/");
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
