"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, Award } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SocialFeedCard, BlogPostDTO } from "@/components/features/blog/social-feed-card";
import { CommunityCvRoastSection } from "@/components/features/growth/community-company-suite";
import { prependAndInvalidateList, replaceAndInvalidateByKey } from "@/lib/query-cache-utils";

export type { BlogPostDTO };

export default function BlogListPage() {
  const queryClient = useQueryClient();
  const [feedTab, setFeedTab] = useState<"ALL" | "USER_STATUS" | "EDITORIAL">("ALL");
  const [statusTitle, setStatusTitle] = useState("");
  const [statusContent, setStatusContent] = useState("");
  const [statusTags, setStatusTags] = useState("Golang, SystemDesign, Career");
  const [attachAtsBadge, setAttachAtsBadge] = useState(true);

  const { data: apiPosts = [] } = useQuery<BlogPostDTO[]>({
    queryKey: ["cms-blog-posts"],
    queryFn: async () => {
      const res = await apiClient.get<BlogPostDTO[]>("/v1/blog/posts/");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const normalizedPosts = apiPosts.map((p) => ({
    ...p,
    post_type:
      p.post_type ||
      (p.slug.includes("pitch") || p.slug.includes("video") || p.slug.includes("candidate")
        ? "EDITORIAL"
        : "USER_STATUS"),
  }));

  const visiblePosts = normalizedPosts.filter((p) => (feedTab === "ALL" ? true : p.post_type === feedTab));

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const parsedTags = statusTags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);
      const res = await apiClient.post<BlogPostDTO>("/v1/blog/posts/", {
        title: statusTitle.trim() || statusContent.trim().slice(0, 72),
        excerpt: statusContent.trim(),
        content: [statusContent.trim()],
        post_type: "USER_STATUS",
        tags: parsedTags,
        ats_score_badge: attachAtsBadge ? 92 : null,
      });
      return res.data;
    },
    onSuccess: (created) => {
      setStatusTitle("");
      setStatusContent("");
      prependAndInvalidateList(queryClient, ["cms-blog-posts"], created);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (target: BlogPostDTO) => {
      const res = await apiClient.post<BlogPostDTO>(`/v1/blog/posts/${target.id || target.slug}/like`, {});
      return res.data;
    },
    onSuccess: (updated) => {
      replaceAndInvalidateByKey(queryClient, ["cms-blog-posts"], updated, (p, next) => p.slug === next.slug);
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ target, content }: { target: BlogPostDTO; content: string }) => {
      const res = await apiClient.post<BlogPostDTO>(`/v1/blog/posts/${target.id || target.slug}/comments`, {
        content,
      });
      return res.data;
    },
    onSuccess: (updated) => {
      replaceAndInvalidateByKey(queryClient, ["cms-blog-posts"], updated, (p, next) => p.slug === next.slug);
    },
  });

  const handlePublishStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusContent.trim()) return;
    createPostMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-surface-page py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2.5">
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
            Community Social Feed & Career Insights
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-typography-main">Belooga Blog</h1>
          <p className="text-sm text-typography-muted max-w-2xl mx-auto">
            Chia sẻ kinh nghiệm phỏng vấn, khoe thẻ điểm ATS, thảo luận trực tiếp cùng cộng đồng kỹ sư và đọc các bài phân tích chuyên sâu.
          </p>
        </div>

        <Card data-testid="blog-post-composer" className="p-5 bg-surface-card border border-surface-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-typography-main flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>Đăng Chia Sẻ Kinh Nghiệm / Status Cộng Đồng</span>
            </span>
            <button type="button" data-testid="blog-composer-ats-toggle" onClick={() => setAttachAtsBadge((prev) => !prev)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${attachAtsBadge ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-surface-page border-surface-border text-typography-muted"}`}>
              <Award className="w-3.5 h-3.5" />
              <span>{attachAtsBadge ? "Đính kèm Thẻ Điểm ATS (92/100)" : "+ Đính kèm Thẻ Điểm ATS"}</span>
            </button>
          </div>

          <form onSubmit={handlePublishStatus} className="space-y-2.5">
            <input type="text" data-testid="blog-composer-title" value={statusTitle} onChange={(e) => setStatusTitle(e.target.value)} placeholder="Tiêu đề ngắn gọn (VD: Kinh nghiệm pass vòng System Design tại Shopee...)" className="w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-xs text-typography-main focus:outline-none focus:border-brand-primary" />
            <textarea rows={3} data-testid="blog-composer-textarea" value={statusContent} onChange={(e) => setStatusContent(e.target.value)} placeholder="Bạn đang muốn chia sẻ bí quyết tối ưu CV, phỏng vấn hay góc nhìn công nghệ gì với cộng đồng Belooga?" className="w-full rounded-lg border border-surface-border bg-surface-page p-3 text-xs text-typography-main focus:outline-none focus:border-brand-primary resize-y" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <input type="text" data-testid="blog-composer-tags" value={statusTags} onChange={(e) => setStatusTags(e.target.value)} placeholder="Tags cách nhau dấu phẩy: Golang, SystemDesign, ATS" className="flex-1 min-w-[200px] rounded-lg border border-surface-border bg-surface-page px-3 py-1.5 text-xs text-typography-main" />
              <Button type="submit" data-testid="blog-composer-submit" disabled={createPostMutation.isPending || !statusContent.trim()} className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold px-4 h-8 rounded-lg gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>{createPostMutation.isPending ? "Đang đăng..." : "Đăng Bài Lên Bảng Tin"}</span>
              </Button>
            </div>
          </form>
        </Card>

        <CommunityCvRoastSection />
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" data-testid="blog-tab-all" onClick={() => setFeedTab("ALL")} className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${feedTab === "ALL" ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading"}`}>
              Tất cả bảng tin ({normalizedPosts.length})
            </button>
            <button type="button" data-testid="blog-tab-user" onClick={() => setFeedTab("USER_STATUS")} className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${feedTab === "USER_STATUS" ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading"}`}>
              Bài đăng từ User (Community Feed)
            </button>
            <button type="button" data-testid="blog-tab-editorial" onClick={() => setFeedTab("EDITORIAL")} className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${feedTab === "EDITORIAL" ? "bg-brand-primary text-white" : "bg-surface-card border border-surface-border text-typography-heading"}`}>
              Bài viết từ Hệ thống (Belooga Editorial)
            </button>
          </div>
        </div>

        <div data-testid="blog-social-feed-list" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visiblePosts.map((post) => (
            <SocialFeedCard
              key={post.slug}
              post={post}
              onToggleLike={(target) => likeMutation.mutate(target)}
              onAddComment={(target, content) => commentMutation.mutate({ target, content })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
