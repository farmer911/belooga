import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://belooga.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface SitemapApiData {
  public_usernames?: string[];
  blog_slugs?: string[];
  static_routes?: string[];
}

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

  let publicUsernames: string[] = [];
  try {
    const res = await fetch(`${API_URL}/v1/seo/sitemap-data`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = (await res.json()) as SitemapApiData;
      publicUsernames = data.public_usernames || [];
    }
  } catch {
    publicUsernames = [];
  }

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/search" ? "daily" : "weekly",
    priority: path === "" ? 1.0 : path === "/search" ? 0.9 : 0.8,
  }));

  const candidateEntries: MetadataRoute.Sitemap = publicUsernames.map((uname) => ({
    url: `${BASE_URL}/public/${uname}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...candidateEntries];
}
