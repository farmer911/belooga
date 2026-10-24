"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Lock, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPreferencesCard } from "@/components/features/profile/notification-preferences-card";
import { passwordChangeSchema, PasswordFormValues } from "@/lib/schemas";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";
import {
  PROFILE_INPUT_CLS as INPUT_CLS,
  useProfileOwnerGuard,
  WorkspaceSubpageShell,
} from "@/components/features/profile/workspace-subpage-shell";

export default function AccountSettingsPage() {
  const { username, router } = useProfileOwnerGuard();
  const logout = useAuthStore((s) => s.logout);
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

  const passwordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      const res = await apiClient.post<{ message: string }>(`/v1/users/${username}/password/`, {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      setPasswordChanged(true);
      setTimeout(() => setPasswordChanged(false), 3000);
      reset();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete<{ message: string }>(`/v1/users/${username}/`);
      return res.data;
    },
    onSuccess: () => {
      logout();
      router.push("/");
    },
  });

  const onPasswordSubmit = handleSubmit((values) => {
    passwordMutation.mutate(values);
  });

  return (
    <WorkspaceSubpageShell
      username={username}
      badgeText={`Account Security @${username}`}
      title="Account Settings"
      subtitle="Manage your credentials, password security, and account preferences."
    >
      {passwordChanged && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Password updated successfully!</span>
            </div>
          )}

          {passwordMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              Current password is incorrect or session is unauthorized.
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

            <Button
              type="submit"
              disabled={passwordMutation.isPending}
              className="bg-brand-primary hover:bg-brand-hover text-white"
            >
              {passwordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>

          <NotificationPreferencesCard />

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
              disabled={deleteAccountMutation.isPending}
              data-testid="settings-delete-account-btn"
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (confirm("Are you sure you want to permanently delete your Belooga account?")) {
                  deleteAccountMutation.mutate();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
    </WorkspaceSubpageShell>
  );
}
