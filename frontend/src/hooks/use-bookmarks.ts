"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  CandidateBookmarkItemDTO,
  candidateBookmarkItemSchema,
} from "@/lib/schemas";
import { apiClient, getApiErrorDetail } from "@/services/api-client";

export const BOOKMARKS_QUERY_KEY = ["candidate-bookmarks"] as const;
const bookmarkListSchema = z.array(candidateBookmarkItemSchema);

export async function fetchCandidateBookmarks(): Promise<CandidateBookmarkItemDTO[]> {
  const res = await apiClient.get<unknown>("/v1/bookmarks/");
  if (Array.isArray(res.data)) return bookmarkListSchema.parse(res.data);
  const items = (res.data as { items?: unknown } | undefined)?.items;
  return Array.isArray(items) ? bookmarkListSchema.parse(items) : [];
}

export async function addCandidateBookmark(username: string, note?: string): Promise<CandidateBookmarkItemDTO> {
  const clean = username.trim().toLowerCase();
  const res = await apiClient.post<unknown>(`/v1/bookmarks/${encodeURIComponent(clean)}/`, note !== undefined ? { note } : {});
  return candidateBookmarkItemSchema.parse(res.data);
}

export async function removeCandidateBookmark(username: string): Promise<void> {
  await apiClient.delete(`/v1/bookmarks/${encodeURIComponent(username.trim().toLowerCase())}/`);
}

export function useBookmarks() {
  const queryClient = useQueryClient();
  const [pendingUsernames, setPendingUsernames] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: bookmarks = [], isLoading } = useQuery<CandidateBookmarkItemDTO[]>({
    queryKey: BOOKMARKS_QUERY_KEY,
    queryFn: fetchCandidateBookmarks,
    staleTime: 30_000,
    retry: false,
  });

  // O(1) lookup set preventing O(C * B) linear scans across candidate cards on /search (BEL-149)
  const bookmarkedSet = useMemo(
    () => new Set(bookmarks.map((item) => item.username.trim().toLowerCase())),
    [bookmarks]
  );

  const markPending = useCallback((username: string, active: boolean) => {
    const key = username.trim().toLowerCase();
    setPendingUsernames((prev) => {
      if (!active) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: true };
    });
  }, []);

  const toggleMutation = useMutation({
    mutationFn: async (input: { username: string; currentlyBookmarked: boolean; note?: string }) => {
      if (input.currentlyBookmarked) {
        await removeCandidateBookmark(input.username);
        return { username: input.username, bookmarked: false as const };
      }
      const item = await addCandidateBookmark(input.username, input.note);
      return { username: input.username, bookmarked: true as const, item };
    },
    onMutate: (variables) => {
      setErrorMessage(null);
      markPending(variables.username, true);
    },
    onSuccess: (res) => {
      const target = res.username.trim().toLowerCase();
      queryClient.setQueryData<CandidateBookmarkItemDTO[]>(BOOKMARKS_QUERY_KEY, (prev = []) =>
        res.bookmarked
          ? [res.item, ...prev.filter((b) => b.username.trim().toLowerCase() !== target)]
          : prev.filter((b) => b.username.trim().toLowerCase() !== target)
      );
      void queryClient.invalidateQueries({ queryKey: BOOKMARKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    },
    onError: (err) => {
      setErrorMessage(getApiErrorDetail(err, "Unable to update candidate shortlist. Please sign in and try again."));
    },
    onSettled: (_data, _err, variables) => markPending(variables.username, false),
  });

  const isBookmarked = useCallback(
    (username: string): boolean => bookmarkedSet.has(username.trim().toLowerCase()),
    [bookmarkedSet]
  );

  const isPendingFor = useCallback(
    (username: string): boolean => Boolean(pendingUsernames[username.trim().toLowerCase()]),
    [pendingUsernames]
  );

  const toggleBookmark = useCallback(
    (username: string, note?: string) => {
      if (isPendingFor(username)) return;
      toggleMutation.mutate({ username, currentlyBookmarked: isBookmarked(username), note });
    },
    [isBookmarked, isPendingFor, toggleMutation]
  );

  const removeBookmark = useCallback(
    (username: string) => {
      if (isPendingFor(username)) return;
      toggleMutation.mutate({ username, currentlyBookmarked: true });
    },
    [isPendingFor, toggleMutation]
  );

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    isPendingFor,
    isMutating: toggleMutation.isPending,
    toggleBookmark,
    removeBookmark,
    errorMessage,
  };
}
