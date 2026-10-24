"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { EcosystemMenu } from "@/components/layout/ecosystem-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/common/theme-toggle";

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post("/v1/auth/logout/");
    } catch {
      setMobileMenuOpen(false);
    }
    logout();
    if (
      pathname?.startsWith("/user/") ||
      pathname?.startsWith("/workspace/") ||
      pathname?.startsWith("/admin/") ||
      pathname?.startsWith("/cv-studio")
    ) {
      router.push("/login");
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-surface-card/95 backdrop-blur-sm">
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
        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/search"
            className="text-sm font-medium text-typography-heading hover:text-brand-primary transition-colors"
          >
            Find Talent
          </Link>

          {/* Tools & Ecosystem Dropdown Menu */}
          <EcosystemMenu />

          <Link
            href="/expert-review"
            className="hidden md:block text-sm font-medium text-typography-heading hover:text-brand-primary transition-colors"
          >
            Expert Review
          </Link>
          <Link
            href="/careers"
            className="hidden sm:block text-sm font-medium text-typography-heading hover:text-brand-primary transition-colors"
          >
            Careers
          </Link>
          <Link
            href="/blog"
            className="hidden sm:block text-sm font-medium text-typography-heading hover:text-brand-primary transition-colors"
          >
            Blog
          </Link>

          {/* Theme Switcher Toggle */}
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="hidden md:flex items-center gap-3">
              <NotificationBell />
              <Link
                href={`/user/${user.username}`}
                className="flex items-center gap-2 text-sm font-medium text-typography-main hover:text-brand-primary"
              >
                <img
                  src={user.avatarUrl || "/images/avatar.jpg"}
                  alt={user.firstName}
                  className="h-8 w-8 rounded-full object-cover border border-surface-border"
                />
                <span>{user.firstName}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-typography-heading hover:text-brand-primary transition-colors px-2.5 py-1.5"
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

          {isAuthenticated && user && (
            <div className="md:hidden flex items-center">
              <NotificationBell />
            </div>
          )}

          {/* Mobile Responsive Menu Toggle (<768px) */}
          <button
            type="button"
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-surface-border bg-surface-card hover:bg-surface-page text-typography-heading hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          data-testid="mobile-nav-drawer"
          className="md:hidden border-t border-surface-border bg-surface-card px-4 py-4 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link
              href="/search"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              Find Talent
            </Link>
            <Link
              href="/expert-review"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              Expert Review
            </Link>
            <Link
              href="/careers"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              Careers
            </Link>
            <Link
              href="/blog"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              Blog
            </Link>
            <Link
              href="/ats-diagnostics"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              ATS Diagnostics
            </Link>
            <Link
              href="/salary-benchmark"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              Tra Cứu Lương IT
            </Link>
            <Link
              href="/cv-studio"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              Pro CV Studio
            </Link>
            <Link
              href="/workspace/jobs"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              Job Tracker
            </Link>
            <Link
              href="/admin/analytics"
              className="px-3 py-2 rounded-lg text-typography-heading hover:bg-surface-page hover:text-brand-primary font-medium"
            >
              Executive Analytics
            </Link>
          </div>

          <div className="pt-2 border-t border-surface-divider flex items-center justify-between gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={`/user/${user.username}`}
                  className="flex items-center gap-2 text-sm font-medium text-typography-main hover:text-brand-primary"
                >
                  <img
                    src={user.avatarUrl || "/images/avatar.jpg"}
                    alt={user.firstName}
                    className="h-8 w-8 rounded-full object-cover border border-surface-border"
                  />
                  <span>{user.firstName}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button variant="default" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
