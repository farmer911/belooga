"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, getApiErrorDetail } from "@/services/api-client";
import { useAuthStore, normalizeAuthUser } from "@/store/auth-store";
import { registerSchema, RegisterFormValues } from "@/lib/schemas";
import {
  AuthSplitShell,
  GoogleSignInButton,
} from "@/components/features/auth/auth-split-shell";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

function useDebouncedAvailability(value: string, isValid: boolean, endpoint: string): AvailabilityStatus {
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    if (!isValid) return; // stale `debounced` is ignored below while the input is invalid
    const timer = setTimeout(() => setDebounced(value.trim()), 300);
    return () => clearTimeout(timer);
  }, [value, isValid]);

  const { data, isFetching } = useQuery<{ available: boolean }>({
    queryKey: ["availability-check", endpoint, debounced],
    queryFn: async () => (await apiClient.get<{ available: boolean }>(`${endpoint}${encodeURIComponent(debounced)}`)).data,
    enabled: isValid && debounced.length > 0,
  });

  if (!isValid || !debounced) return "idle";
  if (isFetching) return "checking";
  if (!data) return "idle";
  return data.available ? "available" : "taken";
}

function StatusBadge({ status, okLabel, takenLabel }: { status: AvailabilityStatus; okLabel: string; takenLabel: string }) {
  if (status === "checking") return <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</span>;
  if (status === "available") return <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> {okLabel}</span>;
  if (status === "taken") return <span className="text-xs text-red-600 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> {takenLabel}</span>;
  return null;
}

const INPUT_CLS = "w-full px-3 py-2 bg-surface-card border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary";
const ICON_INPUT_CLS = "w-full pl-9 pr-4 py-2 bg-surface-card border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary";

export default function RegisterPage() {
  const router = useRouter();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", username: "", email: "", password: "", agreeTerms: false },
  });

  const username = useWatch({ control, name: "username" }) || "";
  const email = useWatch({ control, name: "email" }) || "";
  const usernameStatus = useDebouncedAvailability(username, username.trim().length >= 3, "/v1/users/exists/username/?username=");
  const emailStatus = useDebouncedAvailability(email, email.includes("@"), "/v1/users/exists/email/?email=");

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => (await apiClient.post("/v1/users/register/", {
      first_name: values.firstName, last_name: values.lastName, username: values.username, email: values.email, password: values.password,
    })).data,
    onSuccess: ({ access_token, user }) => { setUser(normalizeAuthUser(user)); setAccessToken(access_token); router.push(`/user/${user.username}`); },
    onError: (err: unknown) => setErrorMessage(getApiErrorDetail(err, "Registration failed. Please verify your details.")),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (usernameStatus === "taken" || emailStatus === "taken") {
      setErrorMessage("Please select a unique email and username.");
      return;
    }
    setErrorMessage(null);
    await registerMutation.mutateAsync(values);
  });

  return (
    <AuthSplitShell
      title="Create Candidate Profile"
      subtitle="Showcase your talent with a 0:30 video pitch and a verified career timeline."
      errorMessage={errorMessage}
      heroAlt="Belooga Talent Community"
      heroBadge="Candidate First"
      heroTitle="Your skills speak louder when you tell your own story."
      heroDescription="Record a personalized video elevator pitch, organize your career history, and let top companies discover the real professional behind the resume."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-typography-heading">First Name</label>
            <input type="text" placeholder="Jane" className={INPUT_CLS} {...register("firstName")} />
            {errors.firstName && <p className="text-[11px] text-red-600">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-typography-heading">Last Name</label>
            <input type="text" placeholder="Doe" className={INPUT_CLS} {...register("lastName")} />
            {errors.lastName && <p className="text-[11px] text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-typography-heading">Username (CV URL Slug)</label>
            <StatusBadge status={usernameStatus} okLabel="Available" takenLabel="Already taken" />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
            <input
              type="text"
              data-testid="register-username-input"
              placeholder="janedoe"
              className={ICON_INPUT_CLS}
              {...register("username", {
                onChange: (e) => setValue("username", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")),
              })}
            />
          </div>
          {errors.username && <p className="text-[11px] text-red-600">{errors.username.message}</p>}
          <p className="text-[11px] text-typography-muted">Your public CV will be at: belooga.com/public/{username || "username"}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-typography-heading">Email Address</label>
            <StatusBadge status={emailStatus} okLabel="Valid" takenLabel="Registered" />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail className="w-4 h-4" /></div>
            <input type="email" data-testid="register-email-input" placeholder="jane@example.com" className={ICON_INPUT_CLS} {...register("email")} />
          </div>
          {errors.email && <p className="text-[11px] text-red-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-typography-heading">Password (min 8 characters)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
            <input type="password" data-testid="register-password-input" placeholder="••••••••" className={ICON_INPUT_CLS} {...register("password")} />
          </div>
          {errors.password && <p className="text-[11px] text-red-600">{errors.password.message}</p>}
        </div>

        <div className="space-y-1 pt-2">
          <div className="flex items-start gap-2">
            <input type="checkbox" id="terms" className="mt-1 h-4 w-4 rounded border-surface-border text-brand-primary focus:ring-brand-primary" {...register("agreeTerms")} />
            <label htmlFor="terms" className="text-xs text-typography-heading">
              I agree to Belooga&apos;s <Link href="/terms-and-conditions" className="text-brand-primary hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-brand-primary hover:underline">Privacy Policy</Link>.
            </label>
          </div>
          {errors.agreeTerms && <p className="text-[11px] text-red-600">{errors.agreeTerms.message}</p>}
        </div>

        <Button
          type="submit"
          size="lg"
          data-testid="register-submit-btn"
          disabled={registerMutation.isPending}
          className="w-full bg-brand-primary hover:bg-brand-hover text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 mt-4"
        >
          {registerMutation.isPending ? "Creating Profile..." : "Complete Registration"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <GoogleSignInButton testId="register-oauth-google-btn" />
      <p className="text-center text-sm text-typography-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-primary hover:underline">
          Sign In
        </Link>
      </p>
    </AuthSplitShell>
  );
}
