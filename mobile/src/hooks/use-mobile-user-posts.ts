import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { mobileApiClient } from '../services/api-client';

export type MobileApiClient = typeof mobileApiClient;

export const USER_POST_CATEGORIES = [
  'Career Insight',
  'Interview Story',
  'Project Showcase',
  'Hiring Update',
] as const;

export const userPostCategorySchema = z.enum(USER_POST_CATEGORIES);
export type UserPostCategory = z.infer<typeof userPostCategorySchema>;

export const userPostItemSchema = z.object({
  id: z.string().min(1),
  author_username: z.string().min(1),
  title: z.string().min(1).max(200),
  category: userPostCategorySchema.default('Career Insight'),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  attachment_url: z.string().nullable().default(null),
  likes_count: z.number().int().nonnegative().default(0),
  comments_count: z.number().int().nonnegative().default(0),
  created_at: z.string().optional(),
});
export type UserPostItem = z.infer<typeof userPostItemSchema>;

export const createUserPostInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: userPostCategorySchema.default('Career Insight'),
  content: z.string().trim().min(1),
  tags: z.array(z.string()).default([]),
  attachment_url: z.string().nullable().optional(),
});
export type CreateUserPostInput = z.infer<typeof createUserPostInputSchema>;

export const updateUserPostInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: userPostCategorySchema.optional(),
  content: z.string().trim().min(1).optional(),
  tags: z.array(z.string()).optional(),
  attachment_url: z.string().nullable().optional(),
});
export type UpdateUserPostInput = z.infer<typeof updateUserPostInputSchema>;

export const userPostLikeResponseSchema = z.object({
  id: z.string().min(1),
  likes_count: z.number().int().nonnegative(),
  liked: z.boolean().default(true),
});

export const userPostCommentSchema = z.object({
  id: z.string().min(1),
  post_id: z.string().min(1),
  author_username: z.string().min(1),
  content: z.string().min(1),
  created_at: z.string().optional(),
});
export type UserPostComment = z.infer<typeof userPostCommentSchema>;

export const userPostsKeys = {
  all: ['mobile-user-posts'] as const,
  byUser: (username: string) => [...userPostsKeys.all, 'user', username] as const,
};

export async function fetchUserPostsByUsername(
  username: string,
  client: MobileApiClient = mobileApiClient
): Promise<UserPostItem[]> {
  const raw = await client.get<unknown>(`/v1/posts/user/${encodeURIComponent(username)}`);
  if (Array.isArray(raw)) {
    return z.array(userPostItemSchema).parse(raw);
  }
  const envelope = z.object({ items: z.array(userPostItemSchema).default([]) }).parse(raw);
  return envelope.items;
}

export async function createUserPost(
  input: CreateUserPostInput,
  client: MobileApiClient = mobileApiClient
): Promise<UserPostItem> {
  const validated = createUserPostInputSchema.parse(input);
  const raw = await client.post<unknown>('/v1/posts/', validated);
  return userPostItemSchema.parse(raw);
}

export async function updateUserPost(
  postId: string,
  input: UpdateUserPostInput,
  client: MobileApiClient = mobileApiClient
): Promise<UserPostItem> {
  const validated = updateUserPostInputSchema.parse(input);
  const raw = await client.patch<unknown>(`/v1/posts/${encodeURIComponent(postId)}`, validated);
  return userPostItemSchema.parse(raw);
}

export async function deleteUserPost(
  postId: string,
  client: MobileApiClient = mobileApiClient
): Promise<{ deleted: boolean }> {
  await client.delete<unknown>(`/v1/posts/${encodeURIComponent(postId)}`);
  return { deleted: true };
}

export async function likeUserPost(
  postId: string,
  client: MobileApiClient = mobileApiClient
): Promise<z.infer<typeof userPostLikeResponseSchema>> {
  const raw = await client.post<unknown>(`/v1/posts/${encodeURIComponent(postId)}/like`, {});
  return userPostLikeResponseSchema.parse(raw);
}

export async function commentOnUserPost(
  postId: string,
  content: string,
  client: MobileApiClient = mobileApiClient
): Promise<UserPostComment> {
  const raw = await client.post<unknown>(`/v1/posts/${encodeURIComponent(postId)}/comments`, {
    content: content.trim(),
  });
  return userPostCommentSchema.parse(raw);
}

export function useUserPostsByUsernameQuery(
  username: string,
  client: MobileApiClient = mobileApiClient
) {
  return useQuery({
    queryKey: userPostsKeys.byUser(username),
    queryFn: () => fetchUserPostsByUsername(username, client),
    enabled: Boolean(username),
  });
}

export function useCreateUserPostMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserPostInput) => createUserPost(input, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPostsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['mobile-social-blog-posts'] });
    },
  });
}

export function useUpdateUserPostMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, input }: { postId: string; input: UpdateUserPostInput }) =>
      updateUserPost(postId, input, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPostsKeys.all });
    },
  });
}

export function useDeleteUserPostMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => deleteUserPost(postId, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPostsKeys.all });
    },
  });
}

export function useLikeUserPostMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => likeUserPost(postId, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPostsKeys.all });
    },
  });
}

export function useCommentUserPostMutation(client: MobileApiClient = mobileApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      commentOnUserPost(postId, content, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPostsKeys.all });
    },
  });
}
