-- ============================================================================
-- USER ROLES MIGRATION
-- Hierarkkinen roolijärjestelmä 9 tasolla
-- ============================================================================

-- Vaihe 1: Lisää role_level sarake hierarkian vertailuja varten
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role_level INTEGER DEFAULT 1;

-- Vaihe 2: Poista vanha CHECK constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Vaihe 3: Lisää uusi CHECK constraint kaikille 9 roolille
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('guest', 'user', 'beta_tester', 'developer', 'staff', 'moderator', 'admin', 'owner', 'super_admin'));

-- Vaihe 4: Luo funktio role_level synkronointiin
CREATE OR REPLACE FUNCTION sync_role_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.role_level := CASE NEW.role
    WHEN 'guest' THEN 0
    WHEN 'user' THEN 1
    WHEN 'beta_tester' THEN 2
    WHEN 'developer' THEN 3
    WHEN 'staff' THEN 4
    WHEN 'moderator' THEN 5
    WHEN 'admin' THEN 6
    WHEN 'owner' THEN 7
    WHEN 'super_admin' THEN 8
    ELSE 1
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vaihe 5: Luo trigger role_level automaattiseen synkronointiin
DROP TRIGGER IF EXISTS sync_user_role_level ON user_profiles;
CREATE TRIGGER sync_user_role_level
  BEFORE INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_level();

-- Vaihe 6: Synkronoi olemassa olevien käyttäjien role_level
UPDATE user_profiles SET role_level = CASE role
  WHEN 'guest' THEN 0
  WHEN 'user' THEN 1
  WHEN 'beta_tester' THEN 2
  WHEN 'developer' THEN 3
  WHEN 'staff' THEN 4
  WHEN 'moderator' THEN 5
  WHEN 'admin' THEN 6
  WHEN 'owner' THEN 7
  WHEN 'super_admin' THEN 8
  ELSE 1
END;

-- Vaihe 7: Luo indeksit roolikyselyille
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_level ON user_profiles(role_level);

-- Vaihe 8: Kommentit dokumentointiin
COMMENT ON COLUMN user_profiles.role IS 'Käyttäjän rooli: guest(0), user(1), beta_tester(2), developer(3), staff(4), moderator(5), admin(6), owner(7), super_admin(8)';
COMMENT ON COLUMN user_profiles.role_level IS 'Numeerinen roolitaso hierarkiavertailuja varten (0-8)';

-- ============================================================================
-- ROOLIEN KUVAUKSET
-- ============================================================================
-- guest (0)       - Ei kirjautunut
-- user (1)        - Peruskäyttäjä (oletus uusille käyttäjille)
-- beta_tester (2) - Pääsy kokeellisiin ominaisuuksiin
-- developer (3)   - Voi luoda ja muokata moduuleja
-- staff (4)       - Henkilökunta
-- moderator (5)   - Sisällön moderointi
-- admin (6)       - Ylläpitäjä, täydet oikeudet
-- owner (7)       - Omistaja
-- super_admin (8) - Pääkäyttäjä, voi muuttaa muiden rooleja
-- ============================================================================
