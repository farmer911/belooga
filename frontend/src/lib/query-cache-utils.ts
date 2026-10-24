import { QueryClient } from "@tanstack/react-query";

export function prependAndInvalidateList<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  created: T | null | undefined
): void {
  if (created) {
    queryClient.setQueryData<T[]>(queryKey, (prev = []) => [created, ...prev]);
  }
  void queryClient.invalidateQueries({ queryKey });
}

export function replaceAndInvalidateByKey<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updated: T,
  isMatch: (item: T, next: T) => boolean
): void {
  queryClient.setQueryData<T[]>(queryKey, (prev = []) =>
    prev.map((item) => (isMatch(item, updated) ? updated : item))
  );
  void queryClient.invalidateQueries({ queryKey });
}
