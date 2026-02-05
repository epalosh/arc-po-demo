-- Arc PO Demo - Add Boat Types
-- Separate boat types (templates with MBOMs) from production units (scheduled instances)

-- =============================================================================
-- BOAT_TYPES TABLE (Templates with editable MBOMs)
-- =============================================================================
CREATE TABLE boat_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  description TEXT,
  default_manufacturing_time_days INTEGER NOT NULL DEFAULT 14,
  mbom JSONB NOT NULL DEFAULT '{"parts": []}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_id, model)
);

CREATE INDEX idx_boat_types_entity_id ON boat_types(entity_id);
CREATE INDEX idx_boat_types_model ON boat_types(model);
CREATE INDEX idx_boat_types_is_active ON boat_types(is_active);

CREATE TRIGGER update_boat_types_updated_at BEFORE UPDATE ON boat_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE boat_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on boat_types" ON boat_types FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- ADD boat_type_id TO BOATS TABLE
-- =============================================================================
ALTER TABLE boats ADD COLUMN boat_type_id UUID REFERENCES boat_types(id) ON DELETE RESTRICT;
CREATE INDEX idx_boats_boat_type_id ON boats(boat_type_id);

-- =============================================================================
-- MIGRATE EXISTING DATA
-- Create boat types from unique boat models in boats table
-- =============================================================================
DO $$
DECLARE
  boat_record RECORD;
  type_id UUID;
BEGIN
  -- For each unique combination of entity_id, model in boats table
  FOR boat_record IN 
    SELECT DISTINCT ON (entity_id, model)
      entity_id, 
      model, 
      name,
      manufacturing_time_days,
      mbom,
      notes
    FROM boats
    ORDER BY entity_id, model, created_at
  LOOP
    -- Create a boat type
    INSERT INTO boat_types (
      entity_id, 
      name, 
      model, 
      description,
      default_manufacturing_time_days, 
      mbom,
      notes
    ) VALUES (
      boat_record.entity_id,
      boat_record.name,
      boat_record.model,
      'Auto-migrated from existing boat: ' || boat_record.name,
      boat_record.manufacturing_time_days,
      boat_record.mbom,
      boat_record.notes
    ) RETURNING id INTO type_id;
    
    -- Update all boats with this entity_id and model to reference the new type
    UPDATE boats 
    SET boat_type_id = type_id
    WHERE entity_id = boat_record.entity_id 
      AND model = boat_record.model;
  END LOOP;
END $$;

-- =============================================================================
-- MAKE boat_type_id NOT NULL (after migration)
-- =============================================================================
ALTER TABLE boats ALTER COLUMN boat_type_id SET NOT NULL;

COMMENT ON TABLE boat_types IS 'Boat templates/types with editable MBOMs. Each type can have multiple production units.';
COMMENT ON TABLE boats IS 'Individual production units scheduled for manufacturing. Each references a boat_type for its MBOM.';
