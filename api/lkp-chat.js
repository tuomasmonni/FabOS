// ============================================================================
// FABOS CHAT API - Vercel Serverless Function
// ============================================================================
// POST /api/lkp-chat
// Tukichatbot FabOS-alustalle ja MasterMind-sovellukselle

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// FabOS/MasterMind -tietopohja system promptissa
const SYSTEM_PROMPT = `Olet FabOS-alustan ystävällinen tukiassistentti. Autat käyttäjiä FabOS-moduulien ja MasterMind-sovelluksen käytössä. Vastaat suomeksi.

## FABOS-ALUSTA

**FabOS** on teollisuuden suunnittelualusta joka sisältää:

### Moduulit

1. **Putkentaivutus (v03)**
   - 3D-visualisointi taivutetuista putkista
   - Tuki useille taivutuksille (max 10-20 kpl)
   - Materiaalit: teräs, ruostumaton, alumiini, kupari
   - Parametrit: kulma, säde, pituus, halkaisija
   - DXF-vienti CAD-ohjelmiin

2. **Portaat-konfiguraattori (v06)**
   - Kierreportaat ja suorat portaat
   - Mittatilaus asiakkaan tarpeiden mukaan
   - Automaattinen hinnoittelu

3. **Ritilä-konfiguraattori (v04)**
   - Ritilöiden mitoitus ja valinta
   - Kuormitusluokat ja materiaalit

4. **Ominaisuusehdotukset (v07)**
   - Käyttäjät voivat ehdottaa uusia ominaisuuksia
   - Äänestys ja priorisointi

### Käyttöliittymä
- Teema: Tumma sininen (#1A1A2E) + oranssi (#FF6B35)
- Responsiivinen (toimii mobiilissa)
- Kirjautuminen vaaditaan

---

## MASTERMIND-SOVELLUS

**MasterMind** on Monday.com board-kloonaussovellus joka:

### Ominaisuudet
- Kopioi boardin rakenteen (sarakkeet, ryhmät, näkymät)
- Kopioi itemit ja subitemit datoineen
- Säilyttää ja päivittää relaatiot (Connect Boards, Mirror, Dependency)
- Päivittää Formula-kaavat uusilla sarake-ID:illä
- Hallinnoi ID-mappauksen (vanha → uusi)

### Tuetut saraketyypit
**Perussarakkeet:** text, long_text, numbers, date, status, dropdown, people, timeline, email, phone, link, file, auto_number, creation_log, last_updated

**Edistyneet:**
- **Connect Boards** - linkitys toisiin boardeihin
- **Mirror** - datan peilaus linkitetyistä boardeista
- **Formula** - laskentakaavat
- **Progress** - edistymispalkki
- **Dependency** - riippuvuudet

### Kloonausjärjestys (tärkeä!)
1. Luo kohde-boardit ensin
2. Luo perussarakkeet
3. Luo Connect Boards (päivitä boardIds)
4. Luo Mirror (päivitä relation_column)
5. Luo Formula (päivitä {column_id} viittaukset)

### Rajoitukset
- Status labels: max 40/sarake
- Dropdown labels: max 1000/sarake
- Connect Boards: max 60 saraketta/board
- Items per page: max 500 (pagination)

---

## KÄYTTÄYTYMISOHJEESI

1. Ole ystävällinen ja avulias
2. Vastaa aina suomeksi
3. Anna konkreettisia ohjeita ja esimerkkejä
4. Jos et tiedä tarkkaa vastausta, kerro mitä tiedät ja ehdota mistä löytyy lisätietoa
5. Pidä vastaukset ytimekkäinä mutta informatiivisina
6. Käytä teknistä kieltä kun se on tarpeen, mutta selitä termit

## USEIN KYSYTYT KYSYMYKSET

**Miten kirjaudun sisään?**
Käytä sähköpostiosoitettasi ja salasanaasi. Uudet käyttäjät voivat luoda tilin rekisteröitymissivulta.

**Miten kloonaan boardin MasterMindilla?**
1. Valitse lähde-board
2. Nimeä kohde-board
3. Valitse kopioitavat elementit (sarakkeet, itemit, näkymät)
4. Klikkaa "Kloonaa"
5. Odota prosessin valmistumista

**Miksi Mirror-sarake näyttää tyhjää?**
Mirror-sarakkeen .text palauttaa null. Käytä sen sijaan .display_value kenttää datan lukemiseen.

**Miten muutan putkentaivutuksen väriä?**
Kehitystilassa voit pyytää AI-assistenttia muuttamaan putken värin. Esim. "Muuta putki punaiseksi" muuttaa ui.pipeColor arvon.

**Tarvitseeko FabOS maksullisen tilin?**
FabOS on tällä hetkellä ilmainen rekisteröityneille käyttäjille.`;

// Fallback-vastaus jos API-virhe
const FALLBACK_RESPONSE = `Pahoittelut, en pysty vastaamaan juuri nyt teknisen ongelman vuoksi.

Kokeile hetken kuluttua uudelleen tai tarkista FabOS-dokumentaatio.

Yleisimmät ongelmat:
- Kirjautumisongelmat: Varmista että käytät oikeaa sähköpostia
- Kloonaus epäonnistuu: Tarkista Monday.com API-avain
- Moduuli ei lataudu: Päivitä sivu (F5)`;

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
    const { messages, newMessage } = req.body;

    if (!newMessage) {
      return res.status(400).json({ error: 'Missing newMessage field' });
    }

    // Rakenna keskusteluhistoria (viimeiset 10 viestiä)
    const conversationHistory = (messages || [])
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Lisää uusi viesti
    conversationHistory.push({ role: 'user', content: newMessage });

    // Kutsu Claude API:a
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: conversationHistory
    });

    const assistantMessage = response.content[0].text;

    return res.status(200).json({
      message: assistantMessage,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('LKP Chat error:', error);

    // Palauta ystävällinen fallback-viesti
    return res.status(200).json({
      message: FALLBACK_RESPONSE,
      error: true
    });
  }
}
