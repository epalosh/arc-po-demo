-- Arc PO Demo - Add Multi-Entity Support
-- This migration adds an entities table and modifies all existing tables to support multiple entities
-- Each entity's data is completely siloed at the database level

-- =============================================================================
-- ENTITIES TABLE
-- =============================================================================
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_entities_is_active ON entities(is_active);

COMMENT ON TABLE entities IS 'Business entities - each entity has completely siloed data';
COMMENT ON COLUMN entities.is_active IS 'Whether this entity is active and accessible';

-- Add trigger for updated_at
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on entities" ON entities FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- ADD ENTITY_ID TO ALL EXISTING TABLES
-- =============================================================================

-- PARTS TABLE
ALTER TABLE parts ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX idx_parts_entity_id ON parts(entity_id);
-- Will set NOT NULL after data migration

-- SUPPLIERS TABLE
ALTER TABLE suppliers ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX idx_suppliers_entity_id ON suppliers(entity_id);
-- Will set NOT NULL after data migration

-- SUPPLIER_PARTS TABLE
ALTER TABLE supplier_parts ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX idx_supplier_parts_entity_id ON supplier_parts(entity_id);
-- Will set NOT NULL after data migration

-- BOATS TABLE
ALTER TABLE boats ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX idx_boats_entity_id ON boats(entity_id);
-- Will set NOT NULL after data migration

-- GENERATION_RUNS TABLE
ALTER TABLE generation_runs ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX idx_generation_runs_entity_id ON generation_runs(entity_id);
-- Will set NOT NULL after data migration

-- PURCHASE_ORDERS TABLE
ALTER TABLE purchase_orders ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX idx_purchase_orders_entity_id ON purchase_orders(entity_id);
-- Will set NOT NULL after data migration

-- PURCHASE_ORDER_LINES TABLE
ALTER TABLE purchase_order_lines ADD COLUMN entity_id UUID REFERENCES entities(id) ON DELETE CASCADE;
CREATE INDEX idx_purchase_order_lines_entity_id ON purchase_order_lines(entity_id);
-- Will set NOT NULL after data migration

-- =============================================================================
-- MIGRATE EXISTING DATA TO DEFAULT ENTITY
-- =============================================================================

-- Create a default entity for existing data
INSERT INTO entities (id, name, description, industry, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Arc Demo - Complex',
  'Complex entity with full boat manufacturing data',
  'Marine Manufacturing',
  true
);

-- Assign all existing data to the default entity
UPDATE parts SET entity_id = '00000000-0000-0000-0000-000000000001' WHERE entity_id IS NULL;
UPDATE suppliers SET entity_id = '00000000-0000-0000-0000-000000000001' WHERE entity_id IS NULL;
UPDATE supplier_parts SET entity_id = '00000000-0000-0000-0000-000000000001' WHERE entity_id IS NULL;
UPDATE boats SET entity_id = '00000000-0000-0000-0000-000000000001' WHERE entity_id IS NULL;
UPDATE generation_runs SET entity_id = '00000000-0000-0000-0000-000000000001' WHERE entity_id IS NULL;
UPDATE purchase_orders SET entity_id = '00000000-0000-0000-0000-000000000001' WHERE entity_id IS NULL;
UPDATE purchase_order_lines SET entity_id = '00000000-0000-0000-0000-000000000001' WHERE entity_id IS NULL;

-- =============================================================================
-- MAKE ENTITY_ID NOT NULL - ENFORCE COMPLETE DATA ISOLATION
-- =============================================================================

ALTER TABLE parts ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE supplier_parts ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE boats ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE generation_runs ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE purchase_orders ALTER COLUMN entity_id SET NOT NULL;
ALTER TABLE purchase_order_lines ALTER COLUMN entity_id SET NOT NULL;

-- =============================================================================
-- ADD UNIQUE CONSTRAINTS TO ENSURE ENTITY ISOLATION
-- =============================================================================

-- Part numbers must be unique within an entity (but can repeat across entities)
ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_part_number_key;
ALTER TABLE parts ADD CONSTRAINT parts_part_number_entity_unique UNIQUE (part_number, entity_id);

-- PO numbers must be unique within an entity
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_po_number_key;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_po_number_entity_unique UNIQUE (po_number, entity_id);

-- Supplier names should be unique within an entity
ALTER TABLE suppliers ADD CONSTRAINT suppliers_name_entity_unique UNIQUE (name, entity_id);

-- Supplier-Part relationships must be unique within an entity
ALTER TABLE supplier_parts DROP CONSTRAINT IF EXISTS supplier_parts_supplier_id_part_id_key;
ALTER TABLE supplier_parts ADD CONSTRAINT supplier_parts_supplier_part_entity_unique UNIQUE (supplier_id, part_id, entity_id);

-- =============================================================================
-- UPDATE RLS POLICIES FOR ENTITY ISOLATION
-- =============================================================================
-- Note: For now we keep permissive policies for the demo
-- In production, you would restrict based on user's entity access

-- Drop old policies
DROP POLICY IF EXISTS "Allow all operations on parts" ON parts;
DROP POLICY IF EXISTS "Allow all operations on suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow all operations on supplier_parts" ON supplier_parts;
DROP POLICY IF EXISTS "Allow all operations on boats" ON boats;
DROP POLICY IF EXISTS "Allow all operations on generation_runs" ON generation_runs;
DROP POLICY IF EXISTS "Allow all operations on purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Allow all operations on purchase_order_lines" ON purchase_order_lines;

-- Recreate policies (still permissive for demo, but structured for entity awareness)
CREATE POLICY "Allow all operations on parts" ON parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on supplier_parts" ON supplier_parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on boats" ON boats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on generation_runs" ON generation_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_orders" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_order_lines" ON purchase_order_lines FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- UPDATE PO NUMBER GENERATION TO BE ENTITY-AWARE
-- =============================================================================

-- Drop the old function (no parameters) before creating the new entity-aware version
DROP FUNCTION IF EXISTS generate_po_number();

-- Create new entity-aware function
CREATE FUNCTION generate_po_number(p_entity_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  po_num TEXT;
BEGIN
  -- Get the count of POs for this entity and increment
  SELECT COUNT(*) + 1 INTO next_number 
  FROM purchase_orders 
  WHERE entity_id = p_entity_id;
  
  -- Format as PO-YYYYMMDD-NNNN
  po_num := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN po_num;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use entity-aware PO number generation
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := generate_po_number(NEW.entity_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_po_number IS 'Generates a unique PO number for an entity in format PO-YYYYMMDD-NNNN';

-- =============================================================================
-- HELPER VIEWS FOR ENTITY-AWARE QUERIES
-- =============================================================================

-- View to see parts with their entity information
CREATE OR REPLACE VIEW parts_with_entity AS
SELECT 
  p.*,
  e.name as entity_name
FROM parts p
JOIN entities e ON p.entity_id = e.id;

-- View to see suppliers with their entity information
CREATE OR REPLACE VIEW suppliers_with_entity AS
SELECT 
  s.*,
  e.name as entity_name
FROM suppliers s
JOIN entities e ON s.entity_id = e.id;

-- View to see boats with their entity information
CREATE OR REPLACE VIEW boats_with_entity AS
SELECT 
  b.*,
  e.name as entity_name
FROM boats b
JOIN entities e ON b.entity_id = e.id;

-- View to see purchase orders with their entity information
CREATE OR REPLACE VIEW purchase_orders_with_entity AS
SELECT 
  po.*,
  e.name as entity_name,
  s.name as supplier_name
FROM purchase_orders po
JOIN entities e ON po.entity_id = e.id
JOIN suppliers s ON po.supplier_id = s.id;

COMMENT ON VIEW parts_with_entity IS 'Parts with entity names for easier querying';
COMMENT ON VIEW suppliers_with_entity IS 'Suppliers with entity names for easier querying';
COMMENT ON VIEW boats_with_entity IS 'Boats with entity names for easier querying';
COMMENT ON VIEW purchase_orders_with_entity IS 'Purchase orders with entity and supplier names for easier querying';
