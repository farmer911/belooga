import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://belooga.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/search",
    "/expert-review",
    "/ats-diagnostics",
    "/cv-studio",
    "/salary-benchmark",
    "/careers",
    "/blog",
    "/blog/how-to-master-the-30-second-pitch",
    "/blog/why-video-resumes-are-the-future",
    "/blog/optimizing-candidate-experience",
    "/help",
    "/contact-us",
    "/privacy-policy",
    "/terms-and-conditions",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/search" ? "daily" : "weekly",
    priority: path === "" ? 1.0 : path === "/search" ? 0.9 : 0.8,
  }));

  return entries;
}
