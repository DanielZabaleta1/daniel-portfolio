import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LIST_KEY, getRedis, parseComment } from '../_wall.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const adminToken = process.env.ADMIN_TOKEN;
  const auth = req.headers.authorization;
  const provided = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;

  if (!adminToken || provided !== adminToken) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(503).json({ error: 'wall_not_configured' });
    return;
  }

  const { id } = req.query;
  const targetId = Array.isArray(id) ? id[0] : id;
  if (!targetId) {
    res.status(400).json({ error: 'missing_id' });
    return;
  }

  const raw = await redis.lrange(LIST_KEY, 0, -1);
  const match = raw.find((r) => parseComment(r)?.id === targetId);

  if (!match) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  await redis.lrem(LIST_KEY, 0, match as string);
  res.status(200).json({ deleted: targetId });
}
