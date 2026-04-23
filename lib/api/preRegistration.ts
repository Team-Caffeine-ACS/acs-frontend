import { apiClient } from "@/lib/apiClient";

export interface PreRegistration {
  id: string;
  fullName: string;
  email: string | null;
  expectedArrival: string;
  hostName: string;
  notes: string | null;
  building: string;
  createdAt: string | null;
  status: string;
}

export interface PreRegistrationsResponse {
  content: PreRegistration[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export type StatusColor = "emerald" | "slate" | "amber" | "rose";