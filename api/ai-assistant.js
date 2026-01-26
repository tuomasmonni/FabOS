// ============================================================================
// AI ASSISTANT API - Vercel Serverless Function
// ============================================================================
// POST /api/ai-assistant
// Käsittelee käyttäjän muutospyynnöt ja generoi uusia versioita

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Moduulien peruskonfiguraatiot
const MODULE_CONFIGS = {
  'pipe-bending': {
    name: 'Putkentaivutus',
    description: 'Taivuta putkia 3D-visualisoinnilla',
    baseConfig: {
      version: '1.0.0',
      features: {
        '3dVisualization': true,
        angleInput: true,
        radiusInput: true,
        lengthInput: true,
        materialSelection: true,
        exportDXF: false,
        multipleBends: true,
        maxBends: 10,
        snapToGrid: false,
        showCenterline: true,
        showBendMarkers: true
      },
      ui: {
        theme: 'dark',
        showGrid: true,
        showDimensions: true,
        autoRotate: false,
        rotateSpeed: 0.5,
        cameraPosition: 'isometric',
        showTooltips: true,
        pipeColor: '#888888'
      },
      defaults: {
        pipeDiameter: 25,
        wallThickness: 2,
        material: 'steel',
        bendRadius: 50,
        unit: 'mm'
      },
      limits: {
        minAngle: 1,
        maxAngle: 180,
        minRadius: 10,
        maxRadius: 500,
        minLength: 10,
        maxLength: 5000,
        minDiameter: 6,
        maxDiameter: 200
      },
      materials: [
        { id: 'steel', name: 'Teräs', color: '#71797E', density: 7850 },
        { id: 'stainless', name: 'Ruostumaton', color: '#C0C0C0', density: 8000 },
        { id: 'aluminum', name: 'Alumiini', color: '#A8A9AD', density: 2700 },
        { id: 'copper', name: 'Kupari', color: '#B87333', density: 8960 }
      ],
      customFields: []
    },
    allowedModifications: [
      'features.*',
      'ui.*',
      'defaults.*',
      'limits.*',
      'materials',
      'customFields'
    ]
  }
};

// System prompt AI:lle
const getSystemPrompt = (moduleId, currentConfig) => `
Olet FabOS-alustan kehitysassistentti. TEET muutoksia suoraan
${MODULE_CONFIGS[moduleId]?.name || moduleId}-moduuliin.

NYKYINEN KONFIGURAATIO:
\`\`\`json
${JSON.stringify(currentConfig, null, 2)}
\`\`\`

TÄRKEÄÄ - TOIMI NÄIN:
1. ÄLÄ kysy kysymyksiä - TEE muutos suoraan!
2. Kun käyttäjä pyytää jotain, toteuta se HETI
3. Käytä järkevät oletusarvot jos käyttäjä ei anna tarkkoja arvoja
4. Vastaa AINA type="final" ja anna koko uusi konfiguraatio
5. Kerro lyhyesti mitä teit

MUOKATTAVISSA OLEVAT ASIAT:
- features: Toiminnallisuudet (on/off kytkimet, numeeriset arvot)
- ui: Käyttöliittymäasetukset (teema, grid, automaattikierto, pipeColor = putken väri hex-muodossa esim. "#FF0000" punainen)
- defaults: Oletusarvot (materiaalit, mitat jne.)
- limits: Raja-arvot (min/max kulmat, säteet, pituudet)
- materials: Materiaalilista (voi lisätä/poistaa)
- customFields: Käyttäjän omat kentät

ET VOI MUOKATA:
- Perusarkkitehtuuria tai koodirakenteita
- Turvallisuusasetuksia
- Tietokantayhteyksiä

VASTAUSMUOTO (JSON) - KÄYTÄ AINA type="final":
{
  "type": "final",
  "message": "Lyhyt kuvaus tehdyistä muutoksista (suomeksi)",
  "proposedChanges": {
    "summary": "Lyhyt yhteenveto muutoksista",
    "changes": [
      {"path": "features.xxx", "oldValue": ..., "newValue": ..., "reason": "..."}
    ],
    "newConfig": { KOKO PÄIVITETTY KONFIGURAATIO }
  },
  "versionName": "Kuvaava nimi versiolle",
  "versionDescription": "Pidempi kuvaus muutoksista"
}

ESIMERKKI:
Käyttäjä: "Lisää DXF-vienti"
Assistentti: {
  "type": "final",
  "message": "DXF-vienti on nyt aktivoitu! Voit viedä malleja CAD-ohjelmiin.",
  "proposedChanges": {
    "summary": "DXF-vienti aktivoitu",
    "changes": [
      {"path": "features.exportDXF", "oldValue": false, "newValue": true, "reason": "Aktivoidaan DXF-vienti"}
    ],
    "newConfig": { ... koko päivitetty config ... }
  },
  "versionName": "DXF-vienti",
  "versionDescription": "Lisätty DXF-vientitoiminto mallien viemiseen CAD-ohjelmiin."
}

Käyttäjä: "Nosta maksimitaivutukset 20:een"
Assistentti: {
  "type": "final",
  "message": "Maksimitaivutusten määrä nostettu 20:een!",
  "proposedChanges": {
    "summary": "Maksimitaivutukset 10 → 20",
    "changes": [
      {"path": "features.maxBends", "oldValue": 10, "newValue": 20, "reason": "Käyttäjän pyyntö"}
    ],
    "newConfig": { ... }
  },
  "versionName": "20 taivutusta",
  "versionDescription": "Nostettu maksimitaivutusten määrä 20:een monimutkaisempia malleja varten."
}

Käyttäjä: "Muuta putki punaiseksi"
Assistentti: {
  "type": "final",
  "message": "Putken väri muutettu punaiseksi!",
  "proposedChanges": {
    "summary": "Putken väri → punainen",
    "changes": [
      {"path": "ui.pipeColor", "oldValue": "#888888", "newValue": "#FF0000", "reason": "Vaihdetaan väri punaiseksi"}
    ],
    "newConfig": { ... }
  },
  "versionName": "Punainen putki",
  "versionDescription": "Muutettu 3D-mallin putken väri punaiseksi paremman näkyvyyden vuoksi."
}
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
    const { moduleId, currentConfig, conversation, newMessage } = req.body;

    if (!moduleId || !newMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Käytä annettua configia tai moduulin peruskonfigia
    const config = currentConfig || MODULE_CONFIGS[moduleId]?.baseConfig || {};

    // Rakenna keskusteluhistoria
    const messages = [
      ...(conversation || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: newMessage }
    ];

    // Kutsu Claude API:a
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: getSystemPrompt(moduleId, config),
      messages
    });

    // Parsii vastaus
    const content = response.content[0].text;

    let result;
    try {
      // Yritä parsia JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Jos ei JSON, palauta tekstinä
        result = {
          type: 'message',
          message: content
        };
      }
    } catch (parseError) {
      // Jos JSON-parsinta epäonnistuu
      result = {
        type: 'message',
        message: content
      };
    }

    // Lisää metatietoja
    result.usage = {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('AI Assistant error:', error);

    if (error.status === 401) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    return res.status(500).json({
      error: 'AI request failed',
      message: error.message
    });
  }
}
