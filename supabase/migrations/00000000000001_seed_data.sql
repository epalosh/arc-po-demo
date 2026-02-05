-- Arc PO Demo - Seed Data
-- Sample data for demo purposes

-- =============================================================================
-- PARTS (20 boat manufacturing parts)
-- =============================================================================
INSERT INTO parts (part_number, name, description, category, current_stock, unit_of_measure, unit_cost, reorder_point) VALUES
('HULL-001', 'Fiberglass Hull', 'Main hull structure', 'Structural', 5, 'EA', 12000.00, 3),
('DK-001', 'Deck Panel', 'Top deck fiberglass panel', 'Structural', 8, 'EA', 4500.00, 5),
('ENG-V8-450', 'V8 Marine Engine 450HP', 'Primary propulsion engine', 'Propulsion', 2, 'EA', 28000.00, 2),
('ENG-OB-300', 'Outboard Engine 300HP', 'Secondary propulsion system', 'Propulsion', 3, 'EA', 18500.00, 2),
('PROP-SS-19', 'Stainless Steel Propeller 19"', 'High-performance propeller', 'Propulsion', 12, 'EA', 850.00, 8),
('HELM-PKG', 'Helm Station Package', 'Complete helm console with instruments', 'Electronics', 4, 'EA', 6500.00, 3),
('GPS-CHART', 'GPS Chartplotter 12"', 'Marine navigation system', 'Electronics', 6, 'EA', 2400.00, 4),
('VHF-RAD', 'VHF Marine Radio', 'Communication radio', 'Electronics', 15, 'EA', 320.00, 10),
('SEAT-CAP', 'Captain''s Seat', 'Adjustable helm seat', 'Interior', 10, 'EA', 950.00, 6),
('SEAT-PASS', 'Passenger Bench Seat', 'Upholstered bench seating', 'Interior', 8, 'EA', 1200.00, 5),
('CANVAS-TOP', 'Bimini Top Canvas', 'Sun protection canvas top', 'Exterior', 12, 'EA', 780.00, 8),
('ANCHOR-SS', 'Stainless Anchor 35lb', 'Marine anchor with chain', 'Hardware', 20, 'EA', 240.00, 12),
('CLEAT-8', '8" Dock Cleat', 'Stainless steel dock cleat', 'Hardware', 45, 'EA', 35.00, 30),
('ROD-HOLD', 'Rod Holder', 'Flush mount fishing rod holder', 'Accessories', 32, 'EA', 48.00, 20),
('PUMP-BILGE', 'Bilge Pump 1100GPH', 'Automatic bilge pump', 'Plumbing', 18, 'EA', 165.00, 12),
('TANK-FUEL', 'Fuel Tank 100gal', 'Aluminum fuel tank', 'Plumbing', 6, 'EA', 1450.00, 4),
('LIGHT-NAV', 'Navigation Light Set', 'LED navigation lights', 'Electrical', 25, 'SET', 185.00, 15),
('SWITCH-PANEL', 'Electrical Switch Panel', '12-position switch panel', 'Electrical', 14, 'EA', 280.00, 10),
('BATTERY-MAR', 'Marine Battery 12V', 'Deep cycle marine battery', 'Electrical', 22, 'EA', 295.00, 15),
('FENDER-LG', 'Large Fender', 'Inflatable boat fender', 'Accessories', 30, 'EA', 42.00, 20);

-- =============================================================================
-- SUPPLIERS (5 suppliers with different specialties)
-- =============================================================================
INSERT INTO suppliers (name, contact_name, email, phone, address, rating, payment_terms, notes) VALUES
('Marine Components Inc', 'John Smith', 'orders@marinecomp.com', '555-0101', '123 Harbor Blvd, Miami, FL', 4.5, 'Net 30', 'Primary supplier for structural components'),
('PowerBoat Engines LLC', 'Sarah Johnson', 'sales@powerboateng.com', '555-0202', '456 Engine Way, Fort Lauderdale, FL', 4.8, 'Net 45', 'Specialized in marine engines and propulsion'),
('Nautical Electronics Supply', 'Mike Chen', 'info@nauticalelec.com', '555-0303', '789 Tech Drive, Tampa, FL', 4.3, 'Net 30', 'Electronics and navigation equipment'),
('Coastal Marine Interiors', 'Lisa Brown', 'contact@coastalinteriors.com', '555-0404', '321 Design St, Jacksonville, FL', 4.6, 'Net 30', 'Seating, canvas, and interior components'),
('Atlantic Marine Hardware', 'Tom Wilson', 'orders@atlantichw.com', '555-0505', '654 Industrial Pkwy, Pensacola, FL', 4.4, 'Net 30', 'Hardware, accessories, and general supplies');

-- =============================================================================
-- SUPPLIER_PARTS (Link suppliers to parts with pricing and lead times)
-- =============================================================================
INSERT INTO supplier_parts (supplier_id, part_id, lead_time_days, minimum_order_quantity, batch_size, price_per_unit, is_preferred, max_monthly_capacity) VALUES
-- Marine Components Inc (Structural)
((SELECT id FROM suppliers WHERE name = 'Marine Components Inc'), (SELECT id FROM parts WHERE part_number = 'HULL-001'), 30, 1, 1, 12000.00, true, 10),
((SELECT id FROM suppliers WHERE name = 'Marine Components Inc'), (SELECT id FROM parts WHERE part_number = 'DK-001'), 25, 1, 1, 4500.00, true, 15),
((SELECT id FROM suppliers WHERE name = 'Marine Components Inc'), (SELECT id FROM parts WHERE part_number = 'TANK-FUEL'), 21, 2, 2, 1450.00, true, 20),

-- PowerBoat Engines LLC (Propulsion)
((SELECT id FROM suppliers WHERE name = 'PowerBoat Engines LLC'), (SELECT id FROM parts WHERE part_number = 'ENG-V8-450'), 45, 1, 1, 28000.00, true, 8),
((SELECT id FROM suppliers WHERE name = 'PowerBoat Engines LLC'), (SELECT id FROM parts WHERE part_number = 'ENG-OB-300'), 35, 1, 1, 18500.00, true, 12),
((SELECT id FROM suppliers WHERE name = 'PowerBoat Engines LLC'), (SELECT id FROM parts WHERE part_number = 'PROP-SS-19'), 14, 4, 4, 850.00, true, 40),

-- Nautical Electronics Supply (Electronics)
((SELECT id FROM suppliers WHERE name = 'Nautical Electronics Supply'), (SELECT id FROM parts WHERE part_number = 'HELM-PKG'), 28, 1, 1, 6500.00, true, 10),
((SELECT id FROM suppliers WHERE name = 'Nautical Electronics Supply'), (SELECT id FROM parts WHERE part_number = 'GPS-CHART'), 21, 2, 2, 2400.00, true, 25),
((SELECT id FROM suppliers WHERE name = 'Nautical Electronics Supply'), (SELECT id FROM parts WHERE part_number = 'VHF-RAD'), 14, 5, 5, 320.00, true, 50),
((SELECT id FROM suppliers WHERE name = 'Nautical Electronics Supply'), (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL'), 18, 5, 5, 280.00, true, 40),
((SELECT id FROM suppliers WHERE name = 'Nautical Electronics Supply'), (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV'), 12, 10, 10, 185.00, true, 60),

-- Coastal Marine Interiors (Interior/Canvas)
((SELECT id FROM suppliers WHERE name = 'Coastal Marine Interiors'), (SELECT id FROM parts WHERE part_number = 'SEAT-CAP'), 21, 2, 2, 950.00, true, 20),
((SELECT id FROM suppliers WHERE name = 'Coastal Marine Interiors'), (SELECT id FROM parts WHERE part_number = 'SEAT-PASS'), 21, 2, 2, 1200.00, true, 18),
((SELECT id FROM suppliers WHERE name = 'Coastal Marine Interiors'), (SELECT id FROM parts WHERE part_number = 'CANVAS-TOP'), 28, 3, 3, 780.00, true, 25),

-- Atlantic Marine Hardware (Hardware/Accessories)
((SELECT id FROM suppliers WHERE name = 'Atlantic Marine Hardware'), (SELECT id FROM parts WHERE part_number = 'ANCHOR-SS'), 10, 5, 5, 240.00, true, 80),
((SELECT id FROM suppliers WHERE name = 'Atlantic Marine Hardware'), (SELECT id FROM parts WHERE part_number = 'CLEAT-8'), 7, 20, 20, 35.00, true, 200),
((SELECT id FROM suppliers WHERE name = 'Atlantic Marine Hardware'), (SELECT id FROM parts WHERE part_number = 'ROD-HOLD'), 10, 10, 10, 48.00, true, 120),
((SELECT id FROM suppliers WHERE name = 'Atlantic Marine Hardware'), (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE'), 14, 6, 6, 165.00, true, 60),
((SELECT id FROM suppliers WHERE name = 'Atlantic Marine Hardware'), (SELECT id FROM parts WHERE part_number = 'BATTERY-MAR'), 10, 10, 10, 295.00, true, 100),
((SELECT id FROM suppliers WHERE name = 'Atlantic Marine Hardware'), (SELECT id FROM parts WHERE part_number = 'FENDER-LG'), 7, 15, 15, 42.00, true, 150);

-- =============================================================================
-- BOATS (3 boat models scheduled over the next 6 months)
-- =============================================================================

-- Boat 1: Sea Cruiser Alpha
DO $$
DECLARE
  boat_id UUID;
BEGIN
  INSERT INTO boats (name, model, due_date, manufacturing_time_days, status, mbom, notes)
  VALUES (
    'Sea Cruiser Alpha',
    'SC-2800 Sport',
    CURRENT_DATE + INTERVAL '90 days',
    45,
    'scheduled',
    '{"parts": []}'::jsonb,
    'High-end sport cruiser for VIP customer'
  ) RETURNING id INTO boat_id;
  
  UPDATE boats SET mbom = jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-001')::text, 'quantity_required', 1, 'part_name', 'Fiberglass Hull'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DK-001')::text, 'quantity_required', 1, 'part_name', 'Deck Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-V8-450')::text, 'quantity_required', 2, 'part_name', 'V8 Marine Engine 450HP'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-SS-19')::text, 'quantity_required', 2, 'part_name', 'Stainless Steel Propeller 19"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HELM-PKG')::text, 'quantity_required', 1, 'part_name', 'Helm Station Package'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-CHART')::text, 'quantity_required', 1, 'part_name', 'GPS Chartplotter 12"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'VHF-RAD')::text, 'quantity_required', 1, 'part_name', 'VHF Marine Radio'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-CAP')::text, 'quantity_required', 2, 'part_name', 'Captain''s Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-PASS')::text, 'quantity_required', 1, 'part_name', 'Passenger Bench Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-TOP')::text, 'quantity_required', 1, 'part_name', 'Bimini Top Canvas'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-FUEL')::text, 'quantity_required', 2, 'part_name', 'Fuel Tank 100gal'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SS')::text, 'quantity_required', 1, 'part_name', 'Stainless Anchor 35lb'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-8')::text, 'quantity_required', 4, 'part_name', '8" Dock Cleat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE')::text, 'quantity_required', 2, 'part_name', 'Bilge Pump 1100GPH'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV')::text, 'quantity_required', 1, 'part_name', 'Navigation Light Set'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL')::text, 'quantity_required', 1, 'part_name', 'Electrical Switch Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER-LG')::text, 'quantity_required', 4, 'part_name', 'Large Fender')
    )
  ) WHERE id = boat_id;
END $$;

-- Boat 2: Coastal Runner Beta
DO $$
DECLARE
  boat_id UUID;
BEGIN
  INSERT INTO boats (name, model, due_date, manufacturing_time_days, status, mbom, notes)
  VALUES (
    'Coastal Runner Beta',
    'CR-2400 Center Console',
    CURRENT_DATE + INTERVAL '120 days',
    35,
    'scheduled',
    '{"parts": []}'::jsonb,
    'Fishing-focused center console build'
  ) RETURNING id INTO boat_id;
  
  UPDATE boats SET mbom = jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-001')::text, 'quantity_required', 1, 'part_name', 'Fiberglass Hull'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DK-001')::text, 'quantity_required', 1, 'part_name', 'Deck Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-OB-300')::text, 'quantity_required', 2, 'part_name', 'Outboard Engine 300HP'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-SS-19')::text, 'quantity_required', 2, 'part_name', 'Stainless Steel Propeller 19"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-CHART')::text, 'quantity_required', 1, 'part_name', 'GPS Chartplotter 12"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'VHF-RAD')::text, 'quantity_required', 1, 'part_name', 'VHF Marine Radio'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-CAP')::text, 'quantity_required', 1, 'part_name', 'Captain''s Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ROD-HOLD')::text, 'quantity_required', 6, 'part_name', 'Rod Holder'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-TOP')::text, 'quantity_required', 1, 'part_name', 'Bimini Top Canvas'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-FUEL')::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 100gal'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SS')::text, 'quantity_required', 1, 'part_name', 'Stainless Anchor 35lb'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-8')::text, 'quantity_required', 4, 'part_name', '8" Dock Cleat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE')::text, 'quantity_required', 2, 'part_name', 'Bilge Pump 1100GPH'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV')::text, 'quantity_required', 1, 'part_name', 'Navigation Light Set'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL')::text, 'quantity_required', 1, 'part_name', 'Electrical Switch Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER-LG')::text, 'quantity_required', 4, 'part_name', 'Large Fender')
    )
  ) WHERE id = boat_id;
END $$;

-- Boat 3: Harbor Master Gamma
DO $$
DECLARE
  boat_id UUID;
BEGIN
  INSERT INTO boats (name, model, due_date, manufacturing_time_days, status, mbom, notes)
  VALUES (
    'Harbor Master Gamma',
    'HM-3200 Yacht',
    CURRENT_DATE + INTERVAL '180 days',
    60,
    'scheduled',
    '{"parts": []}'::jsonb,
    'Luxury yacht with extended range'
  ) RETURNING id INTO boat_id;
  
  UPDATE boats SET mbom = jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-001')::text, 'quantity_required', 1, 'part_name', 'Fiberglass Hull'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DK-001')::text, 'quantity_required', 2, 'part_name', 'Deck Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-V8-450')::text, 'quantity_required', 2, 'part_name', 'V8 Marine Engine 450HP'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-SS-19')::text, 'quantity_required', 2, 'part_name', 'Stainless Steel Propeller 19"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HELM-PKG')::text, 'quantity_required', 1, 'part_name', 'Helm Station Package'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-CHART')::text, 'quantity_required', 2, 'part_name', 'GPS Chartplotter 12"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'VHF-RAD')::text, 'quantity_required', 2, 'part_name', 'VHF Marine Radio'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-CAP')::text, 'quantity_required', 2, 'part_name', 'Captain''s Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-PASS')::text, 'quantity_required', 3, 'part_name', 'Passenger Bench Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-TOP')::text, 'quantity_required', 2, 'part_name', 'Bimini Top Canvas'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-FUEL')::text, 'quantity_required', 3, 'part_name', 'Fuel Tank 100gal'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-MAR')::text, 'quantity_required', 4, 'part_name', 'Marine Battery 12V'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SS')::text, 'quantity_required', 1, 'part_name', 'Stainless Anchor 35lb'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-8')::text, 'quantity_required', 4, 'part_name', '8" Dock Cleat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE')::text, 'quantity_required', 2, 'part_name', 'Bilge Pump 1100GPH'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV')::text, 'quantity_required', 1, 'part_name', 'Navigation Light Set'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL')::text, 'quantity_required', 1, 'part_name', 'Electrical Switch Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER-LG')::text, 'quantity_required', 4, 'part_name', 'Large Fender')
    )
  ) WHERE id = boat_id;
END $$;


COMMENT ON TABLE parts IS 'Boat parts and components inventory';
COMMENT ON TABLE suppliers IS 'Suppliers who provide parts';
COMMENT ON TABLE supplier_parts IS 'Junction table linking suppliers to parts with pricing and lead times';
COMMENT ON TABLE boats IS 'Production schedule - boats to be manufactured';
