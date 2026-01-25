-- ============================================================================
-- VERSIONS & VOTING SCHEMA
-- Versioiden ja äänestysten taulut AI-kehitysassistenttia varten
-- ============================================================================

-- Versiot-taulu
CREATE TABLE IF NOT EXISTS versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version_number TEXT NOT NULL,
  version_type TEXT NOT NULL CHECK (version_type IN ('stable', 'experimental')),
  config JSONB NOT NULL DEFAULT '{}',
  author_name TEXT DEFAULT 'Käyttäjä',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_fingerprint TEXT,
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  test_count INTEGER DEFAULT 0,
  promoted_at TIMESTAMPTZ,
  promoted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Äänet-taulu
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Yksi ääni per käyttäjä per versio
  UNIQUE(version_id, user_fingerprint)
);

-- Keskustelut-taulu (AI-keskustelujen tallennus)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_fingerprint TEXT,
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  result_version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viestit-taulu
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'clarification', 'suggestion', 'final', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksit
CREATE INDEX IF NOT EXISTS idx_versions_module ON versions(module_id);
CREATE INDEX IF NOT EXISTS idx_versions_type ON versions(version_type);
CREATE INDEX IF NOT EXISTS idx_versions_created ON versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_version ON votes(version_id);
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint ON votes(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_conversations_module ON conversations(module_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- ============================================================================
-- RPC FUNKTIOT - Laskurien kasvattaminen atomisesti
-- ============================================================================

-- Katselukertojen kasvattaminen
CREATE OR REPLACE FUNCTION increment_view_count(version_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE versions
  SET view_count = view_count + 1
  WHERE id = version_id;
END;
$$;

-- Testikertojen kasvattaminen
CREATE OR REPLACE FUNCTION increment_test_count(version_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE versions
  SET test_count = test_count + 1
  WHERE id = version_id;
END;
$$;

-- Äänen lisääminen ja laskurin päivitys (transaktio)
CREATE OR REPLACE FUNCTION add_vote(
  p_version_id UUID,
  p_vote_type TEXT,
  p_user_fingerprint TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Yritä lisätä ääni
  INSERT INTO votes (version_id, vote_type, user_fingerprint, user_id)
  VALUES (p_version_id, p_vote_type, p_user_fingerprint, p_user_id);

  -- Päivitä version laskuri
  IF p_vote_type = 'up' THEN
    UPDATE versions SET votes_up = votes_up + 1 WHERE id = p_version_id;
  ELSE
    UPDATE versions SET votes_down = votes_down + 1 WHERE id = p_version_id;
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'message', 'Olet jo äänestänyt tätä versiota');
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Versions: kaikki voivat lukea, kirjautuneet voivat luoda
CREATE POLICY "Versions are viewable by everyone"
  ON versions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create versions"
  ON versions FOR INSERT
  WITH CHECK (true);  -- Sallitaan myös anonyymit fingerprint-pohjaiset

CREATE POLICY "Users can update own versions"
  ON versions FOR UPDATE
  USING (
    user_id = auth.uid() OR
    (user_id IS NULL AND user_fingerprint IS NOT NULL)
  );

-- Votes: kaikki voivat lukea, kaikki voivat äänestää
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can vote"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Conversations: käyttäjät näkevät omat keskustelut
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    user_id = auth.uid() OR
    (user_id IS NULL AND user_fingerprint IS NOT NULL)
  );

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    user_id = auth.uid() OR
    (user_id IS NULL AND user_fingerprint IS NOT NULL)
  );

-- Messages: näkee keskustelunsa viestit
CREATE POLICY "Users can view messages of own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR c.user_fingerprint IS NOT NULL)
    )
  );

CREATE POLICY "Anyone can add messages to conversations"
  ON messages FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Päivitä updated_at automaattisesti
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_versions_updated_at
  BEFORE UPDATE ON versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA - Perusversio putkentaivutukselle
-- ============================================================================

INSERT INTO versions (
  module_id,
  name,
  description,
  version_number,
  version_type,
  author_name,
  votes_up,
  votes_down,
  view_count,
  test_count,
  config
) VALUES (
  'pipe-bending',
  'Perusversio',
  'Alkuperäinen putkentaivutusmoduuli kaikilla perustoiminnoilla. Sisältää 3D-visualisoinnin, useat taivutukset ja materiaalivalinnat.',
  '1.0.0',
  'stable',
  'FabOS Team',
  45,
  2,
  1250,
  89,
  '{
    "version": "1.0.0",
    "features": {
      "3dVisualization": true,
      "multipleBends": true,
      "maxBends": 10,
      "exportDXF": false,
      "autoRotate": false
    },
    "ui": {
      "theme": "default",
      "showGrid": true,
      "showAxes": true
    },
    "defaults": {
      "pipeDiameter": 25,
      "wallThickness": 2,
      "material": "steel"
    },
    "limits": {
      "minDiameter": 10,
      "maxDiameter": 100,
      "minRadius": 20,
      "maxRadius": 500
    },
    "materials": ["steel", "stainless", "aluminum", "copper"]
  }'::jsonb
)
ON CONFLICT DO NOTHING;
