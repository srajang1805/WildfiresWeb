"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/constants";

async function searchQuery(q: string) {
  const res = await fetch(api(`/api/v1/search?q=${encodeURIComponent(q)}`));
  return res.json();
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => searchQuery(q),
    enabled: q.length > 1,
    staleTime: 60_000,
  });
}
