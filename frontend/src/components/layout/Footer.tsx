import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-border bg-surface-card py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <img
              src="/images/logo-big.png"
              alt="Belooga"
              className="h-[32px] w-auto"
            />
            <p className="text-sm text-typography-muted">
              Connecting exceptional talent with forward-thinking teams through 0:30 video elevator pitches and transparent credentials.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-typography-main mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-typography-heading">
              <li>
                <Link href="/search" className="hover:text-brand-primary transition-colors">
                  Browse Candidates
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-brand-primary transition-colors">
                  Create Candidate Profile
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-brand-primary transition-colors">
                  Careers at Belooga
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-typography-main mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-typography-heading">
              <li>
                <Link href="/blog" className="hover:text-brand-primary transition-colors">
                  Blog & Industry Insights
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-brand-primary transition-colors">
                  Help Center & FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-brand-primary transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-typography-main mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-typography-heading">
              <li>
                <Link href="/privacy-policy" className="hover:text-brand-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-brand-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-divider pt-8 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-typography-muted">
          <p>© {new Date().getFullYear()} Belooga Inc. All rights reserved.</p>
          <p>Built with Next.js 16, Bun, Tailwind CSS v4 & FastAPI.</p>
        </div>
      </div>
    </footer>
  );
}
