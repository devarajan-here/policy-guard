import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import { getEmployee } from './hr-data';

const SESSION_NAME = 'peopleguard_session';
const SESSION_TTL = 60 * 60 * 8;

function secret() {
  return process.env.SESSION_SECRET || 'peopleguard-local-demo-secret-change-in-production';
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSessionToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_TTL * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { userId: string; expiresAt: number };
    if (parsed.expiresAt < Date.now()) return null;
    return getEmployee(parsed.userId);
  } catch {
    return null;
  }
}

export const sessionConfig = {
  name: SESSION_NAME,
  maxAge: SESSION_TTL,
};
