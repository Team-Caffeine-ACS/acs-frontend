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

export interface VisitListItemResponse {
  id: string;
  fullName: string | null;
  documentNumber: string | null;
  hostName: string | null;
  entryTime: string | null;
  exitTime: string | null;
  status: string | null;
  visitorId: string | null;
}

export function createVisit(
  body: CreateVisitRequest,
): Promise<CreateVisitResponse> {
  return apiClient.post<CreateVisitResponse, CreateVisitRequest>(
    "/api/visits",
    body,
  );
}

type VisitDetailValue = string | null | undefined;

export interface VisitDetailResponse {
  visitId: string | null;
  firstName: string | null;
  lastName: string | null;
  personalIdCode: string | null;
  organization: string | null;
  department: string | null;
  hostName: string | null;
  visitReason: string | null;
  cardId: string | null;
  status: string | null;
  arrivalTime: string | null;
  exitTime: string | null;
  accessPointId: string | null;
  accessPointName: string | null;
  assignorName: string | null;
  escortName: string | null;
  createdAt: string | null;
  notes: string | null;
  personId: string | null;
  documentNumber: string | null;
  keycardNumber: string | null;
}

type KnownVisitTimelineEventType =
  | "ARRIVAL_REGISTERED"
  | "DEPARTURE_REGISTERED";

export type VisitTimelineEventType =
  | KnownVisitTimelineEventType
  | (string & {});

export interface VisitTimelineEvent {
  id: string;
  eventType: VisitTimelineEventType;
  occurredAt: string | null;
  actorName: string | null;
  description: string | null;
  locationName: string | null;
}

export type VisitStatusKey =
  | "planned"
  | "in_building"
  | "departed"
  | "expired"
  | "cancelled"
  | "unknown";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNullableString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      return value;
    }
    if (value === null) {
      return null;
    }
  }
  return null;
}

function normalizeVisitDetailResponse(raw: unknown): VisitDetailResponse {
  if (!isRecord(raw)) {
    return {
      visitId: null,
      firstName: null,
      lastName: null,
      personalIdCode: null,
      organization: null,
      department: null,
      hostName: null,
      visitReason: null,
      cardId: null,
      status: null,
      arrivalTime: null,
      exitTime: null,
      accessPointId: null,
      accessPointName: null,
      assignorName: null,
      escortName: null,
      createdAt: null,
      notes: null,
      personId: null,
      documentNumber: null,
      keycardNumber: null,
    };
  }

  return {
    visitId: getNullableString(raw, "visitId", "id"),
    firstName: getNullableString(raw, "firstName", "givenName"),
    lastName: getNullableString(raw, "lastName", "surname"),
    personalIdCode: getNullableString(raw, "personalIdCode"),
    organization: getNullableString(raw, "organization"),
    department: getNullableString(raw, "department"),
    hostName: getNullableString(raw, "hostName"),
    visitReason: getNullableString(raw, "visitReason", "comment"),
    cardId: getNullableString(raw, "cardId", "keycardId"),
    status: getNullableString(raw, "status"),
    arrivalTime: getNullableString(raw, "arrivalTime"),
    exitTime: getNullableString(raw, "exitTime", "departureTime"),
    accessPointId: getNullableString(raw, "accessPointId"),
    accessPointName: getNullableString(raw, "accessPointName"),
    assignorName: getNullableString(raw, "assignorName"),
    escortName: getNullableString(raw, "escortName"),
    createdAt: getNullableString(raw, "createdAt"),
    notes: getNullableString(raw, "notes"),
    personId: getNullableString(raw, "personId"),
    documentNumber: getNullableString(raw, "documentNumber"),
    keycardNumber: getNullableString(raw, "keycardNumber"),
  };
}

function normalizeVisitListItem(
  raw: Record<string, unknown>,
): VisitListItemResponse {
  return {
    id: getNullableString(raw, "id", "visitId") ?? "",
    fullName: getNullableString(raw, "fullName"),
    documentNumber: getNullableString(raw, "documentNumber"),
    hostName: getNullableString(raw, "hostName"),
    entryTime: getNullableString(raw, "entryTime", "arrivalTime"),
    exitTime: getNullableString(raw, "exitTime", "departureTime"),
    status: getNullableString(raw, "status"),
    visitorId: getNullableString(raw, "visitorId", "personId"),
  };
}

function normalizeVisitListResponse(raw: unknown): VisitListItemResponse[] {
  if (Array.isArray(raw)) {
    return raw.filter(isRecord).map(normalizeVisitListItem);
  }

  if (!isRecord(raw)) {
    return [];
  }

  const nestedCollection = raw.content ?? raw.items ?? raw.data;
  if (!Array.isArray(nestedCollection)) {
    return [];
  }

  return nestedCollection.filter(isRecord).map(normalizeVisitListItem);
}

function normalizeTimelineEvent(
  raw: Record<string, unknown>,
  index: number,
): VisitTimelineEvent {
  const eventType =
    getNullableString(raw, "eventType", "type", "action") ?? "UNKNOWN";
  const occurredAt = getNullableString(
    raw,
    "occurredAt",
    "timestamp",
    "createdAt",
    "eventTime",
    "registeredAt",
  );

  return {
    id: getNullableString(raw, "id") ?? `${eventType}-${occurredAt ?? index}`,
    eventType,
    occurredAt,
    actorName: getNullableString(
      raw,
      "actorName",
      "performedBy",
      "userName",
      "operatorName",
    ),
    description: getNullableString(raw, "description", "details", "message"),
    locationName: getNullableString(raw, "locationName", "accessPointName"),
  };
}

function normalizeTimelineResponse(raw: unknown): VisitTimelineEvent[] {
  if (Array.isArray(raw)) {
    return raw
      .filter(isRecord)
      .map((event, index) => normalizeTimelineEvent(event, index));
  }

  if (!isRecord(raw)) {
    return [];
  }

  const nestedCollection =
    raw.content ?? raw.items ?? raw.events ?? raw.timeline ?? raw.data;

  if (!Array.isArray(nestedCollection)) {
    return [];
  }

  return nestedCollection
    .filter(isRecord)
    .map((event, index) => normalizeTimelineEvent(event, index));
}

export function deriveVisitStatus(
  status: VisitDetailValue,
  timeline: VisitTimelineEvent[],
): VisitStatusKey {
  const normalizedStatus = status
    ?.trim()
    .replaceAll(/[\s-]+/g, "_")
    .toLowerCase();

  const mappedStatus: Record<string, VisitStatusKey> = {
    pre_registered: "planned",
    planned: "planned",
    active: "in_building",
    in_building: "in_building",
    completed: "departed",
    departed: "departed",
    expired: "expired",
    cancelled: "cancelled",
    canceled: "cancelled",
  };

  if (normalizedStatus && mappedStatus[normalizedStatus]) {
    return mappedStatus[normalizedStatus];
  }

  if (timeline.some((event) => event.eventType === "DEPARTURE_REGISTERED")) {
    return "departed";
  }

  if (timeline.some((event) => event.eventType === "ARRIVAL_REGISTERED")) {
    return "in_building";
  }

  return "planned";
}

export async function getVisitDetail(
  visitId: string,
  signal?: AbortSignal,
): Promise<VisitDetailResponse> {
  const raw = await apiClient.get<unknown>(`/api/visits/${visitId}`, {
    signal,
  });
  return normalizeVisitDetailResponse(raw);
}

export async function getVisitTimeline(
  visitId: string,
  signal?: AbortSignal,
): Promise<VisitTimelineEvent[]> {
  const raw = await apiClient.get<unknown>(`/api/visits/${visitId}/timeline`, {
    signal,
  });
  return normalizeTimelineResponse(raw);
}

export async function registerVisitDeparture(visitId: string): Promise<void> {
  await apiClient.put<void>(`/api/visits/${visitId}/exit`);
}

export async function getVisits(
  params?: {
    search?: string;
    status?: string;
    page?: number;
    size?: number;
  },
  signal?: AbortSignal,
): Promise<VisitListItemResponse[]> {
  const searchParams = new URLSearchParams();

  if (params?.search) {
    searchParams.set("search", params.search);
  }

  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  searchParams.set("page", String(params?.page ?? 0));
  searchParams.set("size", String(params?.size ?? 50));

  const query = searchParams.toString();
  const path = query ? `/api/visits?${query}` : "/api/visits";
  const raw = await apiClient.get<unknown>(path, { signal });

  return normalizeVisitListResponse(raw);
}

export interface EditVisitRequest {
  hostId?: string;
  assignorId?: string | null;
  accessPointId?: string;
  entryTime?: string;
  exitTime?: string;
  comment?: string;
}

export async function editVisit(
  visitId: string,
  body: EditVisitRequest,
): Promise<VisitDetailResponse> {
  const raw = await apiClient.put<unknown>(`/api/visits/${visitId}/edit`, body);
  return normalizeVisitDetailResponse(raw);
}
