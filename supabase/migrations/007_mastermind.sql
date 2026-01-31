-- ============================================================================
-- MASTERMIND - Monday.com-tyylinen projektinhallinta FabOS:ssa
-- Migraatio 007 - Luotu 31.01.2026
-- ============================================================================

-- MasterMind Boards (Taulut)
CREATE TABLE mm_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MasterMind Columns (Sarakkeet)
CREATE TABLE mm_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES mm_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',  -- text, status, date, number, person
  settings JSONB DEFAULT '{}',        -- Esim. status-valinnat, numero-formaatti
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MasterMind Groups (Ryhmät)
CREATE TABLE mm_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES mm_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT DEFAULT '#6161FF',
  position INT DEFAULT 0,
  collapsed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MasterMind Items (Rivit)
CREATE TABLE mm_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES mm_boards(id) ON DELETE CASCADE,
  group_id UUID REFERENCES mm_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  column_values JSONB DEFAULT '{}',  -- { "column_id": "value", ... }
  position INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEKSIT - Nopeutetaan hakuja
-- ============================================================================

CREATE INDEX idx_mm_columns_board ON mm_columns(board_id);
CREATE INDEX idx_mm_columns_position ON mm_columns(board_id, position);

CREATE INDEX idx_mm_groups_board ON mm_groups(board_id);
CREATE INDEX idx_mm_groups_position ON mm_groups(board_id, position);

CREATE INDEX idx_mm_items_board ON mm_items(board_id);
CREATE INDEX idx_mm_items_group ON mm_items(group_id);
CREATE INDEX idx_mm_items_position ON mm_items(group_id, position);

-- ============================================================================
-- ROW LEVEL SECURITY - "Viidakko-moodi": kaikki näkevät kaiken
-- ============================================================================

ALTER TABLE mm_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_items ENABLE ROW LEVEL SECURITY;

-- mm_boards policies
CREATE POLICY "Anyone can read boards" ON mm_boards
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert boards" ON mm_boards
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update boards" ON mm_boards
  FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete boards" ON mm_boards
  FOR DELETE USING (true);

-- mm_columns policies
CREATE POLICY "Anyone can read columns" ON mm_columns
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert columns" ON mm_columns
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update columns" ON mm_columns
  FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete columns" ON mm_columns
  FOR DELETE USING (true);

-- mm_groups policies
CREATE POLICY "Anyone can read groups" ON mm_groups
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert groups" ON mm_groups
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update groups" ON mm_groups
  FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete groups" ON mm_groups
  FOR DELETE USING (true);

-- mm_items policies
CREATE POLICY "Anyone can read items" ON mm_items
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert items" ON mm_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update items" ON mm_items
  FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete items" ON mm_items
  FOR DELETE USING (true);

-- ============================================================================
-- TRIGGERS - Päivitä updated_at automaattisesti
-- ============================================================================

CREATE OR REPLACE FUNCTION update_mm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mm_boards_updated_at
  BEFORE UPDATE ON mm_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_mm_updated_at();

CREATE TRIGGER mm_items_updated_at
  BEFORE UPDATE ON mm_items
  FOR EACH ROW
  EXECUTE FUNCTION update_mm_updated_at();

-- ============================================================================
-- KOMMENTIT
-- ============================================================================

COMMENT ON TABLE mm_boards IS 'MasterMind boardit - Monday.com-tyyliset työtilat';
COMMENT ON TABLE mm_columns IS 'Boardin sarakkeet (text, status, date, number, person)';
COMMENT ON TABLE mm_groups IS 'Boardin ryhmät itemien organisointiin';
COMMENT ON TABLE mm_items IS 'Yksittäiset rivit/tehtävät boardilla';

COMMENT ON COLUMN mm_columns.settings IS 'JSON-muotoiset asetukset, esim. {"labels": [{"id": "1", "name": "Done", "color": "green"}]}';
COMMENT ON COLUMN mm_items.column_values IS 'Itemin arvot per sarake, esim. {"col_uuid": "value"}';
