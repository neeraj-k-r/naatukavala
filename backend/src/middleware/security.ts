import type { Request, Response, NextFunction } from "express";

/**
 * Baseline hardening headers for every API response (no new dependency).
 * Clickjacking, MIME-sniffing and referrer leakage covered; HSTS only in
 * production so local HTTP development keeps working.
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  next();
}
