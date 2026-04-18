import { ApiError, extractErrorMessage, parseErrorData } from "@/lib/api/error";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AccessTokenResponse {
  accessToken: string;
}

async function requestSession<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const data = await parseErrorData(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(data, response),
      data,
    );
  }

  return data as TResponse;
}

export function login(body: LoginRequest): Promise<AccessTokenResponse> {
  return requestSession<AccessTokenResponse>("/api/session/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function refreshAccessToken(): Promise<AccessTokenResponse> {
  return requestSession<AccessTokenResponse>("/api/session/refresh", {
    method: "POST",
  });
}

export function logout(): Promise<void> {
  return requestSession<void>("/api/session/logout", {
    method: "POST",
  });
}
