import { apiClient } from "@/lib/apiClient";

export interface DocumentTypeResponse {
  id: string;
  name: string;
}

export function getDocumentTypes(): Promise<DocumentTypeResponse[]> {
  return apiClient.get<DocumentTypeResponse[]>("/api/document-types");
}
