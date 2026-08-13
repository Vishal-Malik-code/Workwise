"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
    retry: false,
  });

  return { user: data?.user ?? null, isLoading, isAuthenticated: !!data?.user, error };
}
