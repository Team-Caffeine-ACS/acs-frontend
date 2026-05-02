import { apiClient } from "@/lib/apiClient";

export interface DashboardSummaryResponse {
  activeVisitors: number;
  bookingsToday: number;
  pendingRequests: number;
  availableSpaces: number;
  trendIndicators?: Record<string, string>;
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
