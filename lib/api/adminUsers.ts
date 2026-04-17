import { apiClient } from "@/lib/apiClient";
import type { MeResponse } from "@/lib/api/auth";

export type UserRole = MeResponse["role"];

export interface AdminUserResponse {
  id: string;
  email: string;
  role: UserRole;
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

export interface CreateUserRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
}

export const adminUsersApi = {
  list(): Promise<AdminUserResponse[]> {
    return apiClient.get<AdminUserResponse[]>("/api/users/admin");
  },
  create(body: CreateUserRequest): Promise<AdminUserResponse> {
    return apiClient.post<AdminUserResponse, CreateUserRequest>(
      "/api/users/admin",
      body,
    );
  },
  update(id: string, body: UpdateUserRequest): Promise<AdminUserResponse> {
    return apiClient.put<AdminUserResponse, UpdateUserRequest>(
      `/api/users/admin/${id}`,
      body,
    );
  },
  remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/users/admin/${id}`);
  },
};
