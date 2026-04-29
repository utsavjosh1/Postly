import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

/**
 * Request ID Middleware
 *
 * Attaches a unique correlation ID to every incoming request.
 * - If the client provides `X-Request-ID`, it is reused (e.g. from Nginx).
 * - Otherwise, a new UUID v4 is generated.
 *
 * The ID is:
 * 1. Set on the request headers for downstream middleware/controllers.
 * 2. Sent back as a response header for client-side correlation.
 *
 * This enables end-to-end request tracing through logs.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const id = (req.headers["x-request-id"] as string) || randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-ID", id);
  next();
}
