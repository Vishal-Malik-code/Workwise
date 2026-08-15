"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type LoginInput, type RegisterInput } from "./auth.api";
import { ApiError } from "@/lib/api-client";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    retry: false,
  });

  return {
    user: data?.user ?? null,
    isLoading,
    isAuthenticated: !!data?.user,
    error: error as ApiError | null,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginInput) => authApi.login(body),
    onSuccess: (data) => queryClient.setQueryData(["me"], data),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterInput) => authApi.register(body),
    onSuccess: (data) => queryClient.setQueryData(["me"], data),
  });
}

export function useDemoLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.demo(),
    onSuccess: (data) => queryClient.setQueryData(["me"], data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => queryClient.clear(),
  });
}
