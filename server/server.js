import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'votes.json');

// Initialize votes data
const initializeVotes = () => {
  const defaultVotes = {
    owner: {
      values: { right: 45, wrong: 32 },
      speed: { tortoise: 28, rocket: 51 },
      vibe: { serious: 38, chaotic: 41 }
    },
    staff: {
      remote: { 'full-remote': 67, hybrid: 43 },
      'profit-sharing': { 'equal-share': 52, performance: 38 },
      workweek: { 'four-days': 71, flexible: 29 }
    },
    customer: {
      'project-manager': { fire: 89, keep: 34 },
      bureaucracy: { more: 12, less: 78 },
      delivery: { honest: 65, optimistic: 45 },
      support: { ai: 52, human: 48 }
    }
  };

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultVotes, null, 2));
    return defaultVotes;
  }

  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultVotes, null, 2));
    return defaultVotes;
  }
};

let votes = initializeVotes();

// Save votes to file
const saveVotes = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(votes, null, 2));
};

// GET all votes for a category
app.get('/api/votes/:category', (req, res) => {
  const { category } = req.params;

  if (!votes[category]) {
    return res.status(404).json({ error: 'Category not found' });
  }

  res.json(votes[category]);
});

// POST a vote
app.post('/api/votes/:category/:topicId/:optionId', (req, res) => {
  const { category, topicId, optionId } = req.params;

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
  saveVotes();

  res.json({
    success: true,
    votes: votes[category]
  });
});

// GET all votes (for admin/debug)
app.get('/api/votes', (req, res) => {
  res.json(votes);
});

// Reset votes (for testing)
app.post('/api/reset', (req, res) => {
  votes = initializeVotes();
  saveVotes();
  res.json({ success: true, message: 'Votes reset' });
});

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🗳️  Voting API Server Running        ║
  ║   http://localhost:${PORT}               ║
  ╚════════════════════════════════════════╝
  `);
});
