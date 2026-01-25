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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all suggestions
      const suggestions = await redis.lrange(SUGGESTIONS_KEY, 0, -1);
      const parsed = suggestions.map(s => {
        try {
          return typeof s === 'string' ? JSON.parse(s) : s;
        } catch {
          return s;
        }
      });

      // Sort by votes (descending)
      parsed.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      return res.status(200).json({ suggestions: parsed });
    }

    if (req.method === 'POST') {
      const { suggestion, name, email, category, timestamp } = req.body;

      if (!suggestion || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newSuggestion = {
        id: `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        suggestion,
        name: name || 'Anonyymi',
        email: email || '',
        category,
        timestamp: timestamp || new Date().toISOString(),
        votes: 0
      };

      await redis.lpush(SUGGESTIONS_KEY, JSON.stringify(newSuggestion));

      return res.status(200).json({ success: true, suggestion: newSuggestion });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
