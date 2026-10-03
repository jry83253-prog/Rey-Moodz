import type { Request, Response, NextFunction } from 'express';

/**
 * Standard Security Headers Middleware
 * Shields the application and APIs against XSS, clickjacking, MIME-sniffing, and data injection.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 2. Shield against Clickjacking
  // Allows preview frames within Google Cloud Run & AI Studio while preventing malicious unauthorized framing
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 3. Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'self' https://*.google.com https://*.run.app",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // 4. Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Cross-Site Scripting Protection (legacy browser fallback)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 6. Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}
