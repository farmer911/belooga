import type { NextConfig } from "next";

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_ORIGIN}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
