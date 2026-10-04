"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Process OAuth code or token exchange
    const timer = setTimeout(() => {
      router.push("/user/alexnguyen");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#5bbbae]" />
      <h2 className="text-lg font-bold text-[#252525]">Completing Authentication Handshake...</h2>
      <p className="text-xs text-[#737475]">Please wait while we verify your session with the identity provider.</p>
    </div>
  );
}
