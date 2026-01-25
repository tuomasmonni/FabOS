-- ============================================================================
-- FABOS AUTH SYSTEM - DATABASE SCHEMA EXTENSION
-- ============================================================================
-- Lisätään user_profiles, developer_stats, user_drafts, orders, badges
-- Suorita tämä Supabase SQL Editorissa

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
-- ROW LEVEL SECURITY
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
-- TRIGGERS - Automaattiset päivitykset
-- ============================================================================

-- Päivitä user_profiles.updated_at automaattisesti
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_updated
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_profile_updated_at();

-- Luo developer_stats automaattisesti kun profiili luodaan
CREATE OR REPLACE FUNCTION create_developer_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO developer_stats (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_dev_stats
AFTER INSERT ON user_profiles
FOR EACH ROW EXECUTE FUNCTION create_developer_stats();

-- ============================================================================
-- FUNCTIONS - Hyödylliset funktiot
-- ============================================================================

-- Tarkista nimimerkin saatavuus
CREATE OR REPLACE FUNCTION is_nickname_available(check_nickname TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM user_profiles WHERE LOWER(nickname) = LOWER(check_nickname)
    );
END;
$$ LANGUAGE plpgsql;

-- Hae käyttäjän tilastot
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS TABLE (
    versions_created INTEGER,
    versions_promoted INTEGER,
    total_upvotes INTEGER,
    total_downvotes INTEGER,
    reputation INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ds.total_versions_created,
        ds.total_versions_promoted,
        ds.total_upvotes_received,
        ds.total_downvotes_received,
        ds.reputation_score
    FROM developer_stats ds
    WHERE ds.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Päivitä käyttäjän tilastot (kutsu manuaalisesti tai cron-jobilla)
CREATE OR REPLACE FUNCTION recalculate_user_stats(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_versions_created INTEGER;
    v_versions_promoted INTEGER;
    v_upvotes INTEGER;
    v_downvotes INTEGER;
    v_forks INTEGER;
    v_reputation INTEGER;
BEGIN
    -- Laske versiot
    SELECT COUNT(*) INTO v_versions_created
    FROM versions WHERE author_id = target_user_id;

    SELECT COUNT(*) INTO v_versions_promoted
    FROM versions WHERE author_id = target_user_id AND version_type = 'stable';

    -- Laske äänet
    SELECT COALESCE(SUM(votes_up), 0), COALESCE(SUM(votes_down), 0)
    INTO v_upvotes, v_downvotes
    FROM versions WHERE author_id = target_user_id;

    -- Laske forkit
    SELECT COUNT(*) INTO v_forks
    FROM versions v1
    WHERE v1.parent_version_id IN (
        SELECT id FROM versions WHERE author_id = target_user_id
    );

    -- Laske maine: upvotes * 10 + promoted * 50 + forks * 5 - downvotes * 2
    v_reputation := (v_upvotes * 10) + (v_versions_promoted * 50) + (v_forks * 5) - (v_downvotes * 2);

    -- Päivitä tilastot
    UPDATE developer_stats SET
        total_versions_created = v_versions_created,
        total_versions_promoted = v_versions_promoted,
        total_upvotes_received = v_upvotes,
        total_downvotes_received = v_downvotes,
        total_forks_of_my_versions = v_forks,
        reputation_score = v_reputation,
        last_calculated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA - Badget
-- ============================================================================
INSERT INTO badges (id, name, description, icon, category, points) VALUES
    ('first-version', 'Ensimmäinen versio', 'Loit ensimmäisen version', '🚀', 'milestone', 10),
    ('version-promoted', 'Versio päämalliin', 'Versiosi hyväksyttiin päämalliin', '⭐', 'contributor', 50),
    ('popular-creator', 'Suosittu kehittäjä', 'Versioillasi on yhteensä 100+ upvotea', '🔥', 'reputation', 25),
    ('beta-tester', 'Beta-testaaja', 'Osallistuit beta-testaukseen', '🧪', 'special', 15),
    ('early-adopter', 'Varhainen käyttäjä', 'Liityit palveluun ensimmäisten joukossa', '🌟', 'special', 20),
    ('prolific-dev', 'Tuottelias kehittäjä', 'Loit 10+ versiota', '💻', 'milestone', 30),
    ('community-hero', 'Yhteisön sankari', 'Sait 500+ upvotea', '🏆', 'reputation', 100)
ON CONFLICT (id) DO NOTHING;
