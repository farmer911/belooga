import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  CandidateBookmarkItemDTO,
  candidateBookmarkItemSchema,
} from "@/lib/schemas";
import { mobileApiClient } from "@/services/api-client";
import { useMobileAuthStore } from "@/store/auth-store";

const bookmarkEnvelopeSchema = z.object({
  items: z.array(candidateBookmarkItemSchema).default([]),
});

export const MOBILE_BOOKMARKS_QUERY_KEY = ["mobile", "bookmarks"] as const;

export async function fetchMobileBookmarks(): Promise<CandidateBookmarkItemDTO[]> {
  const raw = await mobileApiClient.get<unknown>("/v1/bookmarks/");
  if (Array.isArray(raw)) {
    return z.array(candidateBookmarkItemSchema).parse(raw);
  }
  return bookmarkEnvelopeSchema.parse(raw).items;
}

export async function addMobileBookmark(
  username: string,
  note?: string
): Promise<CandidateBookmarkItemDTO> {
  const cleanUsername = username.trim();
  const payload = note !== undefined ? { note } : {};
  const raw = await mobileApiClient.post<unknown>(
    `/v1/bookmarks/${encodeURIComponent(cleanUsername)}/`,
    payload
  );
  return candidateBookmarkItemSchema.parse(raw);
}

export async function removeMobileBookmark(username: string): Promise<void> {
  const cleanUsername = username.trim();
  await mobileApiClient.delete<unknown>(
    `/v1/bookmarks/${encodeURIComponent(cleanUsername)}/`
  );
}

export async function toggleMobileBookmark(input: {
  username: string;
  currentlyBookmarked: boolean;
  note?: string;
}): Promise<{ username: string; bookmarked: boolean; item?: CandidateBookmarkItemDTO }> {
  if (input.currentlyBookmarked) {
    await removeMobileBookmark(input.username);
    return { username: input.username, bookmarked: false };
  }
  const created = await addMobileBookmark(input.username, input.note);
  return { username: input.username, bookmarked: true, item: created };
}

export function isCandidateBookmarked(
  bookmarks: CandidateBookmarkItemDTO[] | undefined,
  username: string
): boolean {
  if (!bookmarks || bookmarks.length === 0) return false;
  const target = username.trim().toLowerCase();
  return bookmarks.some((item) => item.username.trim().toLowerCase() === target);
}

export function useMobileBookmarksQuery() {
  const isAuthenticated = useMobileAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: MOBILE_BOOKMARKS_QUERY_KEY,
    queryFn: fetchMobileBookmarks,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useToggleMobileBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleMobileBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOBILE_BOOKMARKS_QUERY_KEY });
    },
  });
}
