import { apiClient } from "@/lib/apiClient";

export interface CreateVisitRequest {
  personId: string;
  accessPointId: string;
  keycardId?: string;
  hostPersonInRoleId?: string;
  comment?: string;
  arrivalTime?: string;
}

export interface EditVisitRequest {
  accessPointId?: string;
  assignorId: string;
  entryTime?: string;
  exitTime?: string;
  comment?: string;
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

interface RegisterVisitDepartureRequest {
  exitTime: string;
}

export interface VisitListItemResponse {
  id: string;
  fullName: string | null;
  documentNumber: string | null;
  organizationName: string | null;
  hostName: string | null;
  entryTime: string | null;
  exitTime: string | null;
  status: string | null;
  visitorId: string | null;
  accessPointId: string | null;
  accessPointName: string | null;
  accessPointAddress: string | null;
}

export interface VisitPageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface VisitListPage {
  content: VisitListItemResponse[];
  page: VisitPageMetadata | null;
}

export function createVisit(
  body: CreateVisitRequest,
): Promise<CreateVisitResponse> {
  return apiClient.post<CreateVisitResponse, CreateVisitRequest>(
    "/api/visits",
    body,
  );
}

export function editVisit(
  visitId: string,
  body: EditVisitRequest,
): Promise<VisitDetailResponse> {
  return apiClient.put<VisitDetailResponse, EditVisitRequest>(
    `/api/visits/${visitId}`,
    body,
  );
}

export interface Page<T> {
  content: T[]; // Sinu andmete massiiv (VisitListItemResponse[])
  totalElements: number; // Mitmu kirjet on kokku andmebaasis
  totalPages: number; // Mitmele lehele need andmed jagunevad
  size: number; // Mitu elementi on ühel lehel
  number: number; // Praeguse lehekülje number (0-põhine)
  first: boolean;
  last: boolean;
  empty: boolean;
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

const VISIT_STATUS_ALL = "all";
const DEFAULT_VISITS_PAGE = 0;
const DEFAULT_VISITS_PAGE_SIZE = 50;
const DEFAULT_RECENT_VISITS_PAGE_SIZE = 20;
const DEFAULT_RECENT_VISITS_SORT = "entryTime,desc";

type VisitListResponsePayload = Record<string, unknown> | unknown[];

interface VisitListQueryParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

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

function getNullableNumber(
  record: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsedValue = Number(value);
      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return null;
}

function toLocalDateTimeValue(date: Date): string {
  const pad = (value: number, length = 2) =>
    String(value).padStart(length, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
  ].join("T");
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
    organizationName: getNullableString(
      raw,
      "organizationName",
      "organization",
    ),
    hostName: getNullableString(raw, "hostName"),
    entryTime: getNullableString(raw, "entryTime", "arrivalTime"),
    exitTime: getNullableString(raw, "exitTime", "departureTime"),
    status: getNullableString(raw, "status"),
    visitorId: getNullableString(raw, "visitorId", "personId"),
    accessPointId: getNullableString(raw, "accessPointId"),
    accessPointName: getNullableString(raw, "accessPointName"),
    accessPointAddress: getNullableString(raw, "accessPointAddress"),
  };
}

function normalizeVisitPageMetadata(raw: unknown): VisitPageMetadata | null {
  if (!isRecord(raw)) {
    return null;
  }

  const size = getNullableNumber(raw, "size", "pageSize");
  const number = getNullableNumber(raw, "number", "page", "pageNumber");
  const totalElements = getNullableNumber(
    raw,
    "totalElements",
    "totalItems",
    "total",
  );
  const totalPages = getNullableNumber(raw, "totalPages", "pages");

  if (
    size === null &&
    number === null &&
    totalElements === null &&
    totalPages === null
  ) {
    return null;
  }

  return {
    size: Math.max(0, size ?? 0),
    number: Math.max(0, number ?? 0),
    totalElements: Math.max(0, totalElements ?? 0),
    totalPages: Math.max(0, totalPages ?? 0),
  };
}

function normalizeVisitCollectionResponse(raw: unknown): VisitListPage {
  if (Array.isArray(raw)) {
    return {
      content: raw.filter(isRecord).map(normalizeVisitListItem),
      page: null,
    };
  }

  if (!isRecord(raw)) {
    return { content: [], page: null };
  }

  const nestedCollection = raw.content ?? raw.items ?? raw.data;
  const content = Array.isArray(nestedCollection)
    ? nestedCollection.filter(isRecord).map(normalizeVisitListItem)
    : [];
  const pageSource = isRecord(raw.page) ? raw.page : raw;

  return {
    content,
    page: normalizeVisitPageMetadata(pageSource),
  };
}

function normalizePagedVisitCollectionResponse(
  raw: unknown,
): Page<VisitListItemResponse> {
  // Kontrollime, et 'raw' on üldse objekt, et vältida runtime vigu
  const data = isRecord(raw) ? raw : {};
  const content = Array.isArray(data.content)
    ? data.content.map(normalizeVisitListItem)
    : [];

  return {
    content: content,
    totalElements: Number(data.totalElements ?? 0),
    totalPages: Number(data.totalPages ?? 0),
    size: Number(data.size ?? 0),
    number: Number(data.number ?? 0),
    first: Boolean(data.first),
    last: Boolean(data.last),
    empty: Boolean(data.empty),
  };
}

function sanitizePageNumber(
  value: number | undefined,
  fallback: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(value));
}

function sanitizePageSize(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.trunc(value));
}

function buildVisitsPath(params?: VisitListQueryParams): string {
  const url = new URL("/api/visits", "http://localhost");

  if (params?.search) {
    url.searchParams.set("search", params.search);
  }

  if (params?.status && params.status !== VISIT_STATUS_ALL) {
    url.searchParams.set("status", params.status);
  }

  if (params?.dateFrom) {
    url.searchParams.set("dateFrom", params.dateFrom);
  }

  if (params?.dateTo) {
    url.searchParams.set("dateTo", params.dateTo);
  }

  if (params?.sort) {
    url.searchParams.set("sort", params.sort);
  }

  url.searchParams.set(
    "page",
    String(sanitizePageNumber(params?.page, DEFAULT_VISITS_PAGE)),
  );
  url.searchParams.set(
    "size",
    String(sanitizePageSize(params?.size, DEFAULT_VISITS_PAGE_SIZE)),
  );

  return `${url.pathname}${url.search}`;
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
  await apiClient.put<void, RegisterVisitDepartureRequest>(
    `/api/visits/${visitId}/exit`,
    { exitTime: toLocalDateTimeValue(new Date()) },
  );
}

export async function getVisits(
  params?: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
  },
  signal?: AbortSignal,
): Promise<VisitListPage> {
  const path = buildVisitsPath({
    ...params,
    page: sanitizePageNumber(params?.page, DEFAULT_VISITS_PAGE),
    size: sanitizePageSize(params?.size, DEFAULT_VISITS_PAGE_SIZE),
  });
  const raw = await apiClient.get<VisitListResponsePayload>(path, { signal });

  return normalizeVisitCollectionResponse(raw);
}

export async function getLatestVisits(
  params?: { page?: number; size?: number },
  signal?: AbortSignal,
): Promise<Page<VisitListItemResponse>> {
  const path = buildVisitsPath({
    page: sanitizePageNumber(params?.page, DEFAULT_VISITS_PAGE),
    size: sanitizePageSize(params?.size, DEFAULT_RECENT_VISITS_PAGE_SIZE),
    sort: DEFAULT_RECENT_VISITS_SORT,
  });
  const raw = await apiClient.get<VisitListResponsePayload>(path, { signal });

  return normalizePagedVisitCollectionResponse(raw);
}

export async function getRecentVisits(
  params?: { page?: number; size?: number },
  signal?: AbortSignal,
): Promise<Page<VisitListItemResponse>> {
  return getLatestVisits(params, signal);
}
