"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, ArrowRight, Clock, ThumbsUp, MessageSquare, Share2, Send, Award, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface BlogCommentItem {
  id: string;
  author_name: string;
  author_username: string;
  content: string;
  created_at: string;
}

export interface BlogPostDTO {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image?: string;
  author: string;
  author_username?: string;
  author_headline?: string;
  author_avatar?: string;
  post_type?: "EDITORIAL" | "USER_STATUS";
  category?: string;
  tags?: string[];
  ats_score_badge?: number | null;
  read_time_minutes?: number;
  likes_count?: number;
  comments_count?: number;
  is_liked_by_me?: boolean;
  comments?: BlogCommentItem[];
  content?: string[];
  key_takeaways?: string[];
}

export const FALLBACK_POSTS: BlogPostDTO[] = [
  {
    id: "editorial-1", slug: "how-to-master-the-30-second-pitch",
    title: "How to Master Your 30-Second Video Elevator Pitch",
    excerpt: "Proven techniques to articulate your career highlights, project confidence, and hook recruiters in half a minute.",
    date: "October 2026", image: "/images/blog/blog-1.jpg", author: "Ava Morgan", author_username: "avamorgan",
    author_headline: "Head of Talent Coaching @ Belooga Editorial", post_type: "EDITORIAL", category: "Video Pitch Mastery",
    tags: ["VideoPitch", "CareerGrowth", "InterviewPrep"], read_time_minutes: 4, likes_count: 42, comments_count: 1,
    comments: [{ id: "c-1", author_name: "Alex Nguyen", author_username: "alexnguyen", content: "Kịch bản 60s Teleprompter trong ATS Studio giúp mình quay 1 lần ăn ngay!", created_at: "2 giờ trước" }],
  },
  {
    id: "status-1", slug: "alex-nguyen-ats-94-golang-milestone",
    title: "Vừa tối ưu CV chuẩn STAR đạt 94/100 điểm ATS cho vị trí Senior Golang @ VNG!",
    excerpt: "Sau khi dùng tính năng Nạp CV Hồ Sơ và 1-Click STAR Tailor trên Belooga, điểm khớp từ khóa PostgreSQL GIN & Distributed Systems của mình tăng từ 68 lên 94/100.",
    date: "Hôm nay", author: "Alex Nguyen", author_username: "alexnguyen", author_headline: "Senior Distributed Systems Engineer",
    post_type: "USER_STATUS", tags: ["Golang", "PostgreSQL", "ATSScore", "SystemDesign"], ats_score_badge: 94, likes_count: 29, comments_count: 1,
    comments: [{ id: "c-2", author_name: "Minh Tran", author_username: "minhtran", content: "Chúc mừng bác! Điểm STAR Impact 24/25 quá đỉnh.", created_at: "1 giờ trước" }],
  },
  {
    id: "editorial-2", slug: "why-video-resumes-are-the-future",
    title: "Why Video Resumes Outperform Static PDFs by 3x",
    excerpt: "Data from 250+ tech companies reveals how personalized video introductions lead to higher interview conversion rates.",
    date: "September 2026", image: "/images/blog/blog-1.jpg", author: "Jeremy Tran", author_username: "jeremytran",
    author_headline: "Principal Talent Researcher @ Belooga", post_type: "EDITORIAL", category: "Hiring Data",
    tags: ["HiringTrends", "VideoResume"], read_time_minutes: 5, likes_count: 35, comments_count: 0,
  },
  {
    id: "editorial-3", slug: "optimizing-candidate-experience",
    title: "Reinventing the Modern Candidate Discovery Experience",
    excerpt: "Behind the scenes of Belooga's design system and architectural evolution to Next.js 16.3.8, PostgreSQL 16 GIN, and FastAPI.",
    date: "September 2026", image: "/images/blog/blog-1.jpg", author: "Engineering Team", author_username: "alexnguyen",
    author_headline: "Belooga Core Platform Engineering", post_type: "EDITORIAL", category: "Platform Engineering",
    tags: ["NextJS", "FastAPI", "PostgreSQL"], read_time_minutes: 6, likes_count: 51, comments_count: 0,
  },
];

interface SocialFeedCardProps {
  post: BlogPostDTO;
  onToggleLike: (post: BlogPostDTO) => void;
  onAddComment: (post: BlogPostDTO, content: string) => void;
}

export function SocialFeedCard({ post, onToggleLike, onAddComment }: SocialFeedCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sharedCopied, setSharedCopied] = useState(false);

  const isUserPost = post.post_type === "USER_STATUS";
  const username = post.author_username || "alexnguyen";
  const likesCount = post.likes_count ?? 12;
  const commentsList = post.comments ?? [];
  const commentsCount = post.comments_count ?? commentsList.length;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post, commentText.trim());
    setCommentText("");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(`${window.location.origin}/blog/${post.slug}`);
      setSharedCopied(true);
      setTimeout(() => setSharedCopied(false), 2000);
    }
  };

  return (
    <article data-testid={`blog-feed-card-${post.slug}`} className="bg-surface-card rounded-xl border border-surface-border overflow-hidden shadow-xs hover:border-brand-primary/50 transition-all flex flex-col justify-between">
      <div className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/public/${username}`} className="flex items-center gap-2.5 group">
            <img src={post.author_avatar || "/images/avatar.jpg"} alt={post.author} className="w-10 h-10 rounded-full object-cover border border-surface-border shrink-0" />
            <div>
              <div className="text-xs font-bold text-typography-main group-hover:text-brand-primary transition-colors">{post.author}</div>
              <div className="text-[11px] text-typography-muted line-clamp-1">{post.author_headline || (isUserPost ? "Senior Software Engineer @ Belooga Talent" : "Belooga Editorial Team")}</div>
              <div className="flex items-center gap-1.5 text-[10px] text-typography-muted mt-0.5">
                <Calendar className="w-3 h-3" /><span>{post.date}</span>
                {post.read_time_minutes && <><span>•</span><span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" /> {post.read_time_minutes}m</span></>}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {post.ats_score_badge && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 font-bold">
                <Award className="w-3 h-3" /> ATS {post.ats_score_badge}/100
              </Badge>
            )}
            <Badge variant={isUserPost ? "teal" : "outline"} className="text-[10px]">
              {isUserPost ? "Community Status" : post.category || "Belooga Editorial"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-typography-main hover:text-brand-primary transition-colors">
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>
          <p className="text-xs text-typography-body leading-relaxed whitespace-pre-line">{post.excerpt}</p>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-surface-page border border-surface-border text-[10px] font-semibold text-brand-dark">#{tag}</span>
            ))}
          </div>
        )}

        {post.image && !isUserPost && (
          <img src={post.image} alt={post.title} width={600} height={280} loading="lazy" className="w-full h-44 object-cover rounded-lg border border-surface-border" />
        )}
      </div>

      <div className="px-5 py-3 border-t border-surface-divider bg-surface-page/40 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <button type="button" data-testid={`blog-like-btn-${post.slug}`} onClick={() => onToggleLike(post)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${post.is_liked_by_me ? "bg-teal-50 border-brand-primary text-brand-primary" : "bg-surface-card border-surface-border text-typography-heading hover:border-brand-primary"}`}>
              <ThumbsUp className="w-3.5 h-3.5" /><span>Thích ({likesCount})</span>
            </button>
            <button type="button" data-testid={`blog-comment-toggle-${post.slug}`} onClick={() => setCommentsOpen((prev) => !prev)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-surface-border bg-surface-card hover:border-brand-primary text-typography-heading text-[11px] font-semibold transition-colors cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5" /><span>Bình luận ({commentsCount})</span>
            </button>
            <button type="button" data-testid={`blog-share-btn-${post.slug}`} onClick={handleShare} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-surface-border bg-surface-card hover:border-brand-primary text-typography-heading text-[11px] font-semibold transition-colors cursor-pointer">
              {sharedCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{sharedCopied ? "Đã sao chép" : "Chia sẻ"}</span>
            </button>
          </div>
          {!isUserPost && (
            <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">
              Read Article <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {commentsOpen && (
          <div data-testid={`blog-comments-section-${post.slug}`} className="pt-2 border-t border-surface-divider space-y-2.5">
            {commentsList.map((c) => (
              <div key={c.id} className="p-2.5 rounded-lg bg-surface-card border border-surface-border text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <Link href={`/public/${c.author_username}`} className="font-bold text-typography-main hover:text-brand-primary">{c.author_name}</Link>
                  <span className="text-[10px] text-typography-muted">{c.created_at}</span>
                </div>
                <p className="text-typography-body text-[11px]">{c.content}</p>
              </div>
            ))}
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
              <input type="text" data-testid={`blog-comment-input-${post.slug}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Viết bình luận phản hồi bài đăng này..." className="flex-1 rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs text-typography-main focus:outline-none focus:border-brand-primary" />
              <Button type="submit" size="sm" data-testid={`blog-comment-submit-${post.slug}`} className="bg-brand-primary hover:bg-brand-hover text-white h-8 px-3 text-xs gap-1">
                <Send className="w-3 h-3" /> Gửi
              </Button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
