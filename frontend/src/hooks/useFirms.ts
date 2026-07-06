"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/constants";

async function fetchFirms() {
  const res = await fetch(api("/api/v1/firms"));
  if (!res.ok) throw new Error("FIRMS fetch failed");
  return res.json();
}

export function useFirms() {
  return useQuery({
    queryKey: ["firms"],
    queryFn: fetchFirms,
    staleTime: 300_000,
    refetchInterval: 600_000,
  });
}
