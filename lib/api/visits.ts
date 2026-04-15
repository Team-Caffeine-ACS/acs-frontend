import { apiClient } from "@/lib/apiClient";

export interface CreateVisitRequest {
  personId: string;
  accessPointId: string;
  keycardId?: string;
  hostPersonInRoleId?: string;
  comment?: string;
  arrivalTime?: string;
}

export interface CreateVisitResponse {
  visitId: string;
  personId: string;
  personInRoleId: string;
  firstName: string;
  lastName: string;
  personalIdCode: string | null;
  organization: string | null;
  department: string | null;
  hostName: string | null;
  comment: string | null;
  arrivalTime: string;
  cardId: string | null;
  keycardInPossessionId: string | null;
  keycardNumber: string | null;
}

export function createVisit(body: CreateVisitRequest): Promise<CreateVisitResponse> {
  return apiClient.post<CreateVisitResponse, CreateVisitRequest>("/api/visits", body);
}
