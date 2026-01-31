# FabOS - Claude Code Development Guide

## Yleiskatsaus

**FabOS** (Fab Operating System) on suomenkielinen teollisuuden suunnittelualusta, joka sisältää:
- Laserleikkaus-moduuli (levytyöt)
- Putkentaivutus-moduuli (3D-visualisointi)
- Ritilä-konfiguraattori
- Porras-konfiguraattori
- AI-avusteinen kehitystila

**Teema:** FabOS (oranssi/valkoinen, `#FF6B35` pääväri)

---

## Tech Stack

| Kategoria | Teknologia |
|-----------|------------|
| Frontend | React 18.2, Vite 5.1 |
| Tyylitys | TailwindCSS 3.4 |
| 3D | Three.js, @react-three/fiber |
| Backend | Vercel Serverless Functions |
| Tietokanta | Supabase (PostgreSQL) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Autentikointi | Supabase Auth |
| Deployment | Vercel |

---

## Projektin rakenne

```
FabOS/
├── api/                          # Vercel serverless funktiot
│   ├── ai-assistant.js          # AI-kehittäjä API
│   ├── laser-ai.js              # Laserleikkaus AI
│   └── trigger-code-generation.js
│
├── src/
│   ├── App.jsx                  # Pääreititys & auth
│   ├── AppV01.jsx               # Laserleikkaus-moduuli
│   ├── PipeBendingApp.jsx       # Putkentaivutus-moduuli
│   ├── components/
│   │   ├── AIChat.jsx           # AI-keskustelu UI
│   │   ├── DevelopmentMode.jsx  # Kehitystila
│   │   └── auth/                # Autentikointi-komponentit
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Käyttäjähallinta
│   │   └── ThemeContext.jsx     # Teema (FabOS/Legacy)
│   └── lib/
│       └── supabase.js          # Supabase client
│
├── supabase/
│   ├── schema.sql               # Tietokantaskeema
│   └── migrations/              # Migraatiot
│
└── .github/workflows/           # CI/CD
```

---

## Kehitysympäristön käynnistys

### 1. Riippuvuudet
```bash
npm install
```

### 2. Ympäristömuuttujat
Luo `.env` tiedosto (kopioi avaimet Supabase Dashboardista):
```env
# Supabase
VITE_SUPABASE_URL=https://oggswmbgzhuwziceynej.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx  # Supabase → Settings → API

# Anthropic API (pakollinen AI-toiminnoille)
ANTHROPIC_API_KEY=sk-ant-xxx  # console.anthropic.com → API Keys

# GitHub (koodigenerointiin)
GITHUB_PAT=ghp_xxx  # github.com/settings/tokens
GITHUB_REPO=tuomasmonni/FabOS

# Supabase admin (serverless funktioille)
SUPABASE_SERVICE_KEY=sb_secret_xxx  # Supabase → Settings → API
```

### 3. Käynnistys
```bash
# Kehityspalvelin
npm run dev

# Tai täysi ympäristö (backend + frontend)
npm run dev:full
```

Sovellus käynnistyy osoitteessa `http://localhost:3000`

---

## Claude Code - Täysi kontrolli

### Git-workflow

**Branch-strategia:**
- `main` = tuotanto (Vercel deployaa automaattisesti)
- `claude/*` = Claude Coden kehitysbranchit

**Commitit:**
```bash
# Tee muutokset
git add .
git commit -m "feat(module): description"

# Push omaan branchiin
git push -u origin claude/feature-name

# Luo PR GitHubissa tai:
gh pr create --title "Title" --body "Description"
```

### Tiedostojen muokkaus

**TÄRKEÄÄ - Lue CLAUDE.md:**
- Kaikki kehitys tapahtuu FabOS-teemalle
- ÄLÄ muokkaa Legacy-teemaa
- Käytä `isFabOS` conditional styling

**Päävärit (FabOS):**
```
Primary: #FF6B35 (oranssi)
Background: #F7F7F7, white
Header: #1A1A2E (tumma sininen)
Text: gray-800, gray-600
```

### Moduulien muokkaus

**Laserleikkaus:** `src/AppV01.jsx`
- Piirtotyökalut, osaluettelo, AI-chat
- Tarkista `isFabOS` ehdot

**Putkentaivutus:** `src/PipeBendingApp.jsx`
- 3D-esikatselu (Three.js)
- Kehitystila ja versiohallinta

**Komponentit:** `src/components/`
- Uudelleenkäytettävät UI-komponentit
- AIChat.jsx, DevelopmentMode.jsx jne.

### API-muutokset

**Serverless funktiot:** `api/`
```javascript
// Esimerkki: api/my-endpoint.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Logiikka tähän
  return res.status(200).json({ success: true });
}
```

### Tietokantamuutokset

**Uusi migraatio:**
```bash
# Luo tiedosto
touch supabase/migrations/007_new_feature.sql
```

**Esimerkki:**
```sql
-- supabase/migrations/007_new_feature.sql
ALTER TABLE versions ADD COLUMN new_field TEXT;
```

**Huom:** Migraatiot ajetaan Supabase Dashboardissa tai CLI:llä.

---

## Testaus

### Lokaali testaus
```bash
npm run dev
```
Avaa http://localhost:3000

### Vercel Preview
- Jokainen PR saa oman preview-URL:n
- Muoto: `fabos-xxx-tuomasmonni.vercel.app`

### Tuotanto
- Push/merge `main`-branchiin
- Vercel deployaa automaattisesti

---

## Tärkeät tiedostot

| Tiedosto | Tarkoitus |
|----------|-----------|
| `CLAUDE.md` | Kehitysohjeet (lue ensin!) |
| `package.json` | Riippuvuudet ja skriptit |
| `vite.config.js` | Build-konfiguraatio |
| `vercel.json` | Deployment-asetukset |
| `tailwind.config.js` | CSS-konfiguraatio |

---

## Komentojen pikaopas

```bash
# Kehitys
npm run dev              # Käynnistä kehityspalvelin
npm run build            # Rakenna tuotantoversio
npm run preview          # Esikatsele build

# Git
git status               # Tarkista muutokset
git add .                # Lisää muutokset
git commit -m "msg"      # Commitoi
git push                 # Pushaa

# PR:n luonti
gh pr create --title "Title" --body "Body"
```

---

## Supabase-taulut

| Taulu | Käyttö |
|-------|--------|
| `modules` | Moduulien metadata |
| `versions` | Käyttäjien luomat versiot |
| `votes` | Äänestykset |
| `user_profiles` | Käyttäjäprofiilit |
| `conversations` | AI-keskustelut |
| `messages` | Keskustelujen viestit |
| `feedback` | Palautteet |

---

## Käyttäjäroolit

```
GUEST (0) → USER (1) → BETA_TESTER (2) → DEVELOPER (3) →
STAFF (4) → MODERATOR (5) → ADMIN (6) → OWNER (7) → SUPER_ADMIN (8)
```

Roolien tarkistus: `AuthContext.jsx` → `hasMinRole()`, `isAdmin()` jne.

---

## AI-integraatio

### API-kutsut
- `api/ai-assistant.js` - Kehitystilan AI
- `api/laser-ai.js` - Laserleikkauksen AI

### Malli
- `claude-sonnet-4-20250514`
- Max tokens: 2048-4096

### System prompt
Löytyy tiedostosta `api/ai-assistant.js` → `getSystemPrompt()`

---

## Puuttuvat tiedot (täydennettävä)

### Ympäristömuuttujat:
- [x] `VITE_SUPABASE_URL` - `https://oggswmbgzhuwziceynej.supabase.co`
- [x] `VITE_SUPABASE_ANON_KEY` - Löytyy Supabase Dashboard → Settings → API
- [x] `SUPABASE_SERVICE_KEY` - Löytyy Supabase Dashboard → Settings → API
- [ ] `ANTHROPIC_API_KEY` - Haettava: https://console.anthropic.com/ → API Keys
- [ ] `GITHUB_PAT` - Haettava: https://github.com/settings/tokens
- [ ] `RESEND_API_KEY` - Sähköposti-ilmoituksiin (valinnainen)

### Vercel-projekti:
- [x] Tuotanto-URL: `https://levykauppa.vercel.app`
- [x] Preview-URL: `levykauppa-hcfbvxr1k-tuomas-projects-8799e491.vercel.app`

### Supabase-projekti:
- [x] Supabase URL: `https://oggswmbgzhuwziceynej.supabase.co`
- [x] Dashboard: https://supabase.com/dashboard/project/oggswmbgzhuwziceynej

### GitHub:
- [x] Repository: `tuomasmonni/FabOS`
- [ ] Branch protection säännöt?
- [ ] Required reviewers?

### Muut:
- [ ] Onko staging-ympäristöä?
- [ ] Monitoring/logging (Sentry tms.)?
- [ ] Testaus-framework käytössä?

---

## Yhteenveto

Claude Code voi:
1. **Lukea** kaikki tiedostot
2. **Muokata** koodia (Edit, Write)
3. **Ajaa** komentoja (Bash)
4. **Commitoida** ja pushata (Git)
5. **Luoda PR:iä** (gh CLI)

**Rajoitukset:**
- Ei pääsyä selaimeen
- Ei pääsyä Supabase Dashboardiin
- Ei pääsyä Vercel Dashboardiin
- Tarvitsee env-muuttujat toimiakseen täysin

**Workflow:**
1. Lue CLAUDE.md
2. Tee muutokset branchiin
3. Testaa lokaalisti (käyttäjä)
4. Luo PR
5. Käyttäjä mergeaa GitHubissa
6. Vercel deployaa automaattisesti
