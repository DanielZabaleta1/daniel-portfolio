import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { LIST_KEY, MAX_COMMENTS, MAX_LEN, RATE_LIMIT_SECONDS, containsUrl, getRedis, parseComment } from '../_wall.js';

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0];
  return (first || req.socket?.remoteAddress || 'unknown').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const redis = getRedis();
  if (!redis) {
    res.status(503).json({ error: 'wall_not_configured' });
    return;
  }

  if (req.method === 'GET') {
    const raw = await redis.lrange(LIST_KEY, 0, MAX_COMMENTS - 1);
    const comments = raw.map(parseComment).filter((c): c is NonNullable<typeof c> => c !== null);
    res.status(200).json({ comments });
    return;
  }

  if (req.method === 'POST') {
    const ip = getClientIp(req);
    const allowed = await redis.set(`wall:rl:${ip}`, '1', { nx: true, ex: RATE_LIMIT_SECONDS });
    if (!allowed) {
      res.status(429).json({ error: 'rate_limited' });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      res.status(400).json({ error: 'empty' });
      return;
    }
    if (text.length > MAX_LEN) {
      res.status(400).json({ error: 'too_long' });
      return;
    }
    if (containsUrl(text)) {
      res.status(400).json({ error: 'contains_url' });
      return;
    }

    const comment = { id: randomUUID(), t: text, ts: Date.now() };
    await redis.lpush(LIST_KEY, JSON.stringify(comment));
    await redis.ltrim(LIST_KEY, 0, MAX_COMMENTS - 1);

    res.status(201).json({ comment });
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'method_not_allowed' });
}
