import { apiClient } from "@/lib/apiClient";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CreateGroupVisitRequest {
  groupName: string;
  groupDescription?: string;
  personIds: string[];
  expectedArrival: string;
  expectedExit?: string;
  hostId?: string;
  buildingId: string;
  comment?: string;
}

export interface GroupMemberResponse {
  visitId: string;
  personId: string;
  fullName: string | null;
  email: string | null;
  personalIdCode: string | null;
  status: string;
  arrivalTime: string | null;
  exitTime: string | null;
}

export interface GroupVisitResponse {
  groupInVisitId: string;
  groupName: string;
  groupDescription: string | null;
  plannedArrival: string | null;
  plannedExit: string | null;
  comment: string | null;
  building: string | null;
  hostName: string | null;
  memberCount: number;
  checkedInCount: number;
  departedCount: number;
  members: GroupMemberResponse[];
}

export interface GroupVisitListItemResponse {
  groupInVisitId: string;
  groupName: string;
  plannedArrival: string | null;
  plannedExit: string | null;
  comment: string | null;
  memberCount: number;
  checkedInCount: number;
  departedCount: number;
}

export interface GroupVisitPageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface GroupVisitListPage {
  content: GroupVisitListItemResponse[];
  page: GroupVisitPageMetadata | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNullableNumber(
  record: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function normalizeGroupVisitListResponse(raw: unknown): GroupVisitListPage {
  if (!isRecord(raw)) return { content: [], page: null };

  const nestedCollection = raw.content ?? raw.items ?? raw.data;
  const content = Array.isArray(nestedCollection)
    ? (nestedCollection as GroupVisitListItemResponse[])
    : [];

  const pageSource = isRecord(raw.page) ? raw.page : raw;
  const size = getNullableNumber(pageSource, "size");
  const number = getNullableNumber(pageSource, "number");
  const totalElements = getNullableNumber(pageSource, "totalElements");
  const totalPages = getNullableNumber(pageSource, "totalPages");

  const page =
    size !== null || totalPages !== null
      ? {
          size: Math.max(0, size ?? 0),
          number: Math.max(0, number ?? 0),
          totalElements: Math.max(0, totalElements ?? 0),
          totalPages: Math.max(0, totalPages ?? 0),
        }
      : null;

  return { content, page };
}

// ── API calls ──────────────────────────────────────────────────────────────────

export function createGroupVisit(
  body: CreateGroupVisitRequest,
): Promise<GroupVisitResponse> {
  return apiClient.post<GroupVisitResponse, CreateGroupVisitRequest>(
    "/api/visit-groups",
    body,
  );
}

export async function getGroupVisit(
  groupInVisitId: string,
  signal?: AbortSignal,
): Promise<GroupVisitResponse> {
  return apiClient.get<GroupVisitResponse>(
    `/api/visit-groups/${groupInVisitId}`,
    { signal },
  );
}

export async function getGroupVisits(
  params?: {
    search?: string;
    date?: string;
    page?: number;
    size?: number;
  },
  signal?: AbortSignal,
): Promise<GroupVisitListPage> {
  const searchParams = new URLSearchParams();

  if (params?.search) searchParams.set("search", params.search);
  if (params?.date) searchParams.set("date", params.date);
  searchParams.set("page", String(params?.page ?? 0));
  searchParams.set("size", String(params?.size ?? 20));

  const query = searchParams.toString();
  const path = query ? `/api/visit-groups?${query}` : "/api/visit-groups";
  const raw = await apiClient.get<unknown>(path, { signal });

  return normalizeGroupVisitListResponse(raw);
}

export async function cancelGroupVisit(groupInVisitId: string): Promise<void> {
  await apiClient.delete(`/api/visit-groups/${groupInVisitId}`);
}

// ── Status helpers ─────────────────────────────────────────────────────────────

export type MemberStatusKey =
  | "pre_registered"
  | "active"
  | "completed"
  | "cancelled"
  | "unknown";

const STATUS_MAP: Record<string, MemberStatusKey> = {
  Ootel: "pre_registered",
  PRE_REGISTERED: "pre_registered",
  Sees: "active",
  ACTIVE: "active",
  Väljas: "completed",
  COMPLETED: "completed",
  Tühistatud: "cancelled",
  CANCELLED: "cancelled",
};

export function deriveMemberStatus(raw: string | null): MemberStatusKey {
  if (!raw) return "unknown";
  return STATUS_MAP[raw] ?? "unknown";
}

export function getMemberStatusPresentation(status: MemberStatusKey): {
  label: string;
  className: string;
} {
  const map: Record<MemberStatusKey, { label: string; className: string }> = {
    pre_registered: {
      label: "Ootel",
      className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    },
    active: {
      label: "Hoones",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    completed: {
      label: "Lahkunud",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    },
    cancelled: {
      label: "Tühistatud",
      className:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
    unknown: {
      label: "Teadmata",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    },
  };

  return map[status];
}
