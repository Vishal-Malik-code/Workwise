import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/api";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (body: RegisterInput) => apiClient.post<{ user: User }>("/auth/register", body),
  login: (body: LoginInput) => apiClient.post<{ user: User }>("/auth/login", body),
  demo: () => apiClient.post<{ user: User }>("/auth/demo"),
  logout: () => apiClient.post<void>("/auth/logout"),
  me: () => apiClient.get<{ user: User }>("/auth/me"),
};
