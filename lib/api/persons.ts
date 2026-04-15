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
  documentTypeId?: string;
  documentNumber?: string;
}

export function searchVisitors(q: string, signal?: AbortSignal): Promise<PersonInRoleResponse[]> {
  return apiClient.get<PersonInRoleResponse[]>(
    `/api/persons/visitors/search?${new URLSearchParams({ q })}`,
    { signal },
  );
}

export function searchEmployees(q: string, signal?: AbortSignal): Promise<PersonInRoleResponse[]> {
  return apiClient.get<PersonInRoleResponse[]>(
    `/api/persons/employees/search?${new URLSearchParams({ q })}`,
    { signal },
  );
}

export function createPerson(body: CreatePersonRequest): Promise<PersonResponse> {
  return apiClient.post<PersonResponse, CreatePersonRequest>("/api/persons", body);
}
