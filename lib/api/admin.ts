import { apiClient } from "@/lib/apiClient";

export interface LookupRecord {
  id: string;
  name: string;
}

function crudFor(base: string) {
  return {
    list: (): Promise<LookupRecord[]> => apiClient.get<LookupRecord[]>(base),
    create: (name: string): Promise<LookupRecord> =>
      apiClient.post<LookupRecord, { name: string }>(base, { name }),
    update: (id: string, name: string): Promise<LookupRecord> =>
      apiClient.put<LookupRecord, { name: string }>(`${base}/${id}`, { name }),
    remove: (id: string): Promise<void> =>
      apiClient.delete<void>(`${base}/${id}`),
  };
}

export const countriesApi = crudFor("/api/countries");
export const organizationsApi = crudFor("/api/organizations");
export const departmentsApi = crudFor("/api/departments");
export const rolesApi = crudFor("/api/roles");
export const documentTypesApi = crudFor("/api/document-types");
