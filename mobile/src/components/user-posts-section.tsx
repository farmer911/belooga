import React, { useState } from 'react';
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
} from '@/hooks/use-mobile-user-posts';
import { ActionButton, BadgePill, BottomSheetDrawer, SurfaceCard } from '@/lib/native-runtime';
import { getSemanticTokens } from '@/theme/tokens';

export interface UserPostsSectionProps {
  username: string;
  isOwner?: boolean;
}

export function UserPostsSection({ username, isOwner = true }: UserPostsSectionProps) {
  const tokens = getSemanticTokens('neumorphic');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<UserPostCategory>('Career Insight');
  const [content, setContent] = useState('');
  const [tagsRaw, setTagsRaw] = useState('PostgreSQL, FastAPI');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const postsQuery = useUserPostsByUsernameQuery(username);
  const createMutation = useCreateUserPostMutation();
  const updateMutation = useUpdateUserPostMutation();
  const deleteMutation = useDeleteUserPostMutation();
  const likeMutation = useLikeUserPostMutation();
  const commentMutation = useCommentUserPostMutation();

  const posts = postsQuery.data ?? [];
  const inputStyle: React.CSSProperties = {
    backgroundColor: tokens.surface.elevated,
    color: tokens.typography.main,
    border: `1px solid ${tokens.surface.border}`,
    borderRadius: 12,
    padding: '10px 12px',
  };

  const openEditDrawer = (post: UserPostItem) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setCategory(post.category);
    setContent(post.content);
    setTagsRaw(post.tags.join(', '));
    setAttachmentUrl(post.attachment_url ?? '');
    setComposerOpen(true);
  };

  const submitPost = () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (editingPostId) {
      updateMutation.mutate({
        postId: editingPostId,
        input: { title: title.trim(), category, content: content.trim(), tags, attachment_url: attachmentUrl.trim() || null },
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        category,
        content: content.trim(),
        tags,
        attachment_url: attachmentUrl.trim() || null,
      });
    }
    setEditingPostId(null);
    setTitle('');
    setContent('');
    setAttachmentUrl('');
    setComposerOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SurfaceCard testID="profile-posts-section" mode="dark">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 15, color: tokens.typography.heading }}>
            Published Articles &amp; Career Insights (@{username})
          </strong>
          {isOwner ? (
            <ActionButton
              testID="mobile-quick-post-open-btn"
              accessibilityLabel="mobile-quick-post-open-btn"
              label="+ Đăng Bài Viết"
              onPress={() => {
                setEditingPostId(null);
                setComposerOpen((v) => !v);
              }}
            />
          ) : null}
        </div>

        <div
          data-testid="mobile-profile-posts-list"
          aria-label="mobile-profile-posts-list"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {posts.map((post) => (
            <div
              key={post.id}
              data-testid={`mobile-user-post-card-${post.id}`}
              aria-label={`mobile-user-post-card-${post.id}`}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: tokens.surface.elevated,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BadgePill label={post.category} tone="brand" />
                <span style={{ fontSize: 12, color: tokens.typography.muted }}>
                  {post.likes_count} Likes • {post.comments_count} Comments
                </span>
              </div>
              <strong style={{ fontSize: 14, color: tokens.typography.heading }}>{post.title}</strong>
              <span style={{ fontSize: 13, color: tokens.typography.body }}>{post.content}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <ActionButton
                  testID={`user-post-like-btn-${post.id}`}
                  accessibilityLabel={`user-post-like-btn-${post.id}`}
                  variant="secondary"
                  label={`Like (${post.likes_count})`}
                  onPress={() => likeMutation.mutate(post.id)}
                />
                {isOwner ? (
                  <>
                    <ActionButton
                      testID={`mobile-user-post-edit-btn-${post.id}`}
                      accessibilityLabel={`mobile-user-post-edit-btn-${post.id}`}
                      variant="secondary"
                      label="Edit"
                      onPress={() => openEditDrawer(post)}
                    />
                    <ActionButton
                      testID={`mobile-user-post-delete-btn-${post.id}`}
                      accessibilityLabel={`mobile-user-post-delete-btn-${post.id}`}
                      variant="danger"
                      label="Delete"
                      onPress={() => deleteMutation.mutate(post.id)}
                    />
                  </>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  aria-label={`user-post-comment-input-${post.id}`}
                  value={commentDrafts[post.id] ?? ''}
                  onChange={(e) => setCommentDrafts((p) => ({ ...p, [post.id]: e.target.value }))}
                  placeholder="Write a comment..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <ActionButton
                  testID={`user-post-comment-submit-${post.id}`}
                  accessibilityLabel={`user-post-comment-submit-${post.id}`}
                  variant="secondary"
                  label="Reply"
                  onPress={() => {
                    const text = (commentDrafts[post.id] ?? '').trim();
                    if (!text) return;
                    commentMutation.mutate({ postId: post.id, content: text });
                    setCommentDrafts((p) => ({ ...p, [post.id]: '' }));
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      {composerOpen ? (
        <BottomSheetDrawer
          testID="mobile-quick-post-drawer"
          title={editingPostId ? 'Chỉnh Sửa Bài Viết (/v1/posts)' : 'Đăng Bài Viết Mới (/v1/posts)'}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {USER_POST_CATEGORIES.map((cat) => (
              <ActionButton
                key={cat}
                testID={`user-post-category-${cat}`}
                variant={category === cat ? 'primary' : 'secondary'}
                label={cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </div>
          <input aria-label="user-post-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề bài viết (1-200 ký tự)..." style={inputStyle} />
          <input aria-label="user-post-body-input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung chia sẻ kinh nghiệm / dự án..." style={inputStyle} />
          <input aria-label="user-post-tags-input" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="Tags (phân cách bằng dấu phẩy)..." style={inputStyle} />
          <input aria-label="user-post-link-input" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="Link đính kèm / Portfolio URL..." style={inputStyle} />
          <ActionButton
            testID="mobile-user-post-submit-btn"
            accessibilityLabel="mobile-user-post-submit-btn"
            label={editingPostId ? 'Lưu Chỉnh Sửa' : 'Đăng Bài Viết'}
            onPress={submitPost}
          />
        </BottomSheetDrawer>
      ) : null}
    </div>
  );
}
