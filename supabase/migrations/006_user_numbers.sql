-- ============================================================================
-- USER NUMBERS MIGRATION
-- Käyttäjien numerointi rekisteröitymisjärjestyksen mukaan
-- ============================================================================

-- Vaihe 1: Lisää user_number sarake
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_number INTEGER;

-- Vaihe 2: Luo sekvenssi käyttäjänumeroille
CREATE SEQUENCE IF NOT EXISTS user_number_seq START WITH 1;

-- Vaihe 3: Täytä olemassa olevien käyttäjien numerot rekisteröitymisjärjestyksessä
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM user_profiles
  WHERE user_number IS NULL
)
UPDATE user_profiles
SET user_number = numbered_users.rn
FROM numbered_users
WHERE user_profiles.id = numbered_users.id;

-- Vaihe 4: Päivitä sekvenssi seuraavaan vapaaseen numeroon
SELECT setval('user_number_seq', COALESCE((SELECT MAX(user_number) FROM user_profiles), 0));

-- Vaihe 5: Luo funktio automaattiseen numerointiin uusille käyttäjille
CREATE OR REPLACE FUNCTION assign_user_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_number IS NULL THEN
    NEW.user_number := nextval('user_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vaihe 6: Luo trigger uusille käyttäjille
DROP TRIGGER IF EXISTS assign_user_number_trigger ON user_profiles;
CREATE TRIGGER assign_user_number_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_number();

-- Vaihe 7: Lisää UNIQUE constraint (jokainen numero vain kerran)
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_number_unique UNIQUE (user_number);

-- Vaihe 8: Luo indeksi nopeita hakuja varten
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_number ON user_profiles(user_number);

-- Vaihe 9: Kommentti dokumentointiin
COMMENT ON COLUMN user_profiles.user_number IS 'Käyttäjän järjestysnumero rekisteröitymishetken mukaan (#1, #2, #3...)';

-- ============================================================================
-- KÄYTTÖ
-- ============================================================================
-- Käyttäjänumero annetaan automaattisesti rekisteröityessä
-- Ensimmäinen käyttäjä on #1, toinen #2 jne.
-- Numeroita ei kierrätetä (jos käyttäjä poistetaan, numero jää vapaaksi)
-- ============================================================================
