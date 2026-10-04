"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#f8f9fa] px-4 py-12">
      <div className="max-w-md w-full bg-white border border-[#d1d6da] rounded-xl p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-[#252525]">Reset Your Password</h1>
          <p className="text-sm text-[#737475]">
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-emerald-800">Recovery Email Sent</p>
            <p className="text-xs text-emerald-700">
              Check your inbox at <strong>{email}</strong> for instructions to reset your account password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#515151]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#5bbbae] hover:bg-[#497d76] text-white py-2.5">
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5bbbae] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
