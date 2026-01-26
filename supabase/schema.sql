-- ============================================================================
-- FABOS AI VERSION PLATFORM - DATABASE SCHEMA
-- ============================================================================
-- Tämä schema luo taulut käyttäjien luomien versioiden hallintaan
-- Aloitetaan PipeBendingApp-moduulilla testilaboratoriona

-- ============================================================================
-- MODULES - Moduulit joita käyttäjät voivat muokata
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    base_config JSONB NOT NULL DEFAULT '{}',
    stable_version_id UUID,  -- Viittaus nykyiseen päämalliin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VERSIONS - Käyttäjien luomat versiot
-- ============================================================================
CREATE TABLE IF NOT EXISTS versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

    -- Versiotiedot
    name TEXT NOT NULL,
    description TEXT,
    version_number TEXT NOT NULL,  -- esim. "0.5.0-alpha-123"

    -- Konfiguraatio (JSON)
    config JSONB NOT NULL,

    -- Koodimuutokset (myöhempää käyttöä varten)
    code_patches JSONB DEFAULT '[]',

    -- Tekijätiedot
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    author_email TEXT,

    -- Tyyppi: stable = päämalli, experimental = testiversio
    version_type TEXT NOT NULL DEFAULT 'experimental' CHECK (version_type IN ('stable', 'experimental', 'archived')),

    -- Vanhempi versio (mistä forkattu)
    parent_version_id UUID REFERENCES versions(id),

    -- Tilastot
    votes_up INTEGER DEFAULT 0,
    votes_down INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    test_count INTEGER DEFAULT 0,  -- Kuinka monta kertaa testattu

    -- Aikalemat
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indeksit hakuja varten
    CONSTRAINT valid_version_number CHECK (version_number ~ '^[0-9]+\.[0-9]+\.[0-9]+.*$')
);

-- ============================================================================
-- VOTES - Äänestykset versioille
-- ============================================================================
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_fingerprint TEXT,  -- Anonyymeille käyttäjille (browser fingerprint)
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Yksi ääni per käyttäjä/fingerprint per versio
    UNIQUE(version_id, user_id),
    UNIQUE(version_id, user_fingerprint)
);

-- ============================================================================
-- CONVERSATIONS - AI-keskustelut
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_fingerprint TEXT,

    -- Keskustelun tila
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),

    -- Luotu versio (jos keskustelu johti uuteen versioon)
    resulting_version_id UUID REFERENCES versions(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MESSAGES - Keskustelujen viestit
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Jos viesti sisältää konfiguraatioehdotuksen
    proposed_config JSONB,

    -- Metatiedot
    tokens_used INTEGER,
    model_used TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FEEDBACK - Palaute versioista
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_fingerprint TEXT,

    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- Kategoriat
    category TEXT CHECK (category IN ('bug', 'improvement', 'feature_request', 'general')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_versions_module ON versions(module_id);
CREATE INDEX IF NOT EXISTS idx_versions_type ON versions(version_type);
CREATE INDEX IF NOT EXISTS idx_versions_votes ON versions(votes_up DESC);
CREATE INDEX IF NOT EXISTS idx_versions_created ON versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_module ON conversations(module_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Kaikki voivat lukea moduulit ja versiot
CREATE POLICY "Modules are viewable by everyone" ON modules FOR SELECT USING (true);
CREATE POLICY "Versions are viewable by everyone" ON versions FOR SELECT USING (true);

-- Kaikki voivat luoda versioita (myös anonyymit)
CREATE POLICY "Anyone can create versions" ON versions FOR INSERT WITH CHECK (true);

-- Vain oma versio päivitettävissä
CREATE POLICY "Users can update own versions" ON versions FOR UPDATE
    USING (author_id = auth.uid() OR author_id IS NULL);

-- Äänestykset
CREATE POLICY "Anyone can vote" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "View own votes" ON votes FOR SELECT USING (true);

-- Keskustelut
CREATE POLICY "Anyone can create conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view conversations" ON conversations FOR SELECT USING (true);

-- Viestit
CREATE POLICY "Anyone can create messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view messages" ON messages FOR SELECT USING (true);

-- Palaute
CREATE POLICY "Anyone can give feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view feedback" ON feedback FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Päivitä äänet automaattisesti
CREATE OR REPLACE FUNCTION update_version_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE versions SET votes_up = votes_up + 1 WHERE id = NEW.version_id;
        ELSE
            UPDATE versions SET votes_down = votes_down + 1 WHERE id = NEW.version_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE versions SET votes_up = votes_up - 1 WHERE id = OLD.version_id;
        ELSE
            UPDATE versions SET votes_down = votes_down - 1 WHERE id = OLD.version_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_votes
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_version_votes();

-- Päivitä updated_at automaattisesti
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_versions_updated
BEFORE UPDATE ON versions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_conversations_updated
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INITIAL DATA - PipeBendingApp moduuli
-- ============================================================================
INSERT INTO modules (id, name, description, icon, base_config) VALUES (
    'pipe-bending',
    'Putkentaivutus',
    'Taivuta putkia 3D-visualisoinnilla. Määritä taivutuskulmat, säteet ja pituudet.',
    '🔧',
    '{
        "version": "1.0.0",
        "features": {
            "3dVisualization": true,
            "angleInput": true,
            "radiusInput": true,
            "lengthInput": true,
            "materialSelection": true,
            "exportDXF": false,
            "multipleBends": true,
            "maxBends": 10
        },
        "ui": {
            "theme": "dark",
            "showGrid": true,
            "showDimensions": true,
            "autoRotate": false
        },
        "defaults": {
            "pipeDiameter": 25,
            "wallThickness": 2,
            "material": "steel",
            "bendRadius": 50,
            "unit": "mm"
        },
        "limits": {
            "minAngle": 1,
            "maxAngle": 180,
            "minRadius": 10,
            "maxRadius": 500,
            "minLength": 10,
            "maxLength": 5000
        },
        "materials": [
            {"id": "steel", "name": "Teräs", "color": "#71797E"},
            {"id": "stainless", "name": "Ruostumaton", "color": "#C0C0C0"},
            {"id": "aluminum", "name": "Alumiini", "color": "#A8A9AD"},
            {"id": "copper", "name": "Kupari", "color": "#B87333"}
        ]
    }'
) ON CONFLICT (id) DO UPDATE SET
    base_config = EXCLUDED.base_config,
    updated_at = NOW();

-- Lisää stable-versio
INSERT INTO versions (
    id,
    module_id,
    name,
    description,
    version_number,
    config,
    version_type,
    author_name
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'pipe-bending',
    'Perusversio',
    'Alkuperäinen putkentaivutusmoduuli kaikilla perustoiminnoilla.',
    '1.0.0',
    '{
        "version": "1.0.0",
        "features": {
            "3dVisualization": true,
            "angleInput": true,
            "radiusInput": true,
            "lengthInput": true,
            "materialSelection": true,
            "exportDXF": false,
            "multipleBends": true,
            "maxBends": 10
        },
        "ui": {
            "theme": "dark",
            "showGrid": true,
            "showDimensions": true,
            "autoRotate": false
        },
        "defaults": {
            "pipeDiameter": 25,
            "wallThickness": 2,
            "material": "steel",
            "bendRadius": 50,
            "unit": "mm"
        },
        "limits": {
            "minAngle": 1,
            "maxAngle": 180,
            "minRadius": 10,
            "maxRadius": 500,
            "minLength": 10,
            "maxLength": 5000
        }
    }',
    'stable',
    'FabOS Team'
) ON CONFLICT (id) DO NOTHING;

-- Päivitä moduulin stable-versio
UPDATE modules SET stable_version_id = 'a0000000-0000-0000-0000-000000000001' WHERE id = 'pipe-bending';
