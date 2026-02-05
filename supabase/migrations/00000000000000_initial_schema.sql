-- Arc PO Demo - Initial Database Schema
-- This creates all base tables before adding entity support

-- =============================================================================
-- HELPER FUNCTION FOR UPDATED_AT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PARTS TABLE
-- =============================================================================
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL DEFAULT 'EA',
  unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_part_number ON parts(part_number);
CREATE INDEX idx_parts_category ON parts(category);

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on parts" ON parts FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- SUPPLIERS TABLE
-- =============================================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  rating DECIMAL(3, 2),
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- SUPPLIER_PARTS TABLE (Many-to-Many with pricing/lead time)
-- =============================================================================
CREATE TABLE supplier_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  lead_time_days INTEGER NOT NULL,
  minimum_order_quantity INTEGER NOT NULL DEFAULT 1,
  batch_size INTEGER NOT NULL DEFAULT 1,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  max_monthly_capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_id, part_id)
);

CREATE INDEX idx_supplier_parts_supplier_id ON supplier_parts(supplier_id);
CREATE INDEX idx_supplier_parts_part_id ON supplier_parts(part_id);
CREATE INDEX idx_supplier_parts_is_preferred ON supplier_parts(is_preferred);

CREATE TRIGGER update_supplier_parts_updated_at BEFORE UPDATE ON supplier_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE supplier_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on supplier_parts" ON supplier_parts FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- BOATS TABLE (Production Schedule)
-- =============================================================================
CREATE TABLE boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  due_date DATE NOT NULL,
  manufacturing_time_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  mbom JSONB NOT NULL DEFAULT '{"parts": []}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boats_due_date ON boats(due_date);
CREATE INDEX idx_boats_status ON boats(status);

CREATE TRIGGER update_boats_updated_at BEFORE UPDATE ON boats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on boats" ON boats FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- GENERATION_RUNS TABLE (Track PO generation runs)
-- =============================================================================
CREATE TABLE generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parameters JSONB NOT NULL,
  total_pos_generated INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generation_runs_run_date ON generation_runs(run_date);
CREATE INDEX idx_generation_runs_status ON generation_runs(status);

ALTER TABLE generation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on generation_runs" ON generation_runs FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- PURCHASE_ORDERS TABLE
-- =============================================================================
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_by_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'ordered', 'received', 'cancelled')),
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  generated_by_system BOOLEAN NOT NULL DEFAULT false,
  generation_run_id UUID REFERENCES generation_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_generation_run_id ON purchase_orders(generation_run_id);

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on purchase_orders" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- PURCHASE_ORDER_LINES TABLE
-- =============================================================================
CREATE TABLE purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(12, 2) NOT NULL,
  linked_boat_ids JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_lines_po_id ON purchase_order_lines(po_id);
CREATE INDEX idx_purchase_order_lines_part_id ON purchase_order_lines(part_id);

ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on purchase_order_lines" ON purchase_order_lines FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- PO NUMBER GENERATION FUNCTION
-- =============================================================================
CREATE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  po_num TEXT;
BEGIN
  -- Get the count of POs and increment
  SELECT COUNT(*) + 1 INTO next_number FROM purchase_orders;
  
  -- Format as PO-YYYYMMDD-NNNN
  po_num := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN po_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := generate_po_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_po_number_trigger
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_po_number();

COMMENT ON FUNCTION generate_po_number IS 'Generates a unique PO number in format PO-YYYYMMDD-NNNN';
