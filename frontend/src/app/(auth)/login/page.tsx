"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post("/v1/auth/login/", {
        email: email.trim(),
        password,
      });

      const { access_token, user } = response.data;
      setAccessToken(access_token);
      setUser(user);

      // Redirect to Candidate Workspace
      router.push(`/user/${user.username}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Invalid credentials. Please verify your email and password.";
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-[#f8f9fa]">
      {/* Left Column: Form Area */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-[#252525] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-[#737475]">
              Log in to your Belooga account to manage your profile, elevator pitch, and career timeline.
            </p>
          </div>

          {errorMessage && (
            <div data-testid="auth-error-banner" className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  data-testid="login-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#515151]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#5bbbae] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              data-testid="login-submit-btn"
              disabled={isLoading}
              className="w-full bg-[#5bbbae] hover:bg-[#497d76] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {isLoading ? "Signing in..." : "Sign In to Account"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#d1d6da]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f8f9fa] px-3 text-[#737475]">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              className="flex items-center justify-center py-2.5 px-4 border border-[#d1d6da] bg-white rounded-lg text-xs font-semibold text-[#515151] hover:bg-slate-50 transition-colors"
            >
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center py-2.5 px-4 border border-[#d1d6da] bg-white rounded-lg text-xs font-semibold text-[#515151] hover:bg-slate-50 transition-colors"
            >
              LinkedIn
            </button>
            <button
              type="button"
              className="flex items-center justify-center py-2.5 px-4 border border-[#d1d6da] bg-white rounded-lg text-xs font-semibold text-[#515151] hover:bg-slate-50 transition-colors"
            >
              Facebook
            </button>
          </div>

          <p className="text-center text-sm text-[#737475]">
            Don't have a candidate account yet?{" "}
            <Link href="/register" className="font-semibold text-[#5bbbae] hover:underline">
              Create Profile
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Hero Split Visual with #d7ecea Tint */}
      <div className="hidden lg:relative lg:flex flex-col justify-end p-12 bg-slate-900 overflow-hidden">
        <img
          src="/images/home/matt-poster.png"
          alt="Belooga Candidate Experience"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-[#d7ecea] opacity-25 mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 max-w-lg text-white space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-[#5bbbae]/20 border border-[#5bbbae]/40 text-[#3fc6b7] text-xs font-semibold uppercase tracking-wider">
            Verified Video Resumes
          </div>
          <h2 className="text-3xl font-extrabold leading-snug">
            Stand out in 30 seconds before your competition even gets an interview.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Over 85% of recruiting managers say authentic 30-second candidate elevator pitches convey communication skills faster than any static PDF resume.
          </p>
        </div>
      </div>
    </div>
  );
}
