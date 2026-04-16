const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const LOG = process.env.NEXT_PUBLIC_DEBUG === "true";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  headers?: Record<string, string>;
  /** Abort controller signal for request cancellation */
  signal?: AbortSignal;
}

interface MutationOptions<TBody> extends RequestOptions {
  body?: TBody;
}

function getAuthHeaders(): Record<string, string> {
  if (globalThis.window === undefined) return {};
  const token =
    localStorage.getItem("token") ??
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.slice("token=".length);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorData(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function extractErrorMessage(errorData: unknown, response: Response): string {
  if (
    typeof errorData === "object" &&
    errorData !== null &&
    "message" in errorData &&
    typeof (errorData as Record<string, unknown>).message === "string"
  ) {
    return (errorData as Record<string, string>).message;
  }
  return `HTTP ${response.status}: ${response.statusText}`;
}

function handleUnauthorized(): never {
  globalThis.localStorage.removeItem("token");
  globalThis.document.cookie = "token=; path=/; max-age=0";
  globalThis.window.location.href = "/login";
  throw new ApiError(401, "Seanss on aegunud. Palun logige uuesti sisse.");
}

async function throwForResponse(
  method: HttpMethod,
  path: string,
  response: Response,
): Promise<never> {
  if (response.status === 401) {
    if (globalThis.window === undefined) {
      throw new ApiError(401, "Seanss on aegunud. Palun logige uuesti sisse.");
    }
    handleUnauthorized();
  }
  const errorData = await parseErrorData(response);
  const message = extractErrorMessage(errorData, response);
  if (LOG)
    console.log(
      `[apiClient] <-- ${method} ${path} ${response.status}`,
      errorData,
    );
  throw new ApiError(response.status, message, errorData);
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  options: RequestOptions & { body?: unknown } = {},
): Promise<TResponse> {
  const { headers, signal, body } = options;

  if (LOG)
    console.log(
      `[apiClient] --> ${method} ${BASE_URL}${path}`,
      body === undefined ? "" : body,
    );

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeaders(),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    await throwForResponse(method, path, response);
  }

  if (response.status === 204) {
    if (LOG) console.log(`[apiClient] <-- ${method} ${path} 204 No Content`);
    return undefined as TResponse;
  }

  const data = await response.json();
  if (LOG)
    console.log(`[apiClient] <-- ${method} ${path} ${response.status}`, data);
  return data as TResponse;
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
