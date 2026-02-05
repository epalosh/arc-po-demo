-- Arc PO Demo - Replace Complex Entity Data
-- Remove existing seed data and add simplified data with:
-- - Manufacturing time < 7 days per boat
-- - 10 boats scheduled per month

-- =============================================================================
-- REMOVE EXISTING DATA FROM ARC DEMO - COMPLEX ENTITY
-- =============================================================================

-- Get the entity ID for Arc Demo - Complex
DO $$
DECLARE
  complex_entity_id UUID;
BEGIN
  SELECT id INTO complex_entity_id FROM entities WHERE name = 'Arc Demo - Complex';
  
  -- Delete all data for this entity (cascading will handle related records)
  DELETE FROM purchase_order_lines WHERE entity_id = complex_entity_id;
  DELETE FROM purchase_orders WHERE entity_id = complex_entity_id;
  DELETE FROM generation_runs WHERE entity_id = complex_entity_id;
  DELETE FROM boats WHERE entity_id = complex_entity_id;
  DELETE FROM supplier_parts WHERE entity_id = complex_entity_id;
  DELETE FROM parts WHERE entity_id = complex_entity_id;
  DELETE FROM suppliers WHERE entity_id = complex_entity_id;
END $$;

-- =============================================================================
-- PARTS (25+ parts for diverse boat manufacturing)
-- =============================================================================
INSERT INTO parts (entity_id, part_number, name, description, category, current_stock, unit_of_measure, unit_cost, reorder_point) VALUES
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'HULL-SM', 'Small Hull 18ft', 'Compact fiberglass hull', 'Structural', 12, 'EA', 5500.00, 6),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'HULL-MD', 'Medium Hull 22ft', 'Mid-size fiberglass hull', 'Structural', 8, 'EA', 8000.00, 4),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'HULL-LG', 'Large Hull 26ft', 'Large fiberglass hull', 'Structural', 5, 'EA', 12000.00, 3),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'DECK-SM', 'Small Deck Panel', 'Deck for 18ft boats', 'Structural', 15, 'EA', 2200.00, 8),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'DECK-MD', 'Medium Deck Panel', 'Deck for 22ft boats', 'Structural', 10, 'EA', 3200.00, 6),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'DECK-LG', 'Large Deck Panel', 'Deck for 26ft boats', 'Structural', 6, 'EA', 4500.00, 4),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'ENG-100', 'Outboard 100HP', 'Entry-level outboard', 'Propulsion', 10, 'EA', 8500.00, 6),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'ENG-150', 'Outboard 150HP', 'Mid-range outboard', 'Propulsion', 8, 'EA', 12000.00, 5),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'ENG-200', 'Outboard 200HP', 'High-performance outboard', 'Propulsion', 6, 'EA', 16500.00, 4),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'ENG-250', 'Outboard 250HP', 'Premium outboard', 'Propulsion', 4, 'EA', 21000.00, 3),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'PROP-13', 'Propeller 13"', 'Small propeller', 'Propulsion', 25, 'EA', 320.00, 15),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'PROP-15', 'Propeller 15"', 'Medium propeller', 'Propulsion', 20, 'EA', 450.00, 12),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'PROP-17', 'Propeller 17"', 'Large propeller', 'Propulsion', 15, 'EA', 580.00, 10),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'GPS-7', '7" GPS Display', 'Basic GPS chartplotter', 'Electronics', 18, 'EA', 850.00, 10),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'GPS-10', '10" GPS Display', 'Mid-range GPS chartplotter', 'Electronics', 12, 'EA', 1650.00, 8),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'GPS-12', '12" GPS Display', 'Premium GPS chartplotter', 'Electronics', 8, 'EA', 2400.00, 5),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'RADIO-VHF', 'VHF Radio', 'Marine communication radio', 'Electronics', 30, 'EA', 280.00, 18),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'RADIO-STEREO', 'Marine Stereo', 'Waterproof stereo system', 'Electronics', 25, 'EA', 420.00, 15),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'CONSOLE-SM', 'Small Console', 'Compact helm console', 'Interior', 14, 'EA', 1800.00, 8),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'CONSOLE-LG', 'Large Console', 'Full-size helm console', 'Interior', 10, 'EA', 3200.00, 6),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'SEAT-HELM', 'Helm Seat', 'Captain chair with suspension', 'Interior', 20, 'EA', 850.00, 12),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'SEAT-BENCH', 'Bench Seat', 'Padded bench seating', 'Interior', 18, 'EA', 1100.00, 10),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'SEAT-FOLD', 'Folding Seat', 'Collapsible seating', 'Interior', 22, 'EA', 650.00, 14),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'CANVAS-SM', 'Small Bimini Top', 'Sun cover for small boats', 'Exterior', 16, 'EA', 580.00, 10),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'CANVAS-LG', 'Large Bimini Top', 'Sun cover for large boats', 'Exterior', 12, 'EA', 880.00, 8),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'TANK-30', 'Fuel Tank 30gal', 'Small fuel capacity', 'Plumbing', 14, 'EA', 580.00, 8),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'TANK-60', 'Fuel Tank 60gal', 'Medium fuel capacity', 'Plumbing', 10, 'EA', 950.00, 6),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'TANK-100', 'Fuel Tank 100gal', 'Large fuel capacity', 'Plumbing', 6, 'EA', 1450.00, 4),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'PUMP-BILGE', 'Bilge Pump', 'Automatic bilge pump', 'Plumbing', 35, 'EA', 165.00, 20),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'ANCHOR-SM', 'Anchor 15lb', 'Small anchor with chain', 'Hardware', 30, 'EA', 145.00, 18),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'ANCHOR-LG', 'Anchor 35lb', 'Large anchor with chain', 'Hardware', 20, 'EA', 280.00, 12),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'CLEAT-6', '6" Cleat', 'Small dock cleat', 'Hardware', 60, 'EA', 28.00, 40),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'CLEAT-10', '10" Cleat', 'Large dock cleat', 'Hardware', 50, 'EA', 45.00, 30),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'ROD-HOLDER', 'Rod Holder', 'Fishing rod holder', 'Accessories', 45, 'EA', 42.00, 25),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'COOLER-SM', 'Small Cooler', '30qt built-in cooler', 'Accessories', 18, 'EA', 280.00, 12),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'COOLER-LG', 'Large Cooler', '65qt built-in cooler', 'Accessories', 12, 'EA', 450.00, 8),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'LIVEWELL', 'Live Well', 'Aerated live well system', 'Accessories', 10, 'EA', 680.00, 6),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'LIGHT-NAV', 'Navigation Lights', 'LED nav light set', 'Electrical', 40, 'SET', 185.00, 24),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'LIGHT-DECK', 'Deck Lighting', 'LED deck light kit', 'Electrical', 35, 'KIT', 220.00, 20),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'BATTERY-SM', 'Battery 12V Small', 'Starting battery', 'Electrical', 28, 'EA', 180.00, 16),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'BATTERY-LG', 'Battery 12V Large', 'Deep cycle battery', 'Electrical', 22, 'EA', 295.00, 14),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'SWITCH-PANEL', 'Switch Panel', 'Electrical control panel', 'Electrical', 32, 'EA', 240.00, 18),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'FENDER', 'Boat Fender', 'Inflatable fender', 'Accessories', 50, 'EA', 38.00, 30),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'LADDER', 'Swim Ladder', 'Telescoping swim ladder', 'Accessories', 25, 'EA', 165.00, 15),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'WINDSHIELD', 'Windshield', 'Acrylic windshield', 'Structural', 16, 'EA', 520.00, 10);

-- =============================================================================
-- SUPPLIERS (3 specialized suppliers)
-- =============================================================================
INSERT INTO suppliers (entity_id, name, contact_name, email, phone, address, rating, payment_terms, notes) VALUES
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'Coastal Marine Supply', 'Jennifer Martinez', 'orders@coastalmarine.com', '555-1000', '100 Harbor Dr, Miami, FL', 4.7, 'Net 30', 'Structural components specialist'),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'Marine Power Systems', 'David Lee', 'sales@marinepowersys.com', '555-2000', '200 Engine Way, Tampa, FL', 4.8, 'Net 30', 'Engines and propulsion'),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), 'Nautical Accessories Inc', 'Sarah Kim', 'info@nauticalacc.com', '555-3000', '300 Supply Rd, Fort Lauderdale, FL', 4.5, 'Net 30', 'Electronics and accessories');

-- =============================================================================
-- SUPPLIER_PARTS (Link all parts to appropriate suppliers)
-- =============================================================================
INSERT INTO supplier_parts (entity_id, supplier_id, part_id, lead_time_days, minimum_order_quantity, batch_size, price_per_unit, is_preferred, max_monthly_capacity) VALUES
-- Coastal Marine Supply (Structural & Interior)
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'HULL-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 1, 1, 5500.00, true, 40),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'HULL-MD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 6, 1, 1, 8000.00, true, 30),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'HULL-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 7, 1, 1, 12000.00, true, 20),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'DECK-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 4, 1, 1, 2200.00, true, 50),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'DECK-MD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 1, 1, 3200.00, true, 40),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'DECK-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 6, 1, 1, 4500.00, true, 30),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'CONSOLE-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 4, 2, 2, 1800.00, true, 50),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'CONSOLE-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 2, 2, 3200.00, true, 40),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 4, 4, 850.00, true, 60),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'SEAT-BENCH' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 4, 4, 1100.00, true, 60),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'SEAT-FOLD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 5, 5, 650.00, true, 70),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'CANVAS-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 4, 3, 3, 580.00, true, 50),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'CANVAS-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 3, 3, 880.00, true, 40),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Coastal Marine Supply' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'WINDSHIELD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 4, 2, 2, 520.00, true, 45),

-- Marine Power Systems (Engines & Propulsion)
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'ENG-100' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 6, 1, 1, 8500.00, true, 35),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'ENG-150' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 7, 1, 1, 12000.00, true, 30),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'ENG-200' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 7, 1, 1, 16500.00, true, 25),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'ENG-250' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 7, 1, 1, 21000.00, true, 20),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'PROP-13' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 8, 8, 320.00, true, 100),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'PROP-15' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 8, 8, 450.00, true, 100),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'PROP-17' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 8, 8, 580.00, true, 80),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'TANK-30' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 4, 3, 3, 580.00, true, 50),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'TANK-60' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 2, 2, 950.00, true, 40),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'TANK-100' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 2, 2, 1450.00, true, 30),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Marine Power Systems' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 10, 10, 165.00, true, 100),

-- Nautical Accessories Inc (Electronics & Accessories)
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'GPS-7' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 4, 3, 3, 850.00, true, 60),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'GPS-10' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 2, 2, 1650.00, true, 50),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'GPS-12' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 2, 2, 2400.00, true, 40),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 8, 8, 280.00, true, 80),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'RADIO-STEREO' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 8, 8, 420.00, true, 70),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'ANCHOR-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 2, 10, 10, 145.00, true, 100),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'ANCHOR-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 8, 8, 280.00, true, 80),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'CLEAT-6' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 2, 20, 20, 28.00, true, 200),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'CLEAT-10' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 2, 20, 20, 45.00, true, 150),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'ROD-HOLDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 2, 15, 15, 42.00, true, 120),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'COOLER-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 4, 5, 5, 280.00, true, 60),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'COOLER-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 4, 5, 5, 450.00, true, 50),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'LIVEWELL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 5, 3, 3, 680.00, true, 40),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 2, 12, 12, 185.00, true, 100),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'LIGHT-DECK' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 10, 10, 220.00, true, 90),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'BATTERY-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 10, 10, 180.00, true, 100),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'BATTERY-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 10, 10, 295.00, true, 80),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 8, 8, 240.00, true, 90),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 2, 20, 20, 38.00, true, 200),
((SELECT id FROM entities WHERE name = 'Arc Demo - Complex'), (SELECT id FROM suppliers WHERE name = 'Nautical Accessories Inc' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), (SELECT id FROM parts WHERE part_number = 'LADDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex')), 3, 8, 8, 165.00, true, 80);

-- =============================================================================
-- BOATS (5 different boat types, 6 of each type = 30 total boats)
-- Manufacturing time: 3-6 days per boat
-- Types: Bay Runner, Offshore Pro, Coastal Skiff, Flats Hunter, Family Cruiser
-- =============================================================================

DO $$
DECLARE
  complex_entity_id UUID;
  boat_id UUID;
  i INTEGER;
  boat_type TEXT;
  boat_model TEXT;
  mfg_days INTEGER;
  boat_counter INTEGER := 1;
BEGIN
  SELECT id INTO complex_entity_id FROM entities WHERE name = 'Arc Demo - Complex';
  
  -- Create 30 boats (6 of each of the 5 types)
  FOR i IN 1..30 LOOP
    -- Determine boat type (cycle through 5 types, 6 times each)
    CASE (i - 1) % 5
      WHEN 0 THEN 
        boat_type := 'Bay Runner';
        boat_model := 'BR-2200';
        mfg_days := 4;
      WHEN 1 THEN 
        boat_type := 'Offshore Pro';
        boat_model := 'OP-2600';
        mfg_days := 5;
      WHEN 2 THEN 
        boat_type := 'Coastal Skiff';
        boat_model := 'CS-1800';
        mfg_days := 3;
      WHEN 3 THEN 
        boat_type := 'Flats Hunter';
        boat_model := 'FH-2000';
        mfg_days := 4;
      ELSE 
        boat_type := 'Family Cruiser';
        boat_model := 'FC-2400';
        mfg_days := 6;
    END CASE;
    
    -- Calculate which number of this boat type we're on
    boat_counter := ((i - 1) / 5) + 1;
    
    INSERT INTO boats (entity_id, name, model, due_date, manufacturing_time_days, status, mbom, notes)
    VALUES (
      complex_entity_id,
      boat_type || ' ' || boat_counter,
      boat_model,
      CURRENT_DATE + (30 + (i - 1) * 3)::INTEGER,  -- Staggered every 3 days
      mfg_days,
      'scheduled',
      '{"parts": []}'::jsonb,
      'Production unit ' || boat_counter || ' of ' || boat_type || ' model'
    ) RETURNING id INTO boat_id;
    
    -- Add MBOM based on boat type (same for all boats of this type)
    CASE (i - 1) % 5
      -- Bay Runner: Medium size, fishing focused
      WHEN 0 THEN
        UPDATE boats SET mbom = jsonb_build_object(
          'parts', jsonb_build_array(
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-MD' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Medium Hull 22ft'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-MD' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Medium Deck Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-150' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Outboard 150HP'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-15' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Propeller 15"'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-10' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', '10" GPS Display'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'VHF Radio'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Console'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Helm Seat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-60' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 60gal'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIVEWELL' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Live Well'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ROD-HOLDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 6, 'part_name', 'Rod Holder'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Cooler'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Anchor 15lb'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-6' AND entity_id = complex_entity_id)::text, 'quantity_required', 4, 'part_name', '6" Cleat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Bilge Pump'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Battery 12V Small'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 4, 'part_name', 'Boat Fender')
          )
        ) WHERE id = boat_id;
      
      -- Offshore Pro: Larger, more features, dual engines
      WHEN 1 THEN
        UPDATE boats SET mbom = jsonb_build_object(
          'parts', jsonb_build_array(
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Hull 26ft'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Deck Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-200' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Outboard 200HP'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-17' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Propeller 17"'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-12' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', '12" GPS Display'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'VHF Radio'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-STEREO' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Marine Stereo'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Console'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Helm Seat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-FOLD' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Folding Seat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Bimini Top'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-100' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 100gal'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIVEWELL' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Live Well'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ROD-HOLDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 8, 'part_name', 'Rod Holder'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Cooler'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'WINDSHIELD' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Windshield'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Anchor 35lb'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-10' AND entity_id = complex_entity_id)::text, 'quantity_required', 6, 'part_name', '10" Cleat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Bilge Pump'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-DECK' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Deck Lighting'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 3, 'part_name', 'Battery 12V Large'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LADDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Swim Ladder'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 6, 'part_name', 'Boat Fender')
          )
        ) WHERE id = boat_id;
      
      -- Coastal Skiff: Small, simple, minimal
      WHEN 2 THEN
        UPDATE boats SET mbom = jsonb_build_object(
          'parts', jsonb_build_array(
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Hull 18ft'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Deck Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-100' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Outboard 100HP'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-13' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Propeller 13"'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-7' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', '7" GPS Display'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Console'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Helm Seat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-30' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 30gal'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Cooler'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Anchor 15lb'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-6' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', '6" Cleat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Bilge Pump'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Battery 12V Small'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Boat Fender')
          )
        ) WHERE id = boat_id;
      
      -- Flats Hunter: Medium, shallow water fishing
      WHEN 3 THEN
        UPDATE boats SET mbom = jsonb_build_object(
          'parts', jsonb_build_array(
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-MD' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Medium Hull 22ft'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-MD' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Medium Deck Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-100' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Outboard 100HP'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-15' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Propeller 15"'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-10' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', '10" GPS Display'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'VHF Radio'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Console'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Helm Seat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Bimini Top'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-30' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 30gal'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIVEWELL' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Live Well'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ROD-HOLDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 4, 'part_name', 'Rod Holder'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Small Cooler'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Anchor 15lb'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-6' AND entity_id = complex_entity_id)::text, 'quantity_required', 4, 'part_name', '6" Cleat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Bilge Pump'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-SM' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Battery 12V Small'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 4, 'part_name', 'Boat Fender')
          )
        ) WHERE id = boat_id;
      
      -- Family Cruiser: Large, family/recreation focused
      ELSE
        UPDATE boats SET mbom = jsonb_build_object(
          'parts', jsonb_build_array(
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Hull 26ft'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Deck Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-250' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Outboard 250HP'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-17' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Propeller 17"'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-12' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', '12" GPS Display'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'VHF Radio'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-STEREO' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Marine Stereo'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Console'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Helm Seat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-BENCH' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Bench Seat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-FOLD' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Folding Seat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Large Bimini Top'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-100' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 100gal'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Large Cooler'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'WINDSHIELD' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Windshield'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Anchor 35lb'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-10' AND entity_id = complex_entity_id)::text, 'quantity_required', 6, 'part_name', '10" Cleat'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Bilge Pump'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-DECK' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Deck Lighting'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-LG' AND entity_id = complex_entity_id)::text, 'quantity_required', 2, 'part_name', 'Battery 12V Large'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LADDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 1, 'part_name', 'Swim Ladder'),
            jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = complex_entity_id)::text, 'quantity_required', 6, 'part_name', 'Boat Fender')
          )
        ) WHERE id = boat_id;
    END CASE;
  END LOOP;
END $$;

COMMENT ON TABLE boats IS 'Production schedule with 5 boat types (6 units each): Bay Runner, Offshore Pro, Coastal Skiff, Flats Hunter, Family Cruiser';
