"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PenSquare, Trash2, Edit3, ThumbsUp, MessageSquare, Send, ExternalLink, Plus } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import {
  QuickPostModal,
  UserPostItem,
  UserPostComment,
  DEFAULT_USER_POSTS,
  readLocalPosts,
  writeLocalPosts,
} from "@/components/features/posts/quick-post-modal";

interface UserProfilePostsSectionProps {
  username: string;
  authorName?: string;
  isOwner: boolean;
}

export function UserProfilePostsSection({ username, authorName = username, isOwner }: UserProfilePostsSectionProps) {
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<UserPostItem | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const { data: posts = DEFAULT_USER_POSTS } = useQuery<UserPostItem[]>({
    queryKey: ["user-profile-posts", username],
    queryFn: async () => {
      try {
        const res = await apiClient.get<UserPostItem[]>(`/v1/posts/user/${username}`);
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {
        // Fallback to local persisted posts
      }
      return readLocalPosts();
    },
  });

  const handleDelete = async (postId: string) => {
    try {
      await apiClient.delete(`/v1/posts/${postId}`);
    } catch {
      // Fallback
    }
    const next = posts.filter((p) => p.id !== postId);
    writeLocalPosts(next);
    queryClient.setQueryData(["user-profile-posts", username], next);
  };

  const handleLike = async (postId: string) => {
    try {
      await apiClient.post(`/v1/posts/${postId}/like`);
    } catch {
      // Fallback
    }
    const next = posts.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    writeLocalPosts(next);
    queryClient.setQueryData(["user-profile-posts", username], next);
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentTexts[postId] || "").trim();
    if (!text) return;
    try {
      await apiClient.post(`/v1/posts/${postId}/comments`, { content: text });
    } catch {
      // Fallback
    }
    const newComment: UserPostComment = {
      id: `uc-${Date.now()}`,
      author_name: "Nhà Tuyển Dụng / Thành Viên",
      content: text,
      created_at: "Vừa xong",
    };
    const next = posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    writeLocalPosts(next);
    queryClient.setQueryData(["user-profile-posts", username], next);
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <section
      data-testid={isOwner ? "profile-posts-section" : "public-profile-posts-section"}
      className="bg-surface-card rounded-xl border border-surface-border p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PenSquare className="w-5 h-5 text-brand-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-typography-main">Bài Viết Đã Đăng (Published Posts)</h2>
          <span className="px-2 py-0.5 rounded-full bg-surface-page border border-surface-border text-xs font-bold">{posts.length}</span>
        </div>
        {isOwner && (
          <Button
            type="button"
            data-testid="profile-new-post-btn"
            onClick={() => {
              setEditingPost(null);
              setComposerOpen(true);
            }}
            className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-3.5 rounded-lg gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Viết Bài Chia Sẻ Mới</span>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.id} data-testid={`user-post-card-${post.id}`} className="p-4 rounded-xl bg-surface-page border border-surface-border space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded bg-brand-overlay text-brand-dark text-[10px] font-bold">{post.category}</span>
                <h3 className="font-bold text-typography-main text-sm mt-1">{post.title}</h3>
              </div>
              {isOwner && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid={`user-post-edit-btn-${post.id}`}
                    onClick={() => {
                      setEditingPost(post);
                      setComposerOpen(true);
                    }}
                    className="p-1.5 rounded hover:bg-surface-card text-typography-muted hover:text-brand-primary cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    data-testid={`user-post-delete-btn-${post.id}`}
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 rounded hover:bg-surface-card text-typography-muted hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-typography-body leading-relaxed">{post.body}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-surface-card border border-surface-border text-[10px] font-mono text-typography-heading">#{t}</span>
              ))}
              {post.attachment_link && (
                <a href={post.attachment_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-primary font-semibold underline ml-auto">
                  <ExternalLink className="w-3 h-3" aria-hidden="true" /> Xem dự án đính kèm
                </a>
              )}
            </div>
            <div className="pt-2 border-t border-surface-border flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid={`user-post-like-btn-${post.id}`}
                  onClick={() => handleLike(post.id)}
                  className="inline-flex items-center gap-1 font-semibold text-typography-heading hover:text-brand-primary cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{post.likes_count} Thích</span>
                </button>
                <span className="inline-flex items-center gap-1 text-typography-muted">
                  <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{post.comments.length} Bình luận</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                <input
                  type="text"
                  data-testid={`user-post-comment-input-${post.id}`}
                  value={commentTexts[post.id] || ""}
                  onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Viết bình luận..."
                  className="flex-1 bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-xs text-typography-main"
                />
                <button
                  type="button"
                  data-testid={`user-post-comment-submit-${post.id}`}
                  onClick={() => handleAddComment(post.id)}
                  className="p-1.5 rounded-lg bg-brand-primary text-white cursor-pointer"
                >
                  <Send className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            </div>
            {post.comments.length > 0 && (
              <div className="space-y-1 pt-1">
                {post.comments.map((c) => (
                  <div key={c.id} className="text-[11px] bg-surface-card rounded px-2.5 py-1 border border-surface-border">
                    <strong>{c.author_name}:</strong> {c.content}
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <QuickPostModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        username={username}
        authorName={authorName}
        editingPost={editingPost}
      />
    </section>
  );
}
