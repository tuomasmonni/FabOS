import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const SUGGESTIONS_KEY = 'feature_suggestions';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { suggestionId } = req.body;

    if (!suggestionId) {
      return res.status(400).json({ error: 'Missing suggestionId' });
    }

    // Get all suggestions
    const suggestions = await redis.lrange(SUGGESTIONS_KEY, 0, -1);

    // Find and update the suggestion
    let found = false;
    const updated = suggestions.map(s => {
      const parsed = typeof s === 'string' ? JSON.parse(s) : s;
      if (parsed.id === suggestionId) {
        found = true;
        return JSON.stringify({
          ...parsed,
          votes: (parsed.votes || 0) + 1
        });
      }
      return typeof s === 'string' ? s : JSON.stringify(s);
    });

    if (!found) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    // Delete old list and push updated items
    await redis.del(SUGGESTIONS_KEY);
    if (updated.length > 0) {
      await redis.rpush(SUGGESTIONS_KEY, ...updated);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Vote API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
