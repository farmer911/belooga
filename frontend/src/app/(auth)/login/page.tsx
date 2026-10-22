"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, getApiErrorDetail } from "@/services/api-client";
import { useAuthStore, normalizeAuthUser } from "@/store/auth-store";
import { loginSchema, LoginFormValues } from "@/lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const emailVal = watch("email") || "";

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const response = await apiClient.post("/v1/auth/login/", values);
      return response.data;
    },
    onSuccess: ({ access_token, user }) => {
      setUser(normalizeAuthUser(user));
      setAccessToken(access_token);
      const nextParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next") ||
            sessionStorage.getItem("belooga_return_to")
          : null;
      if (typeof window !== "undefined") sessionStorage.removeItem("belooga_return_to");
      const target =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : `/user/${user.username}`;
      router.push(target);
    },
    onError: (err: unknown) => {
      setErrorMessage(getApiErrorDetail(err, "Invalid credentials. Please verify your email and password."));
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    await loginMutation.mutateAsync(values);
  });

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-surface-page">
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-typography-main tracking-tight">Welcome Back</h1>
            <p className="text-sm text-typography-muted">
              Log in to your Belooga account to manage your profile, elevator pitch, and career timeline.
            </p>
          </div>

          {errorMessage && (
            <div data-testid="auth-error-banner" className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-typography-heading">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  data-testid="login-email-input"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-typography-heading">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-brand-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  data-testid="login-password-input"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  {...register("password")}
                />
              </div>
              {errors.password && <p className="text-[11px] text-red-600">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              data-testid="login-submit-btn"
              disabled={loginMutation.isPending}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In to Account"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-page px-3 text-typography-muted">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Google", "LinkedIn", "Facebook"].map((provider) => {
              const slug = provider.toLowerCase();
              return (
                <button
                  key={provider}
                  type="button"
                  data-testid={`oauth-${slug}-btn`}
                  onClick={() => {
                    const nextParam = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("next") || sessionStorage.getItem("belooga_return_to")) : null;
                    const emailParam = encodeURIComponent(emailVal.trim() || "alex@belooga.com");
                    const nextQuery = nextParam ? `&next=${encodeURIComponent(nextParam)}` : "";
                    router.push(`/callback?provider=${slug}&code=oauth_${slug}_code&email=${emailParam}${nextQuery}`);
                  }}
                  className="flex items-center justify-center py-2.5 px-4 border border-surface-border bg-surface-card rounded-lg text-xs font-semibold text-typography-heading hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {provider}
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm text-typography-muted">
            Don't have a candidate account yet?{" "}
            <Link href="/register" className="font-semibold text-brand-primary hover:underline">
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
        <div className="absolute inset-0 bg-brand-overlay opacity-25 mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 max-w-lg text-white space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/40 text-brand-accent text-xs font-semibold uppercase tracking-wider">
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
