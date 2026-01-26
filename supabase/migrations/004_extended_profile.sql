-- ============================================================================
-- EXTENDED USER PROFILES
-- Lisää kenttiä käyttäjäprofiiliin: etunimi, sukunimi, maa, ammatti, yritys
-- ============================================================================

-- Lisää uudet sarakkeet
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company TEXT;

-- Indeksit
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profession ON user_profiles(profession);

-- Kommentit
COMMENT ON COLUMN user_profiles.first_name IS 'Käyttäjän etunimi';
COMMENT ON COLUMN user_profiles.last_name IS 'Käyttäjän sukunimi';
COMMENT ON COLUMN user_profiles.country IS 'Käyttäjän maa (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN user_profiles.profession IS 'Käyttäjän ammatti';
COMMENT ON COLUMN user_profiles.company IS 'Käyttäjän yritys (valinnainen)';
