interface CurrentUserRoleInfo {
  roles: string[];
  hasRoleInfo: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getStoredAccessToken(): string | null {
  if (globalThis.window === undefined) {
    return null;
  }

  return (
    globalThis.localStorage.getItem("token") ??
    globalThis.document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("token="))
      ?.slice("token=".length) ??
    null
  );
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replaceAll("-", "+").replaceAll("_", "/");
    const padding = "=".repeat((4 - (normalizedPayload.length % 4)) % 4);
    const decodedPayload = globalThis.atob(normalizedPayload + padding);
    return JSON.parse(decodedPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getCurrentUserRoleInfo(): CurrentUserRoleInfo {
  const token = getStoredAccessToken();
  if (!token) {
    return { roles: [], hasRoleInfo: false };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { roles: [], hasRoleInfo: false };
  }

  const roles = new Set<string>();
  let hasRoleInfo = false;

  for (const key of ["role", "roles", "authorities"]) {
    if (!(key in payload)) {
      continue;
    }

    hasRoleInfo = true;
    for (const role of getStringArray(payload[key])) {
      roles.add(role.toUpperCase());
    }
  }

  if (isRecord(payload.realm_access) && "roles" in payload.realm_access) {
    hasRoleInfo = true;
    for (const role of getStringArray(payload.realm_access.roles)) {
      roles.add(role.toUpperCase());
    }
  }

  return {
    roles: [...roles],
    hasRoleInfo,
  };
}
