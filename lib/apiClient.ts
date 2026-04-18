import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "@/lib/auth/accessToken";
import { LOGIN_PATH } from "@/lib/auth/constants";
import { logout, refreshAccessToken } from "@/lib/api/auth";
import { ApiError, extractErrorMessage, parseErrorData } from "@/lib/api/error";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const LOG = process.env.NEXT_PUBLIC_DEBUG === "true";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  headers?: Record<string, string>;
  /** Abort controller signal for request cancellation */
  signal?: AbortSignal;
}

interface MutationOptions<TBody> extends RequestOptions {
  body?: TBody;
}

let refreshRequest: Promise<string> | null = null;

function getAuthHeaders(
  accessToken = getStoredAccessToken(),
): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function serializeRequestBody(body: unknown): string | undefined {
  if (body === undefined) {
    return undefined;
  }

  return JSON.stringify(body);
}

function logRequest(method: HttpMethod, path: string, body: unknown): void {
  if (LOG) {
    console.log(
      `[apiClient] --> ${method} ${BASE_URL}${path}`,
      body === undefined ? "" : body,
    );
  }
}

async function parseResponse<TResponse>(
  method: HttpMethod,
  path: string,
  response: Response,
): Promise<TResponse> {
  if (response.status === 204) {
    if (LOG) console.log(`[apiClient] <-- ${method} ${path} 204 No Content`);
    return undefined as TResponse;
  }

  const data = (await response.json()) as TResponse;
  if (LOG)
    console.log(`[apiClient] <-- ${method} ${path} ${response.status}`, data);
  return data;
}

async function clearSession(): Promise<void> {
  clearStoredAccessToken();

  if (globalThis.window === undefined) return;

  try {
    await logout();
  } catch {
    // Best effort cleanup of the HttpOnly refresh cookie.
  }
}

async function handleUnauthorized(): Promise<never> {
  await clearSession();

  if (globalThis.window !== undefined) {
    globalThis.window.location.href = LOGIN_PATH;
  }

  throw new ApiError(401, "Seanss on aegunud. Palun logige uuesti sisse.");
}

async function refreshStoredAccessToken(): Promise<string> {
  refreshRequest ??= refreshAccessToken()
    .then(({ accessToken }) => {
      setStoredAccessToken(accessToken);
      return accessToken;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
}

async function throwForResponse(
  method: HttpMethod,
  path: string,
  response: Response,
): Promise<never> {
  const errorData = await parseErrorData(response);
  const message = extractErrorMessage(errorData, response);
  if (LOG)
    console.log(
      `[apiClient] <-- ${method} ${path} ${response.status}`,
      errorData,
    );
  throw new ApiError(response.status, message, errorData);
}

function createRequestExecutor(
  method: HttpMethod,
  path: string,
  headers: Record<string, string> | undefined,
  signal: AbortSignal | undefined,
  serializedBody: string | undefined,
) {
  return (accessToken?: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeaders(accessToken),
        ...headers,
      },
      body: serializedBody,
      signal,
    });
}

function canRefreshUnauthorizedResponse(response: Response): boolean {
  return response.status === 401 && globalThis.window !== undefined;
}

async function retryRequestAfterRefresh<TResponse>(
  method: HttpMethod,
  path: string,
  executeRequest: (accessToken?: string | null) => Promise<Response>,
): Promise<TResponse> {
  try {
    const freshAccessToken = await refreshStoredAccessToken();
    const retryResponse = await executeRequest(freshAccessToken);

    if (retryResponse.ok) {
      return parseResponse<TResponse>(method, path, retryResponse);
    }

    if (retryResponse.status === 401) {
      return handleUnauthorized();
    }

    return throwForResponse(method, path, retryResponse);
  } catch (error) {
    if (error instanceof ApiError && error.status !== 401) {
      throw error;
    }

    return handleUnauthorized();
  }
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  options: RequestOptions & { body?: unknown } = {},
): Promise<TResponse> {
  const { headers, signal, body } = options;
  const serializedBody = serializeRequestBody(body);
  logRequest(method, path, body);
  const executeRequest = createRequestExecutor(
    method,
    path,
    headers,
    signal,
    serializedBody,
  );

  const response = await executeRequest();

  if (response.ok) {
    return parseResponse<TResponse>(method, path, response);
  }

  if (canRefreshUnauthorizedResponse(response)) {
    return retryRequestAfterRefresh<TResponse>(method, path, executeRequest);
  }

  return throwForResponse(method, path, response);
}

export const apiClient = {
  get<TResponse>(path: string, options?: RequestOptions) {
    return request<TResponse>("GET", path, options);
  },

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) {
    return request<TResponse>("POST", path, { ...options, body });
  },

  put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) {
    return request<TResponse>("PUT", path, { ...options, body });
  },

  patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ) {
    return request<TResponse>("PATCH", path, { ...options, body });
  },

  delete<TResponse>(path: string, options?: MutationOptions<never>) {
    return request<TResponse>("DELETE", path, options);
  },
};
