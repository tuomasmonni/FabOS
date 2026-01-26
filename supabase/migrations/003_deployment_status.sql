-- ============================================================================
-- DEPLOYMENT STATUS SCHEMA
-- Lisää deployment_status -kenttä versioihin "Päivitys tulossa" -tilaa varten
-- ============================================================================

-- Lisää deployment_status sarake versions-tauluun
ALTER TABLE versions
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'config_only'
CHECK (deployment_status IN ('config_only', 'pending', 'generating', 'deployed', 'failed'));

-- Lisää deployed_at aikaleima
ALTER TABLE versions
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ;

-- Lisää käyttäjän sähköposti ilmoituksia varten
ALTER TABLE versions
ADD COLUMN IF NOT EXISTS creator_email TEXT;

-- Lisää github_workflow_id seurantaa varten
ALTER TABLE versions
ADD COLUMN IF NOT EXISTS github_workflow_id TEXT;

-- Lisää user_request alkuperäinen pyyntö
ALTER TABLE versions
ADD COLUMN IF NOT EXISTS user_request TEXT;

-- Indeksit
CREATE INDEX IF NOT EXISTS idx_versions_deployment_status ON versions(deployment_status);
CREATE INDEX IF NOT EXISTS idx_versions_creator_email ON versions(creator_email);

-- ============================================================================
-- KOMMENTIT
-- ============================================================================
COMMENT ON COLUMN versions.deployment_status IS 'Deployment status: config_only (vain config muutettu), pending (odottaa generointia), generating (AI generoi), deployed (valmis), failed (epäonnistui)';
COMMENT ON COLUMN versions.deployed_at IS 'Aikaleima kun koodi otettiin käyttöön';
COMMENT ON COLUMN versions.creator_email IS 'Käyttäjän sähköposti ilmoituksia varten';
COMMENT ON COLUMN versions.github_workflow_id IS 'GitHub Actions workflow run ID seurantaa varten';
COMMENT ON COLUMN versions.user_request IS 'Käyttäjän alkuperäinen pyyntö AI:lle';
