import { apiClient } from "@/lib/apiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse, LoginRequest>("/api/auth/login", body);
}
