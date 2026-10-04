"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Availability validation states
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounced Username Check
  useEffect(() => {
    if (!username || username.trim().length < 3) {
      setUsernameStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const res = await apiClient.get(`/v1/users/exists/username/?username=${encodeURIComponent(username.trim())}`);
        setUsernameStatus(res.data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  // Debounced Email Check
  useEffect(() => {
    if (!email || !email.includes("@")) {
      setEmailStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setEmailStatus("checking");
      try {
        const res = await apiClient.get(`/v1/users/exists/email/?email=${encodeURIComponent(email.trim())}`);
        setEmailStatus(res.data.available ? "available" : "taken");
      } catch {
        setEmailStatus("idle");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (usernameStatus === "taken" || emailStatus === "taken") {
      setErrorMessage("Please select a unique email and username.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post("/v1/users/register/", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });

      const { access_token, user } = response.data;
      setAccessToken(access_token);
      setUser(user);

      // Redirect directly to candidate workspace
      router.push(`/user/${user.username}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Registration failed. Please verify your details.";
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-[#f8f9fa]">
      {/* Left Column: Register Form */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-[#252525] tracking-tight">
              Create Candidate Profile
            </h1>
            <p className="text-sm text-[#737475]">
              Showcase your talent with a 0:30 video pitch and a verified career timeline.
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Names row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#515151]">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full px-3 py-2 bg-white border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#515151]">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-white border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
            </div>

            {/* Username with Availability Indicator */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#515151]">
                  Username (CV URL Slug)
                </label>
                {usernameStatus === "checking" && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                  </span>
                )}
                {usernameStatus === "available" && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Available
                  </span>
                )}
                {usernameStatus === "taken" && (
                  <span className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> Already taken
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="janedoe"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
              <p className="text-[11px] text-[#737475]">
                Your public CV will be at: belooga.com/public/{username || "username"}
              </p>
            </div>

            {/* Email with Availability Indicator */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#515151]">
                  Email Address
                </label>
                {emailStatus === "checking" && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                  </span>
                )}
                {emailStatus === "available" && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
                {emailStatus === "taken" && (
                  <span className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> Registered
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#515151]">
                Password (min 8 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#d1d6da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5bbbae]"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#d1d6da] text-[#5bbbae] focus:ring-[#5bbbae]"
              />
              <label htmlFor="terms" className="text-xs text-[#515151]">
                I agree to Belooga's{" "}
                <Link href="/terms-and-conditions" className="text-[#5bbbae] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-[#5bbbae] hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full bg-[#5bbbae] hover:bg-[#497d76] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? "Creating Profile..." : "Complete Registration"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-[#737475]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#5bbbae] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Hero Split Visual with #d7ecea Tint */}
      <div className="hidden lg:relative lg:flex flex-col justify-end p-12 bg-slate-900 overflow-hidden">
        <img
          src="/images/home/matt-poster.png"
          alt="Belooga Talent Community"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-[#d7ecea] opacity-25 mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 max-w-lg text-white space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-[#5bbbae]/20 border border-[#5bbbae]/40 text-[#3fc6b7] text-xs font-semibold uppercase tracking-wider">
            Candidate First
          </div>
          <h2 className="text-3xl font-extrabold leading-snug">
            Your skills speak louder when you tell your own story.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Record a personalized video elevator pitch, organize your career history, and let top companies discover the real professional behind the resume.
          </p>
        </div>
      </div>
    </div>
  );
}
