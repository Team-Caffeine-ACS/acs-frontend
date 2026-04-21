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

export async function parseErrorData(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export function extractErrorMessage(
  errorData: unknown,
  response: Response,
): string {
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
