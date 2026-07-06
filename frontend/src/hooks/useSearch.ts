"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/lib/constants";

interface SearchResult {
  found: boolean;
  name?: string;
  lat?: number;
  lon?: number;
  type?: string;
}

async function searchQuery(q: string): Promise<SearchResult> {
  const res = await fetch(`${API_BASE}/api/v1/search?q=${encodeURIComponent(q)}`);
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
