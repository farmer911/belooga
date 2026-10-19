import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const titleMap: Record<string, string> = {
    "how-to-master-the-30-second-pitch": "How to Master Your 30-Second Video Elevator Pitch",
    "why-video-resumes-are-the-future": "Why Video Resumes Outperform Static PDFs by 3x",
    "optimizing-candidate-experience": "Reinventing the Modern Candidate Discovery Experience"
  };
  const formattedTitle = titleMap[slug] || slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

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
              <Calendar className="w-3.5 h-3.5" /> October 2026
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Belooga Editorial Team
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-typography-main leading-tight">
            {formattedTitle}
          </h1>
        </div>

        <img
          src="/images/blog/blog-1.jpg"
          alt={formattedTitle}
          className="w-full h-80 object-cover rounded-lg"
        />

        <div className="prose max-w-none text-sm text-typography-heading space-y-4 leading-relaxed">
          <p>
            In today's fast-paced recruitment landscape, hiring managers spend an average of less than six seconds glancing at an incoming PDF resume before deciding whether to advance a candidate or pass.
          </p>
          <p>
            A high-impact 30-second elevator pitch breaks through the automated applicant tracking systems (ATS) by instantly establishing human presence, communication clarity, and genuine enthusiasm for the role.
          </p>
          <h2 className="text-xl font-bold text-typography-main pt-4">The Three Pillars of an Effective Pitch</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Hook (0-5s):</strong> State your name, primary craft, and core value proposition.</li>
            <li><strong>Proof (5-20s):</strong> Share a tangible milestone or quantifiable impact from your career.</li>
            <li><strong>Direction (20-30s):</strong> Clarify the kind of mission and engineering culture you want to join next.</li>
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
