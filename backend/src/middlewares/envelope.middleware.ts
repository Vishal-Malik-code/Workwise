import type { NextFunction, Request, Response } from "express";

// Wraps every successful JSON response sent under /api in a {data: ...}
// envelope. Error responses are handled by error.middleware.ts, not here.
export function envelopeMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    if (body && typeof body === "object" && "data" in (body as Record<string, unknown>)) {
      return originalJson(body);
    }
    return originalJson({ data: body });
  }) as Response["json"];

  next();
}
