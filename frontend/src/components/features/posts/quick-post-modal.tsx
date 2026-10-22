"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PenSquare, X } from "lucide-react";
import { apiClient } from "@/services/api-client";
import { Button } from "@/components/ui/button";

export interface UserPostComment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface UserPostItem {
  id: string;
  username: string;
  author_name: string;
  title: string;
  category: string;
  body: string;
  tags: string[];
  attachment_link?: string;
  likes_count: number;
  comments: UserPostComment[];
  created_at: string;
}

const LOCAL_POSTS_KEY = "belooga_user_posts_v1";

export const DEFAULT_USER_POSTS: UserPostItem[] = [
  {
    id: "upost-1",
    username: "phucnguyen",
    author_name: "Nguyễn Minh Phúc",
    title: "Kiến trúc tối ưu FastAPI Async & Singleflight Cache chịu tải 25,000 CCU",
    category: "Chia sẻ kiến thức",
    body: "Khi thiết kế hệ thống tìm kiếm ứng viên thời gian thực với TSVECTOR trên PostgreSQL 16, việc kết hợp Singleflight Cache và Keyset Pagination giúp giảm 84% độ trễ P99.",
    tags: ["Python", "FastAPI", "PostgreSQL", "System Design"],
    attachment_link: "https://github.com/farmer911/belooga",
    likes_count: 34,
    comments: [
      { id: "uc-1", author_name: "Tech Recruiter @ VNG", content: "Bài viết rất thực chiến, bên mình đang tuyển Principal Backend!", created_at: "2 giờ trước" },
    ],
    created_at: "2026-10-22",
  },
];

export function readLocalPosts(): UserPostItem[] {
  if (typeof window === "undefined") return DEFAULT_USER_POSTS;
  try {
    const raw = window.localStorage.getItem(LOCAL_POSTS_KEY);
    return raw ? (JSON.parse(raw) as UserPostItem[]) : DEFAULT_USER_POSTS;
  } catch {
    return DEFAULT_USER_POSTS;
  }
}

export function writeLocalPosts(posts: UserPostItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  } catch {
    // ignore
  }
}

interface QuickPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  authorName?: string;
  editingPost?: UserPostItem | null;
}

export function QuickPostModal({
  isOpen,
  onClose,
  username = "phucnguyen",
  authorName = "Belooga Member",
  editingPost = null,
}: QuickPostModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(editingPost?.title ?? "");
  const [category, setCategory] = useState(editingPost?.category ?? "Chia sẻ kiến thức");
  const [body, setBody] = useState(editingPost?.body ?? "");
  const [tagsText, setTagsText] = useState(editingPost?.tags?.join(", ") ?? "Python, FastAPI, React 19");
  const [link, setLink] = useState(editingPost?.attachment_link ?? "");

  React.useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setCategory(editingPost.category);
      setBody(editingPost.body);
      setTagsText(editingPost.tags.join(", "));
      setLink(editingPost.attachment_link ?? "");
    } else {
      setTitle("");
      setBody("");
      setLink("");
    }
  }, [editingPost, isOpen]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsText.split(",").map((s) => s.trim()).filter(Boolean);
      if (editingPost) {
        try {
          await apiClient.patch(`/v1/posts/${editingPost.id}`, { title, category, body, tags, attachment_link: link });
        } catch {
          // Fallback local update
        }
        const updated = readLocalPosts().map((p) =>
          p.id === editingPost.id ? { ...p, title, category, body, tags, attachment_link: link || undefined } : p
        );
        writeLocalPosts(updated);
        return updated;
      }

      const newPost: UserPostItem = {
        id: `upost-${Date.now()}`,
        username,
        author_name: authorName,
        title: title.trim() || "Chia sẻ chuyên môn từ Belooga Workspace",
        category,
        body: body.trim(),
        tags,
        attachment_link: link.trim() || undefined,
        likes_count: 1,
        comments: [],
        created_at: "Vừa xong",
      };
      try {
        await apiClient.post("/v1/posts/", {
          title: newPost.title,
          category: newPost.category,
          body: newPost.body,
          tags: newPost.tags,
          attachment_link: newPost.attachment_link,
        });
      } catch {
        // Fallback local save
      }
      const next = [newPost, ...readLocalPosts()];
      writeLocalPosts(next);
      return next;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile-posts"] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div
      data-testid="quick-post-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-surface-card border border-surface-border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl text-xs">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <PenSquare className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <h3 className="font-bold text-typography-main text-sm">
              {editingPost ? "Chỉnh Sửa Bài Viết Chuyên Môn" : "Đăng Bài Viết & Chia Sẻ Chuyên Môn"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-typography-muted hover:text-typography-main cursor-pointer">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim() && !title.trim()) return;
            submitMutation.mutate();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-typography-heading block">Tiêu đề bài viết *</label>
              <input
                type="text"
                data-testid="user-post-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kinh nghiệm tối ưu FastAPI Async & ATS 94%..."
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-typography-heading block">Chủ đề</label>
              <select
                aria-label="Chủ đề bài viết"
                data-testid="user-post-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-page border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-typography-main"
              >
                <option value="Chia sẻ kiến thức">Chia sẻ kiến thức</option>
                <option value="Kinh nghiệm phỏng vấn">Kinh nghiệm phỏng vấn</option>
                <option value="Dự án thực tế">Dự án thực tế</option>
                <option value="Góc tuyển dụng">Góc tuyển dụng</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-typography-heading block">Nội dung chia sẻ *</label>
            <textarea
              rows={4}
              data-testid="user-post-body-input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Viết bài chia sẻ kiến thức, case study kỹ thuật, kinh nghiệm phỏng vấn..."
              className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-2 text-xs text-typography-main"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-typography-heading block">Thẻ kỹ năng (Tags)</label>
              <input
                type="text"
                data-testid="user-post-tags-input"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="Python, FastAPI, React 19"
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-typography-heading block">Link đính kèm (GitHub / Dự án)</label>
              <input
                type="text"
                data-testid="user-post-link-input"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-surface-page border border-surface-border rounded-lg px-3 py-1.5 text-xs text-typography-main"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-typography-muted hover:text-typography-main cursor-pointer">
              Hủy
            </button>
            <Button
              type="submit"
              data-testid="user-post-submit-btn"
              disabled={submitMutation.isPending}
              className="bg-brand-primary hover:bg-brand-hover text-white text-xs h-8 px-4 rounded-lg"
            >
              {editingPost ? "Lưu Cập Nhật" : "Đăng Bài Viết Ngay"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
