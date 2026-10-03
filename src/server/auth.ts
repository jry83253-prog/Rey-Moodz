import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/client.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || 'rey-modder-secure-session-key-32chars-long-random';
const SESSION_COOKIE_NAME = 'rm_session_token';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Rate limiting in-memory store for login attempts
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);

  if (!record) {
    return { allowed: true };
  }

  if (now - record.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    loginRateLimitMap.delete(ip);
    return { allowed: true };
  }

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.firstAttemptAt)) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);
  if (!record || now - record.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    loginRateLimitMap.set(ip, { attempts: 1, firstAttemptAt: now });
  } else {
    record.attempts += 1;
  }
}

export function clearLoginRateLimit(ip: string): void {
  loginRateLimitMap.delete(ip);
}

// Token creation: base64url(payload).hmac_signature
export function createSessionToken(adminId: string, username: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = JSON.stringify({ adminId, username, exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): { adminId: string; username: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return { adminId: payload.adminId, username: payload.username };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    username: string;
  };
}

export async function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    token = req.cookies[SESSION_COOKIE_NAME];
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Session missing' });
    return;
  }

  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    return;
  }

  // Verify admin exists in database
  const result = await db.execute({
    sql: 'SELECT id, username FROM admins WHERE id = ? LIMIT 1',
    args: [session.adminId],
  });

  if (result.rows.length === 0) {
    res.status(401).json({ error: 'Unauthorized: User does not exist' });
    return;
  }

  req.admin = {
    id: result.rows[0].id as string,
    username: result.rows[0].username as string,
  };

  next();
}
