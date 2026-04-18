import { ACCESS_TOKEN_STORAGE_KEY } from "@/lib/auth/constants";

let inMemoryAccessToken: string | null | undefined;

function canUseBrowserStorage(): boolean {
  return globalThis.window !== undefined;
}

export function getStoredAccessToken(): string | null {
  if (!canUseBrowserStorage()) return null;

  if (inMemoryAccessToken !== undefined) {
    return inMemoryAccessToken;
  }

  const token = globalThis.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  inMemoryAccessToken = token;
  return token;
}

export function setStoredAccessToken(token: string): void {
  if (!canUseBrowserStorage()) return;

  inMemoryAccessToken = token;
  globalThis.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  globalThis.document.cookie = "token=; path=/; max-age=0; SameSite=Strict";
}

export function clearStoredAccessToken(): void {
  if (!canUseBrowserStorage()) return;

  inMemoryAccessToken = null;
  globalThis.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  globalThis.document.cookie = "token=; path=/; max-age=0; SameSite=Strict";
}
