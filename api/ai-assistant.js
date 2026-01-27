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
  "requiresCodeGeneration": false,
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

KRIITTINEN PÄÄTÖS - requiresCodeGeneration:
Tämä kenttä määrää generoiko järjestelmä oikeaa React-koodia vai pelkästään tallentaa config-muutokset.

requiresCodeGeneration: false VAIN KUN:
- Muutetaan olemassolevan config-arvon arvoa (väri, numero, boolean, teksti)
- Lisätään/poistetaan materiaali listalta
- Muutetaan raja-arvoja tai oletusarvoja
- Kytketään olemassaoleva feature päälle/pois (JOS koodi on jo valmiina)

requiresCodeGeneration: true AINA KUN:
- Pyydetään uutta painiketta, nappia tai UI-elementtiä
- Pyydetään uutta toimintoa (vienti, tuonti, laskenta, animaatio)
- Pyydetään uutta näkymää, välilehteä tai paneelia
- Pyydetään uutta interaktiota (drag & drop, gesture)
- Muutos vaatii uutta koodia jota ei ole vielä toteutettu
- Epävarmoissa tilanteissa → true (turvallisempi valinta)

TÄRKEÄ SÄÄNTÖ: Pelkkä features.xxx = true EI riitä jos oikeaa koodia ei ole!
Esim. "Lisää CSV-vienti" → true, koska CSV-vientilogiikkaa ja painiketta ei ole koodissa.
Esim. "Lisää DXF-vienti" → true, koska DXF-vientilogiikkaa ja painiketta ei ole koodissa.

LIIAN ISOT MUUTOKSET - KIELTÄYDY JA PILKO:
Jos pyyntö vaatisi:
- Useamman kuin 3 uuden funktion tai komponentin luomista
- Kokonaan uuden näkymän tai sivun rakentamista (esim. "tee kokonainen dashboard")
- Useita toisistaan riippumattomia muutoksia samassa pyynnössä (esim. "lisää vienti, tulostus ja jako-toiminto")
- Merkittävää arkkitehtuurimuutosta (esim. "vaihda state management Reduxiin")

→ ÄLÄ tee muutosta. Vastaa sen sijaan type="message" ja:
1. Kerro käyttäjälle että pyyntö on liian laaja toteutettavaksi kerralla
2. Ehdota 2-3 pienempää osapyyntöä joilla sama tulos saavutetaan vaiheittain
3. Anna selkeät esimerkit mitä käyttäjä voi pyytää seuraavaksi

Esimerkki liian isosta pyynnöstä:
Käyttäjä: "Lisää CSV-vienti, DXF-vienti, tulostustoiminto ja jakaminen sähköpostilla"
Vastaus: {
  "type": "message",
  "message": "Tämä pyyntö sisältää 4 erillistä toimintoa. Toteutan ne mieluummin yksi kerrallaan, jotta laatu pysyy korkeana. Aloitetaanko CSV-viennistä? Voit pyytää seuraavat toiminnot erikseen:\n1. \"Lisää CSV-vienti\"\n2. \"Lisää DXF-vienti\"\n3. \"Lisää tulostustoiminto\"\n4. \"Lisää jako sähköpostilla\""
}

Esimerkkejä:
- "Vaihda putki punaiseksi" → false (ui.pipeColor muutos, koodi lukee arvon)
- "Nosta max taivutukset 20:een" → false (features.maxBends, koodi lukee arvon)
- "Lisää uusi materiaali" → false (materials-listan muutos, koodi lukee listan)
- "Lisää CSV/DXF/PDF-vienti" → true (uusi vientilogiikka + painike)
- "Lisää drag & drop" → true (uusi interaktio)
- "Lisää yhteenvetopaneeli" → true (uusi UI-komponentti)
- "Lisää painoarvio" → true (uusi laskentalogiikka)

ESIMERKKI 1 - Config-muutos (requiresCodeGeneration: false):
Käyttäjä: "Muuta putki punaiseksi"
Assistentti: {
  "type": "final",
  "message": "Putken väri muutettu punaiseksi!",
  "requiresCodeGeneration": false,
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

ESIMERKKI 2 - Config-muutos (requiresCodeGeneration: false):
Käyttäjä: "Nosta maksimitaivutukset 20:een"
Assistentti: {
  "type": "final",
  "message": "Maksimitaivutusten määrä nostettu 20:een!",
  "requiresCodeGeneration": false,
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

ESIMERKKI 3 - Koodimuutos (requiresCodeGeneration: true):
Käyttäjä: "Lisää CSV-vienti painike"
Assistentti: {
  "type": "final",
  "message": "CSV-vienti lisätään! Tämä vaatii uuden koodin generointia: vienti-painike ja CSV-muodostuslogiikka.",
  "requiresCodeGeneration": true,
  "proposedChanges": {
    "summary": "CSV-vienti lisätään (vaatii koodigenerointia)",
    "changes": [
      {"path": "features.exportCSV", "oldValue": false, "newValue": true, "reason": "Uusi ominaisuus: CSV-vienti"}
    ],
    "newConfig": { ... }
  },
  "versionName": "CSV-vienti",
  "versionDescription": "Lisätään CSV-vientitoiminto putken tietojen viemiseen taulukkolaskentaohjelmiin. Vaatii uuden painikkeen ja vientilogiikan."
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
