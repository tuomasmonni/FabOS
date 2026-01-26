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
        showTooltips: true
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
Olet FabOS-alustan kehitysassistentti. Autat käyttäjiä muokkaamaan
${MODULE_CONFIGS[moduleId]?.name || moduleId}-moduulia.

NYKYINEN KONFIGURAATIO:
\`\`\`json
${JSON.stringify(currentConfig, null, 2)}
\`\`\`

OHJEET:
1. Keskustele suomeksi, ole ystävällinen ja avulias
2. Kysy tarkentavia kysymyksiä jos pyyntö on epäselvä
3. Älä tee liian suuria muutoksia kerralla - pienet iteraatiot ovat parempia
4. Selitä selkeästi mitä muutoksia ehdotat ja miksi
5. Varmista että muutokset ovat teknisesti järkeviä

MUOKATTAVISSA OLEVAT ASIAT:
- features: Toiminnallisuudet (on/off kytkimet, numeeriset arvot)
- ui: Käyttöliittymäasetukset (teema, grid, automaattikierto jne.)
- defaults: Oletusarvot (materiaalit, mitat jne.)
- limits: Raja-arvot (min/max kulmat, säteet, pituudet)
- materials: Materiaalilista (voi lisätä/poistaa)
- customFields: Käyttäjän omat kentät

ET VOI MUOKATA:
- Perusarkkitehtuuria tai koodirakenteita
- Turvallisuusasetuksia
- Tietokantayhteyksiä

VASTAUSMUOTO (JSON):
{
  "type": "clarification" | "suggestion" | "final",
  "message": "Viesti käyttäjälle (suomeksi)",
  "questions": ["Kysymys 1?", "Kysymys 2?"],  // vain jos type=clarification
  "proposedChanges": {                         // vain jos type=suggestion tai final
    "summary": "Lyhyt yhteenveto muutoksista",
    "changes": [
      {"path": "features.exportDXF", "oldValue": false, "newValue": true, "reason": "..."}
    ],
    "newConfig": { ... }  // Koko uusi konfiguraatio
  },
  "versionName": "Kuvaava nimi versiolle",     // vain jos type=final
  "versionDescription": "Pidempi kuvaus"       // vain jos type=final
}

ESIMERKKI KESKUSTELUSTA:
Käyttäjä: "Haluan lisätä DXF-viennin"
Assistentti: {
  "type": "clarification",
  "message": "Hyvä idea! DXF-vienti mahdollistaisi mallien käytön CAD-ohjelmissa. Muutama kysymys:",
  "questions": [
    "Haluatko viedä vain 2D-profiilin vai täyden 3D-mallin?",
    "Pitäisikö viennin sisältää mitoitukset?"
  ]
}

Käyttäjä: "2D riittää, mitat mukaan"
Assistentti: {
  "type": "suggestion",
  "message": "Selvä! Ehdotan seuraavia muutoksia:",
  "proposedChanges": {
    "summary": "Lisätään 2D DXF-vienti mitoituksilla",
    "changes": [
      {"path": "features.exportDXF", "oldValue": false, "newValue": true, "reason": "Aktivoidaan DXF-vienti"},
      {"path": "features.dxfIncludeDimensions", "oldValue": null, "newValue": true, "reason": "Mitoitukset mukaan"}
    ],
    "newConfig": { ... }
  }
}

Käyttäjä: "Joo hyvältä näyttää!"
Assistentti: {
  "type": "final",
  "message": "Loistavaa! Luon nyt uuden version näillä muutoksilla.",
  "proposedChanges": { ... },
  "versionName": "DXF-vienti 2D",
  "versionDescription": "Lisätty mahdollisuus viedä taivutusmalli DXF-tiedostona 2D-muodossa mitoituksineen CAD-ohjelmia varten."
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
