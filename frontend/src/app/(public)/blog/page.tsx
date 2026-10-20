"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { apiClient } from "@/services/api-client";

export interface BlogPostDTO {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  author: string;
  category?: string;
  read_time_minutes?: number;
  content?: string[];
  key_takeaways?: string[];
}

const FALLBACK_POSTS: BlogPostDTO[] = [
  {
    slug: "how-to-master-the-30-second-pitch",
    title: "How to Master Your 30-Second Video Elevator Pitch",
    excerpt:
      "Proven techniques to articulate your career highlights, project confidence, and hook recruiters in half a minute.",
    date: "October 2026",
    image: "/images/blog/blog-1.jpg",
    author: "Ava Morgan",
    category: "Video Pitch Mastery",
    read_time_minutes: 4,
  },
  {
    slug: "why-video-resumes-are-the-future",
    title: "Why Video Resumes Outperform Static PDFs by 3x",
    excerpt:
      "Data from 250+ tech companies reveals how personalized video introductions lead to higher interview conversion rates.",
    date: "September 2026",
    image: "/images/blog/blog-1.jpg",
    author: "Jeremy Tran",
    category: "Hiring Data",
    read_time_minutes: 5,
  },
  {
    slug: "optimizing-candidate-experience",
    title: "Reinventing the Modern Candidate Discovery Experience",
    excerpt:
      "Behind the scenes of Belooga's design system and architectural evolution to Next.js 16.3.8, PostgreSQL 16 GIN, and FastAPI.",
    date: "September 2026",
    image: "/images/blog/blog-1.jpg",
    author: "Engineering Team",
    category: "Platform Engineering",
    read_time_minutes: 6,
  },
];

export default function BlogListPage() {
  const { data: posts = FALLBACK_POSTS } = useQuery<BlogPostDTO[]>({
    queryKey: ["cms-blog-posts"],
    queryFn: async () => (await apiClient.get<BlogPostDTO[]>("/v1/blog/posts/")).data,
    placeholderData: FALLBACK_POSTS,
  });

  return (
    <div className="min-h-screen bg-surface-page py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
            Insights & Guides
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-typography-main">
            Belooga Blog
          </h1>
          <p className="text-sm text-typography-muted max-w-xl mx-auto">
            Practical strategies, career insights, and hiring trends from industry leaders.
          </p>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="bg-surface-card rounded-xl border border-surface-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <img
                src={post.image}
                alt={post.title}
                width={600}
                height={320}
                loading="lazy"
                className="w-full h-48 object-cover"
              />
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-typography-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.author}</span>
                    {post.read_time_minutes && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {post.read_time_minutes}m
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-typography-main hover:text-brand-primary transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-xs text-typography-body leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-surface-divider">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    Read Article <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
