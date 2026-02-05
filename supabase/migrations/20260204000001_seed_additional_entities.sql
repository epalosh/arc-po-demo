-- Arc PO Demo - Seed Additional Entities
-- This migration creates 2 additional entities with separate data sets

-- =============================================================================
-- CREATE ADDITIONAL ENTITIES
-- =============================================================================

-- Entity 2: Simple Demo Entity
INSERT INTO entities (id, name, description, industry, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Arc Demo - Simple',
  'Simple entity with minimal data for demonstration',
  'Marine Manufacturing',
  true
);

-- Note: Entity 1 (Arc Demo - Complex) already exists from the previous migration
-- and contains the existing seed data
