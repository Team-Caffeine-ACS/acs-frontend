import "server-only";

import { cookies } from "next/headers";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";

export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  exp?: number;
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
}

export async function postAuthToBackend(
  path: string,
  body: unknown,
): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function readJsonResponse<T>(
  response: Response,
): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getRefreshTokenCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? null;
}

function decodeJwtPayload(token: string): JwtPayload {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Refresh token payload is missing.");
  }

  const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return JSON.parse(
    Buffer.from(paddedBase64, "base64").toString("utf8"),
  ) as JwtPayload;
}

function getRefreshTokenMaxAgeSeconds(refreshToken: string): number {
  const payload = decodeJwtPayload(refreshToken);

  if (
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= 0
  ) {
    throw new Error("Refresh token exp claim is missing or invalid.");
  }

  return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
}

export async function setRefreshTokenCookie(
  refreshToken: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getRefreshTokenMaxAgeSeconds(refreshToken),
  });
}

export async function clearRefreshTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
