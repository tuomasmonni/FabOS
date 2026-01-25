import { Redis } from '@upstash/redis';

// Alusta Redis-yhteys (tukee sekä UPSTASH_ että KV_ prefiksejä)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

// Oletusäänet - aloitetaan nollasta, oikeat äänet
const defaultVotes = {
  owner: {
    values: { right: 0, wrong: 0 },
    speed: { tortoise: 0, rocket: 0 },
    vibe: { serious: 0, chaotic: 0 }
  },
  staff: {
    remote: { 'full-remote': 0, hybrid: 0 },
    'profit-sharing': { 'equal-share': 0, performance: 0 },
    workweek: { 'four-days': 0, flexible: 0 }
  },
  customer: {
    'project-manager': { fire: 0, keep: 0 },
    bureaucracy: { more: 0, less: 0 },
    delivery: { honest: 0, optimistic: 0 },
    support: { ai: 0, human: 0 }
  }
};

// Hae äänet Redistä tai palauta oletukset
async function getVotes() {
  try {
    const votes = await redis.get('levykauppa:votes');
    if (votes) {
      return votes;
    }
    // Tallenna oletukset jos ei ole vielä dataa
    await redis.set('levykauppa:votes', defaultVotes);
    return defaultVotes;
  } catch (error) {
    console.error('Redis error:', error);
    return defaultVotes;
  }
}

// Tallenna äänet Redisiin
async function saveVotes(votes) {
  try {
    await redis.set('levykauppa:votes', votes);
  } catch (error) {
    console.error('Redis save error:', error);
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { category, topicId, optionId } = req.query;

  // Hae äänet
  const votes = await getVotes();

  // GET /api/votes - kaikki äänet
  if (req.method === 'GET' && !category) {
    return res.status(200).json(votes);
  }

  // GET /api/votes?category=owner - kategorian äänet
  if (req.method === 'GET' && category && !topicId) {
    if (!votes[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.status(200).json(votes[category]);
  }

  // POST /api/votes?category=owner&topicId=values&optionId=right - äänestä
  if (req.method === 'POST' && category && topicId && optionId) {
    if (!votes[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (!votes[category][topicId]) {
      votes[category][topicId] = {};
    }

    if (!votes[category][topicId][optionId]) {
      votes[category][topicId][optionId] = 0;
    }

    votes[category][topicId][optionId]++;

    // Tallenna Redisiin
    await saveVotes(votes);

    return res.status(200).json({
      success: true,
      votes: votes[category]
    });
  }

  // POST /api/votes?reset=true - nollaa äänet (admin-toiminto)
  if (req.method === 'POST' && req.query.reset === 'true') {
    await redis.del('levykauppa:votes');
    return res.status(200).json({ success: true, message: 'Votes reset to zero' });
  }

  return res.status(400).json({ error: 'Invalid request' });
}
