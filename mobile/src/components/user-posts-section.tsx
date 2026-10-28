import React, { useState } from "react";
import {
  USER_POST_CATEGORIES,
  type UserPostCategory,
  type UserPostItem,
  useCommentUserPostMutation,
  useCreateUserPostMutation,
  useDeleteUserPostMutation,
  useLikeUserPostMutation,
  useUpdateUserPostMutation,
  useUserPostsByUsernameQuery,
} from "@/hooks/use-mobile-user-posts";
import { Body, Button, Card, ErrorText, Field, H2, Pill, Row, Sheet, Well } from "@/lib/ui";
import { useMobileAuthStore } from "@/store/auth-store";

const EMPTY_DRAFT = { title: "", content: "", tags: "", attachmentUrl: "" };

export interface UserPostsSectionProps {
  username: string;
  isOwner?: boolean;
}

export function UserPostsSection({ username, isOwner = false }: UserPostsSectionProps) {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [category, setCategory] = useState<UserPostCategory>(USER_POST_CATEGORIES[0]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const postsQuery = useUserPostsByUsernameQuery(username);
  const createMutation = useCreateUserPostMutation();
  const updateMutation = useUpdateUserPostMutation();
  const deleteMutation = useDeleteUserPostMutation();
  const likeMutation = useLikeUserPostMutation();
  const commentMutation = useCommentUserPostMutation();
  const posts = postsQuery.data ?? [];
  const setField = (key: keyof typeof EMPTY_DRAFT) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const openEditor = (post: UserPostItem | null) => {
    setEditingPostId(post?.id ?? null);
    setCategory(post?.category ?? USER_POST_CATEGORIES[0]);
    setDraft(
      post
        ? { title: post.title, content: post.content, tags: post.tags.join(", "), attachmentUrl: post.attachment_url ?? "" }
        : EMPTY_DRAFT
    );
    setComposerOpen(true);
  };

  const submitPost = () => {
    const input = {
      title: draft.title.trim(),
      category,
      content: draft.content.trim(),
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      attachment_url: draft.attachmentUrl.trim() || null,
    };
    const done = { onSuccess: () => setComposerOpen(false) };
    if (editingPostId) updateMutation.mutate({ postId: editingPostId, input }, done);
    else createMutation.mutate(input, done);
  };

  return (
    <>
      <Card testID="profile-posts-section">
        <Row style={{ justifyContent: "space-between" }}>
          <H2>Articles by @{username}</H2>
          {isOwner ? <Button testID="mobile-quick-post-open-btn" label="+ Đăng Bài" onPress={() => openEditor(null)} /> : null}
        </Row>
        <ErrorText error={postsQuery.error ?? deleteMutation.error ?? likeMutation.error ?? commentMutation.error} />
        {postsQuery.isSuccess && posts.length === 0 ? <Body>No posts yet.</Body> : null}
        {posts.map((post) => (
          <Well key={post.id} testID={`mobile-user-post-card-${post.id}`}>
            <Row style={{ justifyContent: "space-between" }}>
              <Pill label={post.category} />
              <Body>
                {post.likes_count} likes • {post.comments_count} comments
              </Body>
            </Row>
            <H2>{post.title}</H2>
            <Body>{post.content}</Body>
            {isAuthenticated ? (
              <>
                <Row>
                  <Button testID={`user-post-like-btn-${post.id}`} variant="secondary" label={`Like (${post.likes_count})`} onPress={() => likeMutation.mutate(post.id)} />
                  {isOwner ? (
                    <>
                      <Button testID={`mobile-user-post-edit-btn-${post.id}`} variant="secondary" label="Edit" onPress={() => openEditor(post)} />
                      <Button testID={`mobile-user-post-delete-btn-${post.id}`} variant="danger" label="Delete" onPress={() => deleteMutation.mutate(post.id)} />
                    </>
                  ) : null}
                </Row>
                <Row>
                  <Field
                    testID={`user-post-comment-input-${post.id}`}
                    style={{ flex: 1 }}
                    value={commentDrafts[post.id] ?? ""}
                    onChangeText={(text) => setCommentDrafts((p) => ({ ...p, [post.id]: text }))}
                    placeholder="Write a comment..."
                  />
                  <Button
                    testID={`user-post-comment-submit-${post.id}`}
                    variant="secondary"
                    label="Reply"
                    disabled={!(commentDrafts[post.id] ?? "").trim()}
                    onPress={() =>
                      commentMutation.mutate(
                        { postId: post.id, content: (commentDrafts[post.id] ?? "").trim() },
                        { onSuccess: () => setCommentDrafts((p) => ({ ...p, [post.id]: "" })) }
                      )
                    }
                  />
                </Row>
              </>
            ) : null}
          </Well>
        ))}
      </Card>

      {composerOpen ? (
        <Sheet testID="mobile-quick-post-drawer" title={editingPostId ? "Chỉnh Sửa Bài Viết" : "Đăng Bài Viết Mới"}>
          <Row>
            {USER_POST_CATEGORIES.map((cat) => (
              <Button key={cat} testID={`user-post-category-${cat}`} variant={category === cat ? "primary" : "secondary"} label={cat} onPress={() => setCategory(cat)} />
            ))}
          </Row>
          <Field testID="user-post-title-input" value={draft.title} onChangeText={setField("title")} placeholder="Tiêu đề (1-200 ký tự)..." />
          <Field testID="user-post-body-input" value={draft.content} onChangeText={setField("content")} placeholder="Nội dung..." multiline />
          <Field testID="user-post-tags-input" value={draft.tags} onChangeText={setField("tags")} placeholder="Tags (phân cách bằng dấu phẩy)" />
          <Field testID="user-post-link-input" value={draft.attachmentUrl} onChangeText={setField("attachmentUrl")} placeholder="Link đính kèm / Portfolio URL" keyboardType="url" />
          <Row>
            <Button
              testID="mobile-user-post-submit-btn"
              label={editingPostId ? "Lưu Chỉnh Sửa" : "Đăng Bài Viết"}
              disabled={!draft.title.trim() || !draft.content.trim() || createMutation.isPending || updateMutation.isPending}
              onPress={submitPost}
            />
            <Button testID="mobile-user-post-cancel-btn" label="Cancel" variant="secondary" onPress={() => setComposerOpen(false)} />
          </Row>
          <ErrorText error={createMutation.error ?? updateMutation.error} />
        </Sheet>
      ) : null}
    </>
  );
}
