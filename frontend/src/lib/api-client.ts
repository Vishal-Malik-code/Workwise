const API_BASE = "/api";

export type ApiErrorFields = Record<string, unknown> | undefined;

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: ApiErrorFields;

  constructor(message: string, status: number, code: string, fields?: ApiErrorFields) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface EnvelopeError {
  error: { code: string; message: string; fields?: Record<string, unknown> };
}

interface EnvelopeData<T> {
  data: T;
}

function isEnvelopeError(body: unknown): body is EnvelopeError {
  return !!body && typeof body === "object" && "error" in (body as Record<string, unknown>);
}

function isEnvelopeData(body: unknown): body is EnvelopeData<unknown> {
  return !!body && typeof body === "object" && "data" in (body as Record<string, unknown>);
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: object;
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Thin fetch wrapper that talks to the backend's /api routes, unwraps the
 * {data}/{error} envelope (see backend/src/middlewares/envelope.middleware.ts
 * and error.middleware.ts), and throws a typed ApiError on failure.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    if (isEnvelopeError(raw)) {
      throw new ApiError(raw.error.message, res.status, raw.error.code, raw.error.fields);
    }
    throw new ApiError("Request failed", res.status, "UNKNOWN_ERROR");
  }

  if (isEnvelopeData(raw)) {
    return raw.data as T;
  }

  // Fallback for any response that doesn't carry a {data} envelope
  // (shouldn't happen for /api routes, but keeps this resilient).
  return raw as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};
