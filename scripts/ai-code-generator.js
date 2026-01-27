// ============================================================================
// AI CODE GENERATOR
// ============================================================================
// Generoi oikeaa React-koodia käyttäjän pyyntöjen perusteella
// Käytetään GitHub Actions workflowssa

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Moduulien tiedostopolut
const MODULE_FILES = {
  'pipe-bending': {
    main: 'src/PipeBendingApp.jsx',
    related: [
      'src/components/AIChat.jsx',
      'src/lib/supabase.js'
    ]
  },
  'grating': {
    main: 'src/GratingConfigurator.jsx',
    related: []
  },
  'stair': {
    main: 'src/StairConfigurator.jsx',
    related: []
  }
};

// Lue tiedosto turvallisesti
async function readFile(filePath) {
  try {
    const fullPath = path.join(ROOT_DIR, filePath);
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Could not read file: ${filePath}`, error.message);
    return null;
  }
}

// Kirjoita tiedosto turvallisesti
async function writeFile(filePath, content) {
  try {
    const fullPath = path.join(ROOT_DIR, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Could not write file: ${filePath}`, error.message);
    return false;
  }
}

// Rakenna konteksti AI:lle
async function buildContext(moduleId) {
  const moduleConfig = MODULE_FILES[moduleId];
  if (!moduleConfig) {
    throw new Error(`Unknown module: ${moduleId}`);
  }

  const files = {};

  // Lue päämoduuli
  const mainContent = await readFile(moduleConfig.main);
  if (mainContent) {
    files[moduleConfig.main] = mainContent;
  }

  // Lue liittyvät tiedostot
  for (const relatedFile of moduleConfig.related) {
    const content = await readFile(relatedFile);
    if (content) {
      files[relatedFile] = content;
    }
  }

  return files;
}

// System prompt koodin generointiin
const getCodeGenSystemPrompt = (moduleId, files) => `
Olet asiantunteva React-kehittäjä FabOS-projektissa. Tehtäväsi on generoida
koodimuutoksia käyttäjän pyyntöjen perusteella.

PROJEKTIN KONTEKSTI:
- React 18 + Vite
- Tailwind CSS tyylittelyyn
- Three.js 3D-visualisointiin (PipeBendingApp)
- Supabase backendiin
- Vercel deploymenttiin

NYKYINEN KOODI:
${Object.entries(files).map(([path, content]) => `
=== ${path} ===
\`\`\`jsx
${content}
\`\`\`
`).join('\n')}

OHJEET KOODIMUUTOKSILLE:
1. Tee VAIN pyydetyt muutokset - älä refaktoroi muuta koodia
2. Säilytä olemassa oleva tyyli ja konventiot
3. Varmista että koodi on syntaksiltaan oikeaa
4. Testaa logiikka mielessäsi ennen muutosten tekemistä
5. Lisää tarvittavat importit
6. Säilytä kommentit ja dokumentaatio

VASTAUSMUOTO (JSON):
{
  "analysis": "Analyysi pyynnöstä ja tarvittavista muutoksista",
  "changes": [
    {
      "file": "src/PipeBendingApp.jsx",
      "description": "Mitä muutetaan",
      "fullContent": "KOKO tiedoston sisältö muutosten jälkeen"
    }
  ],
  "summary": "Lyhyt yhteenveto tehdyistä muutoksista"
}

TÄRKEÄÄ:
- "fullContent" sisältää KOKO tiedoston, ei vain muutettua osaa
- Älä käytä placeholder-tekstejä kuten "// ... rest of code"
- Palauta aina koko tiedoston sisältö
`;

// Pääfunktio
async function main() {
  const versionId = process.env.VERSION_ID;
  const moduleId = process.env.MODULE_ID;
  const userRequest = process.env.USER_REQUEST;
  const proposedChanges = process.env.PROPOSED_CHANGES;
  const userEmail = process.env.USER_EMAIL;

  console.log('=== AI Code Generator ===');
  console.log('Version ID:', versionId);
  console.log('Module ID:', moduleId);
  console.log('User Request:', userRequest);

  if (!moduleId || !userRequest) {
    console.error('Missing required environment variables');
    setOutput('changes_made', 'false');
    process.exit(1);
  }

  try {
    // 1. Lue moduulin tiedostot
    console.log('\n1. Reading module files...');
    const files = await buildContext(moduleId);
    console.log(`   Found ${Object.keys(files).length} files`);

    // 2. Generoi koodi Claude:lla
    console.log('\n2. Generating code with Claude...');

    const prompt = `
KÄYTTÄJÄN PYYNTÖ:
${userRequest}

${proposedChanges ? `EHDOTETUT MUUTOKSET (JSON-konfiguraatio):
${proposedChanges}` : ''}

Tee tarvittavat koodimuutokset toteuttaaksesi käyttäjän pyynnön.
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 64000,
      system: getCodeGenSystemPrompt(moduleId, files),
      messages: [{ role: 'user', content: prompt }]
    });

    // 3. Parsii vastaus
    console.log('\n3. Parsing response...');
    console.log(`   Stop reason: ${response.stop_reason}`);
    console.log(`   Output tokens: ${response.usage.output_tokens}`);

    if (response.stop_reason === 'max_tokens') {
      console.error('ERROR: Response was truncated (hit max_tokens limit)');
      console.error('The source file may be too large for single-pass generation.');
      setOutput('changes_made', 'false');
      process.exit(1);
    }

    const content = response.content[0].text;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      console.log('Raw response:', content.substring(0, 1000));
      setOutput('changes_made', 'false');
      process.exit(1);
    }

    // 4. Kirjoita muutokset
    console.log('\n4. Writing changes...');
    console.log('   Analysis:', result.analysis);

    let changesWritten = 0;
    const changeSummary = [];

    for (const change of result.changes || []) {
      console.log(`   Writing: ${change.file}`);
      console.log(`   Description: ${change.description}`);

      if (change.fullContent && change.file) {
        const success = await writeFile(change.file, change.fullContent);
        if (success) {
          changesWritten++;
          changeSummary.push(`- ${change.file}: ${change.description}`);
        }
      }
    }

    console.log(`\n5. Summary: ${changesWritten} files modified`);
    console.log(result.summary);

    // 6. Set outputs
    setOutput('changes_made', changesWritten > 0 ? 'true' : 'false');
    setOutput('change_summary', changeSummary.join('\n'));

    console.log('\n=== Done ===');

  } catch (error) {
    console.error('Error:', error);
    setOutput('changes_made', 'false');
    process.exit(1);
  }
}

// GitHub Actions output helper
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFile(outputFile, `${name}=${value}\n`).catch(console.error);
  }
  console.log(`Output: ${name}=${value}`);
}

main();
