"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#d1d6da] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo - Strict literal image */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/images/logo-big.png"
            alt="Belooga"
            className="h-[38px] w-auto object-contain shrink-0"
          />
        </Link>

        {/* Navigation & Actions */}
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/search"
            className="text-sm font-medium text-[#515151] hover:text-[#5bbbae] transition-colors"
          >
            Find Talent
          </Link>
          <Link
            href="/expert-review"
            className="hidden md:block text-sm font-medium text-[#515151] hover:text-[#5bbbae] transition-colors"
          >
            Expert Review
          </Link>
          <Link
            href="/careers"
            className="hidden sm:block text-sm font-medium text-[#515151] hover:text-[#5bbbae] transition-colors"
          >
            Careers
          </Link>
          <Link
            href="/blog"
            className="hidden sm:block text-sm font-medium text-[#515151] hover:text-[#5bbbae] transition-colors"
          >
            Blog
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <Link
                href={`/user/${user.username}`}
                className="flex items-center gap-2 text-sm font-medium text-[#252525] hover:text-[#5bbbae]"
              >
                <img
                  src={user.avatarUrl || "/images/avatar.jpg"}
                  alt={user.firstName}
                  className="h-8 w-8 rounded-full object-cover border border-[#d1d6da]"
                />
                <span>{user.firstName}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-[#515151] hover:text-[#5bbbae] transition-colors px-3 py-2"
              >
                Login
              </Link>
              <Link href="/register">
                <Button size="sm" variant="default">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
