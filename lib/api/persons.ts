import { apiClient } from "@/lib/apiClient";

export interface PersonInRoleResponse {
  id: string; // PersonInRole UUID
  personId: string;
  givenName: string;
  surname: string;
  roleName: string;
  email: string;
}

export interface PersonResponse {
  id: string;
  givenName: string;
  surname: string;
  email: string;
}

export interface CreatePersonRequest {
  givenName: string;
  surname: string;
  email: string;
  organization?: string;
  socialSecurityNumber?: string;
  documentTypeId?: string;
  documentNumber?: string;
}

export function searchVisitors(
  q: string,
  signal?: AbortSignal,
): Promise<PersonInRoleResponse[]> {
  return apiClient.get<PersonInRoleResponse[]>(
    `/api/persons/search?${new URLSearchParams({ q, role: "Visitor" })}`,
    { signal },
  );
}

export function searchEmployees(
  q: string,
  signal?: AbortSignal,
): Promise<PersonInRoleResponse[]> {
  return apiClient.get<PersonInRoleResponse[]>(
    `/api/persons/search?${new URLSearchParams({ q, role: "Employee" })}`,
    { signal },
  );
}

export function createPerson(
  body: CreatePersonRequest,
): Promise<PersonResponse> {
  return apiClient.post<PersonResponse, CreatePersonRequest>(
    "/api/persons",
    body,
  );
}
