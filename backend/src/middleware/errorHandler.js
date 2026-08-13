import { ZodError } from "zod";

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
}
