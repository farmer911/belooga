"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountSettingsPage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      setPasswordChanged(true);
      setTimeout(() => setPasswordChanged(false), 3000);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      alert("New passwords do not match.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <Link
            href={`/user/${username}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5bbbae] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </Link>
          <span className="text-xs text-[#737475]">Account Security @{username}</span>
        </div>

        <div className="bg-white rounded-xl border border-[#d1d6da] p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#252525]">Account Settings</h1>
            <p className="text-sm text-[#737475]">
              Manage your credentials, password security, and account preferences.
            </p>
          </div>

          {passwordChanged && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Password updated successfully!</span>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2" data-testid="settings-password-form">
            <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#5bbbae]" /> Change Password
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#515151]">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#515151]">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
            </div>

            <Button type="submit" className="bg-[#5bbbae] hover:bg-[#497d76] text-white">
              Update Password
            </Button>
          </form>

          {/* Danger Zone */}
          <div className="pt-8 border-t border-[#f0f2f5] space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Danger Zone
              </h3>
              <p className="text-xs text-[#737475]">
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
