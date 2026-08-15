export const APP_ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  GONE: "GONE",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

export class AppError extends Error {
  statusCode: number;
  code: AppErrorCode;
  fields?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: AppErrorCode,
    message: string,
    fields?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message = "Bad request", fields?: Record<string, unknown>) {
    return new AppError(400, APP_ERROR_CODES.BAD_REQUEST, message, fields);
  }

  static unauthorized(message = "Not authenticated") {
    return new AppError(401, APP_ERROR_CODES.UNAUTHORIZED, message);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(403, APP_ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message = "Not found") {
    return new AppError(404, APP_ERROR_CODES.NOT_FOUND, message);
  }

  static conflict(message = "Conflict") {
    return new AppError(409, APP_ERROR_CODES.CONFLICT, message);
  }

  static gone(message = "Gone") {
    return new AppError(410, APP_ERROR_CODES.GONE, message);
  }

  static serviceUnavailable(message = "Service unavailable") {
    return new AppError(503, APP_ERROR_CODES.SERVICE_UNAVAILABLE, message);
  }

  static internalError(message = "Internal server error") {
    return new AppError(500, APP_ERROR_CODES.INTERNAL_ERROR, message);
  }
}
