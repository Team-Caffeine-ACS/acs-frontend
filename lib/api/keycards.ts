import { apiClient } from "@/lib/apiClient";

export interface KeycardResponse {
  id: string;
  keycardNumber: string;
  status: string;
  assignedUser: string | null;
  lastReturnTime: string | null;
}

interface KeycardPage {
  content: KeycardResponse[];
}

export async function getAvailableKeycards(): Promise<KeycardResponse[]> {
  const page = await apiClient.get<KeycardPage>(
    "/api/keycards?status=available&size=200",
  );
  return page.content;
}

export function getKeycardById(
  keycardId: string,
  signal?: AbortSignal,
): Promise<KeycardResponse> {
  return apiClient.get<KeycardResponse>(`/api/keycards/${keycardId}`, {
    signal,
  });
}
