import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.VITE_CLAUDE_API_KEY
});

// System prompt for the shape editor assistant
const SYSTEM_PROMPT = `Olet levykaupan AI-avustaja, joka auttaa käyttäjiä muokkaamaan metallilevyjä.

Sinulla on käytössäsi seuraavat komennot JSON-muodossa:

1. LUO UUSI MUOTO:
{"action": "create", "type": "rectangle", "width": 200, "height": 100}
{"action": "create", "type": "circle", "diameter": 150}
{"action": "create", "type": "triangle", "base": 100, "height": 80}
{"action": "create", "type": "polygon", "sides": 6, "size": 120}
{"action": "create", "type": "lshape", "width": 200, "height": 150, "leg": 50}

2. MUOKKAA VALITTUA MUOTOA:
{"action": "modify", "property": "width", "value": 250}
{"action": "modify", "property": "height", "value": 150}
{"action": "modify", "property": "diameter", "value": 200}
{"action": "modify", "property": "radius", "value": 100}
{"action": "modify", "property": "filletRadius", "value": 10}  // Kulmien pyöristys (vain monikulmioille)

3. LISÄÄ REIKÄ VALITTUUN MUOTOON:
{"action": "addHole", "diameter": 10}
{"action": "addHole", "diameter": 8, "x": 50, "y": 30}

4. POISTA REIÄT VALITUSTA MUODOSTA:
{"action": "removeHoles"}                    // Poistaa KAIKKI reiät
{"action": "removeHoles", "holeIndex": 0}    // Poistaa tietyn reiän (0 = ensimmäinen)

5. POISTA KOKO MUOTO:
{"action": "deleteShape"}

6. TIEDOT:
{"action": "info"}

TÄRKEÄÄ:
- Vastaa AINA ensin lyhyesti suomeksi mitä teet
- Lisää sitten JSON-komennot koodilohkossa: \`\`\`json ... \`\`\`
- Jos käyttäjä haluaa USEITA toimintoja (esim. 3 reikää), käytä JSON-taulukkoa
- Jos käyttäjä haluaa muokata olemassaolevaa muotoa, käytä "modify" eikä "create"
- Jos muotoa ei ole valittu ja käyttäjä haluaa muokata, ilmoita siitä
- TÄRKEÄÄ: Kun käyttäjä pyytää poistamaan REIÄT, käytä "removeHoles" - ÄLÄ "deleteShape"!
- "deleteShape" poistaa KOKO muodon, "removeHoles" poistaa vain reiät

Esimerkkejä:
- "Poista reiät" → {"action": "removeHoles"}
- "Poista kaikki reiät" → {"action": "removeHoles"}
- "Poista levy/muoto" → {"action": "deleteShape"}
- "Lisää 2 reikää" → [{"action": "addHole", ...}, {"action": "addHole", ...}]
- "Pyöristä kulmat 10mm" → {"action": "modify", "property": "filletRadius", "value": 10}
- "Tee pyöristetty kuusikulmio" → luodaan polygon ja asetetaan filletRadius`;

app.post('/api/claude', async (req, res) => {
  try {
    const { messages, selectedShape, shapes } = req.body;

    // Build context about current state
    let contextMessage = '';
    if (shapes && shapes.length > 0) {
      contextMessage = `\n\nNykyiset muodot (${shapes.length} kpl):\n`;
      shapes.forEach((shape, i) => {
        const selected = selectedShape === i ? ' [VALITTU]' : '';
        if (shape.type === 'rectangle') {
          contextMessage += `${i + 1}. Suorakaide ${shape.width}x${shape.height}mm${selected}\n`;
        } else if (shape.type === 'circle') {
          contextMessage += `${i + 1}. Ympyrä Ø${shape.radius * 2}mm${selected}\n`;
        } else if (shape.type === 'polygon') {
          contextMessage += `${i + 1}. Monikulmio ${shape.points?.length || 0} pistettä${selected}\n`;
        } else if (shape.type === 'lshape') {
          contextMessage += `${i + 1}. L-muoto ${shape.width}x${shape.height}mm${selected}\n`;
        }
        if (shape.holes && shape.holes.length > 0) {
          shape.holes.forEach((hole, hi) => {
            contextMessage += `   - Reikä ${hi + 1}: Ø${hole.diameter}mm\n`;
          });
        }
      });
    } else {
      contextMessage = '\n\nEi vielä muotoja. Käyttäjä voi luoda uuden muodon.';
    }

    if (selectedShape !== null && selectedShape !== undefined && shapes && shapes[selectedShape]) {
      contextMessage += `\nValittu muoto: #${selectedShape + 1}`;
    } else {
      contextMessage += '\nEi valittua muotoa.';
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextMessage,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    res.json({
      content: response.content[0].text
    });
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Claude proxy server running on http://localhost:${PORT}`);
});
