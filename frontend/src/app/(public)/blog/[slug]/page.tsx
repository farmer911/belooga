"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/api-client";
import type { BlogPostDTO } from "../page";

const TITLE_MAP: Record<string, string> = {
  "how-to-master-the-30-second-pitch": "How to Master Your 30-Second Video Elevator Pitch",
  "why-video-resumes-are-the-future": "Why Video Resumes Outperform Static PDFs by 3x",
  "optimizing-candidate-experience": "Reinventing the Modern Candidate Discovery Experience",
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = (params.slug as string) || "how-to-master-the-30-second-pitch";

  const { data: article } = useQuery<BlogPostDTO>({
    queryKey: ["cms-blog-post", slug],
    queryFn: async () => (await apiClient.get<BlogPostDTO>(`/v1/blog/posts/${slug}/`)).data,
    enabled: Boolean(slug),
  });

  const formattedTitle =
    article?.title ||
    TITLE_MAP[slug] ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const paragraphs = article?.content?.length
    ? article.content
    : [
        "In today's fast-paced recruitment landscape, hiring managers spend an average of less than six seconds glancing at an incoming PDF resume before deciding whether to advance a candidate or pass.",
        "A high-impact 30-second elevator pitch breaks through the automated applicant tracking systems (ATS) by instantly establishing human presence, communication clarity, and genuine enthusiasm for the role.",
      ];

  const takeaways = article?.key_takeaways?.length
    ? article.key_takeaways
    : [
        "Hook (0-5s): State your name, primary craft, and core value proposition.",
        "Proof (5-20s): Share a tangible milestone or quantifiable impact from your career.",
        "Direction (20-30s): Clarify the kind of mission and engineering culture you want to join next.",
      ];

  return (
    <div className="min-h-screen bg-surface-page py-16">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 bg-surface-card border border-surface-border rounded-xl p-8 shadow-sm">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
        </Link>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs text-typography-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {article?.date || "October 2026"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {article?.author || "Belooga Editorial Team"}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-typography-main leading-tight">
            {formattedTitle}
          </h1>
        </div>

        <img
          src={article?.image || "/images/blog/blog-1.jpg"}
          alt={formattedTitle}
          width={800}
          height={320}
          className="w-full h-80 object-cover rounded-lg"
        />

        <div className="prose max-w-none text-sm text-typography-heading space-y-4 leading-relaxed">
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
          <h2 className="text-xl font-bold text-typography-main pt-4">
            The Three Pillars of an Effective Pitch
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            {takeaways.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Career Acceleration Conversion Funnel CTA */}
        <div
          data-testid="blog-career-tools-cta"
          className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Put This Guide Into Action
            </span>
            <h3 className="text-base font-extrabold">
              Audit Your Resume & Generate Your 60s Pitch Script Instantly
            </h3>
            <p className="text-xs text-slate-300">
              Run our free ATS CV-to-JD diagnostic scanner or book a 1-on-1 review with a Senior Engineering Leader.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/ats-diagnostics">
              <Button size="sm" className="bg-brand-primary hover:bg-brand-hover text-white text-xs">
                Run ATS Scan
              </Button>
            </Link>
            <Link href="/expert-review">
              <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700 text-xs">
                Expert Review
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
