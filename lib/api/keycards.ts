import { apiClient } from "@/lib/apiClient";

export type KeycardStatus = "available" | "in_use" | "disabled" | "expired";

export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface KeycardResponse {
  id: string;
  keycardNumber: string;
  active: boolean;
  status: KeycardStatus;
  assignedUser: string | null;
  assignedTime: string | null;
  lastReturnTime: string | null;
  validUntil: string | null;
}

export interface KeycardDetailResponse extends KeycardResponse {
  assignedPersonInRoleId: string | null;
}

export interface CreateKeycardRequest {
  keycardNumber: string;
  validUntil?: string;
  initialStatus: boolean;
}

export interface ReturnKeycardRequest {
  returnAccessPointId: string;
}

export interface KeycardListPage {
  content: KeycardResponse[];
  page: PageMetadata | null;
}

interface KeycardQueryOptions {
  page?: number;
  size?: number;
  search?: string;
  status?: KeycardStatus;
}

interface RawPagedResponse {
  content?: unknown[];
  page?: Partial<PageMetadata>;
}

type UnknownRecord = Record<string, unknown>;

export async function getKeycards(
  options: KeycardQueryOptions = {},
): Promise<KeycardListPage> {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 0));
  params.set("size", String(options.size ?? 100));

  if (options.search) {
    params.set("search", options.search);
  }

  if (options.status) {
    params.set("status", options.status);
  }

  const page = await apiClient.get<RawPagedResponse>(
    `/api/keycards?${params.toString()}`,
  );

  return {
    content: Array.isArray(page.content)
      ? page.content.map(mapKeycardSummary).filter(isDefined)
      : [],
    page: page.page ? mapPageMetadata(page.page) : null,
  };
}

export async function getAvailableKeycards(): Promise<KeycardResponse[]> {
  const page = await getKeycards({ status: "available", size: 200 });
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

export async function getKeycard(
  cardId: string,
): Promise<KeycardDetailResponse> {
  const raw = await apiClient.get<unknown>(`/api/keycards/${cardId}`);
  const record = asRecord(raw);

  if (!record) {
    throw new Error("Võtmekaardi andmeid ei õnnestunud töödelda.");
  }

  const summary = mapKeycardSummary(record);

  if (!summary) {
    throw new Error("Võtmekaardi andmeid ei õnnestunud töödelda.");
  }

  return {
    ...summary,
    assignedPersonInRoleId: pickString(record, ["assignedPersonInRoleId"]),
  };
}

export function createKeycard(
  body: CreateKeycardRequest,
): Promise<KeycardDetailResponse> {
  return apiClient.post<KeycardDetailResponse, CreateKeycardRequest>(
    "/api/keycards",
    body,
  );
}

export function returnKeycard(
  cardId: string,
  body: ReturnKeycardRequest,
): Promise<KeycardDetailResponse> {
  return apiClient.post<KeycardDetailResponse, ReturnKeycardRequest>(
    `/api/keycards/${cardId}/return`,
    body,
  );
}

export function getKeycardStatusLabel(status: KeycardStatus): string {
  switch (status) {
    case "available":
      return "Saadaval";
    case "in_use":
      return "Kasutuses";
    case "disabled":
      return "Deaktiveeritud";
    case "expired":
      return "Aegunud";
  }
}

function mapPageMetadata(page: Partial<PageMetadata>): PageMetadata {
  return {
    size: Number(page.size ?? 0),
    number: Number(page.number ?? 0),
    totalElements: Number(page.totalElements ?? 0),
    totalPages: Number(page.totalPages ?? 0),
  };
}

function mapKeycardSummary(raw: unknown): KeycardResponse | null {
  const record = asRecord(raw);

  if (!record) {
    return null;
  }

  const id = pickString(record, ["id"]);
  const keycardNumber = pickString(record, ["keycardNumber"]);

  if (!id || !keycardNumber) {
    return null;
  }

  const rawActive = pickBoolean(record, ["active"]);
  const assignedUser = pickString(record, ["assignedUser"]);
  const assignedTime = pickString(record, ["assignedTime"]);
  // TODO: remove guard once backend ensures lastReturnTime is always a past timestamp.
  // Currently the backend may populate lastReturnTime with a future planned-return date,
  // which belongs in validUntil instead.
  const rawLastReturnTime = pickString(record, ["lastReturnTime"]);
  const lastReturnTime =
    rawLastReturnTime && new Date(rawLastReturnTime) <= new Date()
      ? rawLastReturnTime
      : null;
  const validUntil = pickString(record, ["validUntil"]);
  const rawStatus = pickString(record, ["status"]);
  const status =
    mapRawStatus(rawStatus) ??
    normalizeStatus(rawActive ?? true, assignedUser, assignedTime);
  const active = rawActive ?? status !== "disabled";

  return {
    id,
    keycardNumber,
    active,
    status,
    assignedUser,
    assignedTime,
    lastReturnTime,
    validUntil,
  };
}

function normalizeStatus(
  active: boolean,
  assignedUser: string | null,
  assignedTime: string | null,
): KeycardStatus {
  if (!active) {
    return "disabled";
  }

  if (assignedUser || assignedTime) {
    return "in_use";
  }

  return "available";
}

function mapRawStatus(status: string | null): KeycardStatus | null {
  switch (status?.toUpperCase()) {
    case "AVAILABLE":
      return "available";
    case "IN_USE":
      return "in_use";
    case "DISABLED":
      return "disabled";
    case "EXPIRED":
      return "expired";
    default:
      return null;
  }
}

function pickString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function pickBoolean(record: UnknownRecord, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function isDefined<TValue>(value: TValue | null): value is TValue {
  return value !== null;
}
