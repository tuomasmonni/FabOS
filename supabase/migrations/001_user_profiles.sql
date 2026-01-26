-- ============================================================================
-- USER PROFILES SCHEMA
-- Käyttäjäprofiilien taulu nimimerkkien tallentamiseen
-- ============================================================================

-- User profiles taulu
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  company TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksit
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Kaikki voivat lukea profiileja (nimimerkit näkyville)
CREATE POLICY "Profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

-- Käyttäjät voivat luoda oman profiilin
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Käyttäjät voivat päivittää oman profiilin
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger updated_at päivitykseen
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- ============================================================================
-- KOMMENTIT
-- ============================================================================
COMMENT ON TABLE user_profiles IS 'Käyttäjäprofiilit nimimerkkeineen';
COMMENT ON COLUMN user_profiles.nickname IS 'Uniikki nimimerkki (3-20 merkkiä, pienet kirjaimet)';
COMMENT ON COLUMN user_profiles.role IS 'Käyttäjän rooli: user, staff, admin';
