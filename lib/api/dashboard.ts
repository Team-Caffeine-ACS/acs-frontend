import { apiClient } from "@/lib/apiClient";

export interface DashboardSummaryResponse {
  activeVisitors: number;
  bookingsToday: number;
  pendingRequests: number;
  availableSpaces: number;
  trendIndicators?: Record<string, string>;
}

export interface DashboardRecentVisitResponse {
  fullName: string;
  organization: string;
  entryTime: string;
  exitTime: string;
  status: string;
  visitorId: string;
  accessPointName: string;
  accessPointAddress: string;
  id?: string;
}

// --- API funktsioonid ---

/**
 * Pärime tänase kokkuvõtva statistika.
 * @param accessPointId Valikuline pääsupunkti filter (UUID)
 */
export function getDashboardSummary(
  accessPointId?: string,
): Promise<DashboardSummaryResponse> {
  const path = accessPointId
    ? `/api/dashboard/summary?accessPointId=${accessPointId}`
    : "/api/dashboard/summary";

  return apiClient.get<DashboardSummaryResponse>(path);
}

/**
 * Pärime viimased tänased külastused.
 * @param accessPointId Valikuline pääsupunkti filter (UUID)
 * @param limit Mitut kirjet soovime (vaikimisi 10)
 */
export function getRecentVisits(
  accessPointId?: string,
  limit: number = 10,
): Promise<DashboardRecentVisitResponse[]> {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  if (accessPointId) {
    params.append("accessPointId", accessPointId);
  }

  return apiClient.get<DashboardRecentVisitResponse[]>(
    `/api/dashboard/recent-visits?${params.toString()}`,
  );
}
