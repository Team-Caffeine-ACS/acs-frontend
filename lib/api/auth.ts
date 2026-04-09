import { apiClient } from "@/lib/apiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse, LoginRequest>("/api/auth/login", body);
}
