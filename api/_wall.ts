import { Redis } from '@upstash/redis';

export const LIST_KEY = 'wall:comments';
export const MAX_COMMENTS = 200;
export const MAX_LEN = 80;
export const RATE_LIMIT_SECONDS = 10;

const URL_PATTERN = /(https?:\/\/|www\.)/i;
const DOMAIN_PATTERN = /\b[a-z0-9-]+\.(com|net|org|io|co|dev|app|me|ai|gg|xyz|info)\b/i;

export const containsUrl = (s: string) => URL_PATTERN.test(s) || DOMAIN_PATTERN.test(s);

export type WallComment = { id: string; t: string; ts: number };

export function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function parseComment(raw: unknown): WallComment | null {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed.id === 'string' && typeof parsed.t === 'string') {
      return parsed as WallComment;
    }
    return null;
  } catch {
    return null;
  }
}
