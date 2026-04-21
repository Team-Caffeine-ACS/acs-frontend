import { apiClient } from "@/lib/apiClient";

export interface AccessPointResponse {
  id: string;
  name: string;
  address: string;
  latitude: number; 
  longitude: number;
}

export function getAccessPoints(): Promise<AccessPointResponse[]> {
  return apiClient.get<AccessPointResponse[]>("/api/access-points");
}

