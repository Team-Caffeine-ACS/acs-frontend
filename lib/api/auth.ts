import { apiClient } from "@/lib/apiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  id: string;
  email: string;
  role: "VISITOR" | "RECEPTIONIST" | "SECURITY_CHIEF" | "ADMIN";
  personId: string | null;
  person: {
    givenName: string;
    surname: string;
    jobTitle: string | null;
    socialSecurityNumber: string | null;
    department: string | null;
    organization: string | null;
  } | null;
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse, LoginRequest>("/api/auth/login", body);
}

export interface UpdateMeRequest {
  email?: string;
  password?: string;
}

export function getMe(): Promise<MeResponse> {
  return apiClient.get<MeResponse>("/api/users/me");
}

export function updateMe(body: UpdateMeRequest): Promise<void> {
  return apiClient.patch<void, UpdateMeRequest>("/api/users/me", body);
}
