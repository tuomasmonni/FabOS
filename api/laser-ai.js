// ============================================================================
// LASER CUTTING AI ASSISTANT API - Vercel Serverless Function
// ============================================================================
// POST /api/laser-ai
// Käsittelee laserleikkausmoduulin AI-avustajan pyynnöt (muotojen luonti, muokkaus)

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt laserleikkauksen AI:lle
const getSystemPrompt = (shapes, selectedShape) => `
Olet Levykaupan laserleikkausmoduulin AI-avustaja. Autat käyttäjiä luomaan ja muokkaamaan 2D-muotoja laserleikattavaksi.

NYKYISET MUODOT:
${shapes.length > 0 ? JSON.stringify(shapes, null, 2) : 'Ei muotoja'}

VALITTU MUOTO: ${selectedShape !== null ? `Muoto #${selectedShape}` : 'Ei valintaa'}

KÄYTETTÄVISSÄ OLEVAT TOIMINNOT (JSON-komennot):

1. LUO UUSI MUOTO:
\`\`\`json
{"action": "create", "type": "rectangle", "width": 100, "height": 50}
{"action": "create", "type": "circle", "diameter": 80}
{"action": "create", "type": "triangle", "base": 100, "height": 80}
{"action": "create", "type": "polygon", "sides": 6, "size": 100}
{"action": "create", "type": "lshape", "width": 200, "height": 150, "leg": 50}
\`\`\`

2. MUOKKAA VALITTUA MUOTOA:
\`\`\`json
{"action": "modify", "property": "width", "value": 150}
{"action": "modify", "property": "height", "value": 200}
{"action": "modify", "property": "diameter", "value": 120}
{"action": "modify", "property": "legWidth", "value": 60}
\`\`\`

3. LISÄÄ REIKÄ MUOTOON:
\`\`\`json
{"action": "addHole", "diameter": 10}
{"action": "addHole", "diameter": 8, "x": 50, "y": 25}
\`\`\`

4. POISTA REIKIÄ TAI MUOTO:
\`\`\`json
{"action": "removeHoles"}
{"action": "removeHoles", "holeIndex": 0}
{"action": "delete"}
\`\`\`

5. USEITA KOMENTOJA KERRALLA (esim. muoto + reiät):
\`\`\`json
[
  {"action": "create", "type": "rectangle", "width": 200, "height": 100},
  {"action": "addHole", "diameter": 8, "x": 25, "y": 25},
  {"action": "addHole", "diameter": 8, "x": 175, "y": 25},
  {"action": "addHole", "diameter": 8, "x": 25, "y": 75},
  {"action": "addHole", "diameter": 8, "x": 175, "y": 75}
]
\`\`\`

OHJEET:
1. Vastaa AINA suomeksi
2. Ole ystävällinen ja avulias
3. Kun käyttäjä pyytää luomaan tai muokkaamaan muotoa, sisällytä JSON-komennot vastaukseen
4. JSON-komennot tulee olla \`\`\`json ... \`\`\` -lohkon sisällä
5. Voit antaa useita komentoja kerralla array-muodossa
6. Selitä lyhyesti mitä teit
7. Mitat ovat millimetreissä
8. Reikien x,y koordinaatit ovat suhteessa muodon vasempaan alakulmaan

ESIMERKKEJÄ:

Käyttäjä: "Tee 200x100 suorakulmio"
Vastaus: "Luon suorakulmion kooltaan 200×100 mm.
\`\`\`json
{"action": "create", "type": "rectangle", "width": 200, "height": 100}
\`\`\`"

Käyttäjä: "Lisää neljä 8mm reikää kulmiin"
Vastaus: "Lisään neljä Ø8mm reikää suorakulmion kulmiin (25mm marginaalilla).
\`\`\`json
[
  {"action": "addHole", "diameter": 8, "x": 25, "y": 25},
  {"action": "addHole", "diameter": 8, "x": 175, "y": 25},
  {"action": "addHole", "diameter": 8, "x": 25, "y": 75},
  {"action": "addHole", "diameter": 8, "x": 175, "y": 75}
]
\`\`\`"

Käyttäjä: "Muuta leveys 300mm"
Vastaus: "Muutan valitun muodon leveydeksi 300 mm.
\`\`\`json
{"action": "modify", "property": "width", "value": 300}
\`\`\`"
`;

export default async function handler(req, res) {
  // CORS
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
    const { messages, shapes, selectedShape } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array' });
    }

    // Kutsu Claude API:a
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: getSystemPrompt(shapes || [], selectedShape),
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    const content = response.content[0].text;

    return res.status(200).json({
      content,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('Laser AI error:', error);

    if (error.status === 401) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    return res.status(500).json({
      error: 'AI request failed',
      message: error.message
    });
  }
}
