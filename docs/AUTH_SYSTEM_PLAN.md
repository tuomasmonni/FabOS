# FabOS Auth System - Toteutussuunnitelma

## 📊 Projektin nykytila-analyysi

### ✅ Valmiina oleva infrastruktuuri

| Komponentti | Tila | Huomiot |
|-------------|------|---------|
| **Supabase Client** | ✅ Asennettu | `@supabase/supabase-js` v2.91.1 |
| **Tietokanta-schema** | ⚠️ Osittain | versions, modules, votes, conversations, messages, feedback |
| **React Context** | ✅ Valmis | ThemeContext toimii mallina AuthContext:ille |
| **RLS Policies** | ✅ Valmis | Perus-RLS jo konfiguroitu |
| **Demo Mode** | ✅ Valmis | Sovellus toimii ilman Supabase-yhteyttä |
| **Tailwind CSS** | ✅ Valmis | Tyylit valmiina |

### ❌ Puuttuvat komponentit

| Komponentti | Prioriteetti | Työmäärä |
|-------------|--------------|----------|
| user_profiles taulu | Kriittinen | Pieni |
| developer_stats taulu | Korkea | Pieni |
| user_drafts taulu | Keskitaso | Pieni |
| orders taulu | Matala | Pieni |
| badges taulu + user_badges | Matala | Keskitaso |
| AuthContext | Kriittinen | Keskitaso |
| LoginModal | Kriittinen | Keskitaso |
| ProfilePage | Korkea | Suuri |

### ⚠️ Arkkitehtuurimuutokset (Next.js → Vite/React)

Alkuperäinen suunnitelma oletti Next.js:n käyttöä. Tässä tarvittavat mukautukset:

| Next.js konsepti | React/Vite vastaavuus |
|------------------|----------------------|
| `pages/` routing | URL-parametrit (`?version=v03`) |
| Server Actions | Supabase client-side calls |
| API Routes | Vercel Serverless Functions (`/api/`) |
| `next/navigation` | `window.location` / URL params |
| Server Components | Client-side React components |

---

## 🗄️ Tietokantamuutokset

### Uudet taulut (lisätään schema.sql:ään)

```sql
-- ============================================================================
-- USER_PROFILES - Käyttäjäprofiilit
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    company TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_beta_tester BOOLEAN DEFAULT FALSE,

    -- Asetukset
    notification_preferences JSONB DEFAULT '{"email_digest": "weekly", "new_votes": true}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEVELOPER_STATS - Kehittäjätilastot
-- ============================================================================
CREATE TABLE IF NOT EXISTS developer_stats (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Versiotilastot
    total_versions_created INTEGER DEFAULT 0,
    total_versions_promoted INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    total_upvotes_received INTEGER DEFAULT 0,
    total_downvotes_received INTEGER DEFAULT 0,

    -- Fork-tilastot
    total_forks_of_my_versions INTEGER DEFAULT 0,

    -- Laskettu maine (päivitetään triggerillä)
    reputation_score INTEGER DEFAULT 0,

    -- Päivitys
    last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER_DRAFTS - Keskeneräiset työt
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL,

    -- Vanhempi versio (mistä aloitettu)
    parent_version_id UUID REFERENCES versions(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORDERS - Tilaukset (myöhempää käyttöä varten)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),

    -- Tilauksen tiedot
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),

    -- Tuotteet (JSON-array)
    items JSONB NOT NULL,

    -- Hinnoittelu
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,

    -- Osoitteet
    shipping_address JSONB,
    billing_address JSONB,

    -- Aikalemat
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- BADGES - Saavutusmerkit
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    category TEXT CHECK (category IN ('contributor', 'reputation', 'special', 'milestone')),
    points INTEGER DEFAULT 0,

    -- Automaattisen myöntämisen ehdot (JSON)
    auto_grant_conditions JSONB
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, badge_id)
);

-- ============================================================================
-- INDEKSIT
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_user_drafts_user ON user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Profiilit: julkisesti luettavissa, vain oma muokattavissa
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tilastot: julkisesti luettavissa
CREATE POLICY "Stats are viewable by everyone" ON developer_stats FOR SELECT USING (true);

-- Luonnokset: vain omat näkyvissä
CREATE POLICY "Users can view own drafts" ON user_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own drafts" ON user_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON user_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON user_drafts FOR DELETE USING (auth.uid() = user_id);

-- Tilaukset: vain omat näkyvissä
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badget: kaikki näkee
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);
CREATE POLICY "User badges are viewable by everyone" ON user_badges FOR SELECT USING (true);

-- ============================================================================
-- SEED DATA - Badget
-- ============================================================================
INSERT INTO badges (id, name, description, icon, category, points) VALUES
    ('first-version', 'Ensimmäinen versio', 'Loit ensimmäisen version', '🚀', 'milestone', 10),
    ('version-promoted', 'Versio päämalliin', 'Versiosi hyväksyttiin päämalliin', '⭐', 'contributor', 50),
    ('popular-creator', 'Suosittu kehittäjä', 'Versioillasi on yhteensä 100+ upvotea', '🔥', 'reputation', 25),
    ('beta-tester', 'Beta-testaaja', 'Osallistuit beta-testaukseen', '🧪', 'special', 15),
    ('early-adopter', 'Varhainen käyttäjä', 'Liityit palveluun ensimmäisten joukossa', '🌟', 'special', 20)
ON CONFLICT (id) DO NOTHING;
```

---

## 📁 Tiedostorakenne

```
src/
├── contexts/
│   ├── ThemeContext.jsx      # ✅ Olemassa
│   └── AuthContext.jsx       # 🆕 Uusi
├── components/
│   ├── auth/
│   │   ├── LoginModal.jsx    # 🆕 Magic Link kirjautuminen
│   │   ├── ProfileDropdown.jsx # 🆕 Käyttäjävalikko
│   │   └── NicknameSetup.jsx # 🆕 Nimimerkin asetus
│   └── ui/
│       └── Modal.jsx         # 🆕 Yleiskäyttöinen modaali
├── pages/
│   └── ProfilePage.jsx       # 🆕 Profiilisivu
├── lib/
│   ├── supabase.js           # ✅ Olemassa - laajennettava
│   └── auth.js               # 🆕 Auth-funktiot
└── hooks/
    └── useAuth.js            # 🆕 Auth hook
```

---

## 🔐 AuthContext toteutus

```jsx
// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Tarkista nykyinen sessio
    checkSession();

    // Kuuntele auth-muutoksia
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    ) ?? { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  const checkSession = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (userId) => {
    if (!supabase) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setProfile(data);
  };

  const signInWithMagicLink = async (email) => {
    if (!supabase) return { error: { message: 'Demo mode' } };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated: !!user,
      needsNickname: user && !profile?.nickname,
      signInWithMagicLink,
      signOut,
      openLoginModal,
      closeLoginModal,
      showLoginModal,
      refreshProfile: () => user && fetchProfile(user.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 🎯 Toteutusjärjestys

### Vaihe 1: Perusteet (1-2 päivää)
1. ✏️ Lisää tietokanta-schema (`user_profiles`, `developer_stats`)
2. ✏️ Luo `AuthContext.jsx`
3. ✏️ Päivitä `App.jsx` AuthProvider:illa
4. ✏️ Luo `LoginModal.jsx` Magic Link -lomakkeella

### Vaihe 2: Käyttäjäkokemus (1-2 päivää)
5. ✏️ Luo `ProfileDropdown.jsx` header-navigaatioon
6. ✏️ Luo `NicknameSetup.jsx` ensimmäiselle kirjautumiselle
7. ✏️ Päivitä `FabOSVersionSelector.jsx` näyttämään login-nappi

### Vaihe 3: Profiilisivu (2-3 päivää)
8. ✏️ Luo `ProfilePage.jsx` käyttäjätiedoilla
9. ✏️ Lisää versiohistoria profiiliin
10. ✏️ Lisää tilastot ja badget

### Vaihe 4: Versioiden linkitys käyttäjiin (1 päivä)
11. ✏️ Päivitä version-luonti tallentamaan `author_id`
12. ✏️ Lisää "Omat versiot" -näkymä

### Vaihe 5: Lisäominaisuudet (2-3 päivää)
13. ✏️ Luo `user_drafts` toiminnallisuus
14. ✏️ Lisää badge-järjestelmä
15. ✏️ Fork-puu visualisointi

---

## 🔧 Supabase-konfiguraatio

Supabasessa täytyy:

1. **Authentication → Providers**:
   - Enable "Email" (Magic Link)
   - Disable password login (optional)

2. **Authentication → URL Configuration**:
   - Site URL: `https://levykauppa.vercel.app`
   - Redirect URLs: `https://levykauppa.vercel.app`

3. **Authentication → Email Templates**:
   - Muokkaa Magic Link -sähköpostipohja suomeksi

---

## 🎨 UI-komponentit

### LoginModal layout:
```
┌─────────────────────────────────────────┐
│                    ✕                    │
│                                         │
│         🔐 Kirjaudu FabOS:iin          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ sähköposti@example.com          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     Lähetä kirjautumislinkki    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Kirjautumislinkki lähetetään          │
│  sähköpostiisi. Ei salasanaa!          │
│                                         │
└─────────────────────────────────────────┘
```

### ProfileDropdown layout:
```
┌────────────────────────┐
│ 👤 NimimerkKäyttäjä  ▼│
├────────────────────────┤
│ 📊 Profiili            │
│ 📝 Omat versiot        │
│ 💾 Luonnokset          │
│ ────────────────────── │
│ 🚪 Kirjaudu ulos       │
└────────────────────────┘
```

---

## ✅ Yhteenveto

**Onko toteutettavissa?** ✅ Kyllä

Projektin arkkitehtuuri tukee auth-järjestelmän toteutusta hyvin:
- Supabase on jo integroitu
- Context-pattern on jo käytössä (ThemeContext)
- Tietokanta-schema on laajennettavissa
- Demo mode -pattern mahdollistaa kehityksen ilman backendiä

**Kriittiset mukautukset:**
1. Next.js → React/Vite (URL-parametrit routing-mallina)
2. Server Actions → Client-side Supabase calls
3. TypeScript → JavaScript

**Arvioitu kokonaistyömäärä:** 7-10 päivää

**Suositeltu aloituspiste:** Vaihe 1 (AuthContext + LoginModal)
