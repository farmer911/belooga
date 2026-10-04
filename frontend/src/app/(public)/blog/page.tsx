import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

export default function BlogListPage() {
  const posts = [
    {
      slug: "how-to-master-the-30-second-pitch",
      title: "How to Master Your 30-Second Video Elevator Pitch",
      excerpt: "Proven techniques to articulate your career highlights, project confidence, and hook recruiters in half a minute.",
      date: "October 2026",
      image: "/images/blog/blog-1.jpg",
      author: "Ava Morgan"
    },
    {
      slug: "why-video-resumes-are-the-future",
      title: "Why Video Resumes Outperform Static PDFs by 3x",
      excerpt: "Data from 250+ tech companies reveals how personalized video introductions lead to higher interview conversion rates.",
      date: "September 2026",
      image: "/images/blog/blog-1.jpg",
      author: "Jeremy Tran"
    },
    {
      slug: "optimizing-candidate-experience",
      title: "Reinventing the Modern Candidate Discovery Experience",
      excerpt: "Behind the scenes of Belooga's design system and architectural evolution to Next.js 14 and FastAPI.",
      date: "September 2026",
      image: "/images/blog/blog-1.jpg",
      author: "Engineering Team"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#5bbbae] bg-[#5bbbae]/10 px-3 py-1 rounded-full">
            Insights & Guides
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#252525]">
            Belooga Blog
          </h1>
          <p className="text-sm text-[#737475] max-w-xl mx-auto">
            Practical strategies, career insights, and hiring trends from industry leaders.
          </p>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="bg-white rounded-xl border border-[#d1d6da] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#737475]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.author}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#252525] hover:text-[#5bbbae] transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f0f2f5]">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5bbbae] hover:underline"
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
