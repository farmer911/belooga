import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/query-provider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://belooga.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Belooga — Talent Discovery & Video Elevator Pitch Platform",
    template: "%s | Belooga",
  },
  description:
    "Connect with verified top-tier talent via 0:30 video elevator pitches, structured career timelines, ATS diagnostics, and authentic credentials.",
  keywords: [
    "Belooga",
    "Video Resume",
    "Elevator Pitch",
    "Talent Discovery",
    "ATS Resume Scanner",
    "Expert CV Review",
    "Tech Recruitment",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Belooga",
    title: "Belooga — Talent Discovery & Video Elevator Pitch Platform",
    description:
      "Connect with verified top-tier talent via 0:30 video elevator pitches, structured career timelines, and AI-powered ATS diagnostics.",
    images: [
      {
        url: "/images/home/matt-poster.png",
        width: 1200,
        height: 630,
        alt: "Belooga Talent Discovery Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Belooga — Talent Discovery & Video Elevator Pitch Platform",
    description:
      "Connect with verified top-tier talent via 0:30 video elevator pitches and structured career timelines.",
    images: ["/images/home/matt-poster.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const STRUCTURED_DATA_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Belooga",
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo-big.png`,
      description:
        "Talent Discovery & 30-Second Video Elevator Pitch Recruitment Platform",
    },
    {
      "@type": "WebSite",
      name: "Belooga",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search?key={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('belooga-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&d)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA_JSON_LD),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface-page text-typography-main transition-colors duration-200">
        <QueryProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
