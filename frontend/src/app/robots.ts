import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://belooga.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/search",
          "/public/",
          "/expert-review",
          "/ats-diagnostics",
          "/cv-studio",
          "/salary-benchmark",
          "/blog",
          "/careers",
        ],
        disallow: ["/admin/", "/user/*/settings", "/user/*/update"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
