-- Arc PO Demo - Seed Boat Types for Complex Entity
-- Create 5 boat types and 30 production units (6 of each type)

-- =============================================================================
-- DELETE EXISTING BOAT TYPES AND BOATS FOR COMPLEX ENTITY
-- =============================================================================
DO $$
DECLARE
  complex_entity_id UUID;
BEGIN
  SELECT id INTO complex_entity_id FROM entities WHERE name = 'Arc Demo - Complex';
  
  -- Delete boats first (they reference boat_types)
  DELETE FROM boats WHERE entity_id = complex_entity_id;
  DELETE FROM boat_types WHERE entity_id = complex_entity_id;
END $$;

-- =============================================================================
-- BOAT TYPES (5 different boat templates)
-- =============================================================================

-- Type 1: Coastal Skiff (Small, simple)
INSERT INTO boat_types (entity_id, name, model, description, default_manufacturing_time_days, is_active, mbom)
VALUES (
  (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'),
  'Coastal Skiff',
  'CS-1800',
  'Compact 18ft skiff for shallow water fishing and cruising',
  3,
  true,
  jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Hull 18ft'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Deck Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-100' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Outboard 100HP'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-13' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Propeller 13"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-7' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', '7" GPS Display'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Console'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Helm Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-30' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 30gal'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Cooler'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Anchor 15lb'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-6' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', '6" Cleat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Bilge Pump'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Battery 12V Small'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Boat Fender')
    )
  )
);

-- Type 2: Flats Hunter (Medium, fishing)
INSERT INTO boat_types (entity_id, name, model, description, default_manufacturing_time_days, is_active, mbom)
VALUES (
  (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'),
  'Flats Hunter',
  'FH-2000',
  'Shallow draft 20ft fishing boat designed for flats fishing',
  4,
  true,
  jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-MD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Medium Hull 22ft'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-MD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Medium Deck Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-100' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Outboard 100HP'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-15' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Propeller 15"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-10' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', '10" GPS Display'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'VHF Radio'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Console'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Helm Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Bimini Top'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-30' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 30gal'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIVEWELL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Live Well'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ROD-HOLDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 4, 'part_name', 'Rod Holder'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Cooler'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Anchor 15lb'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-6' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 4, 'part_name', '6" Cleat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Bilge Pump'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Battery 12V Small'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 4, 'part_name', 'Boat Fender')
    )
  )
);

-- Type 3: Bay Runner (Medium, versatile fishing)
INSERT INTO boat_types (entity_id, name, model, description, default_manufacturing_time_days, is_active, mbom)
VALUES (
  (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'),
  'Bay Runner',
  'BR-2200',
  'Versatile 22ft bay boat for fishing and cruising',
  4,
  true,
  jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-MD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Medium Hull 22ft'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-MD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Medium Deck Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-150' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Outboard 150HP'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-15' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Propeller 15"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-10' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', '10" GPS Display'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'VHF Radio'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Console'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Helm Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-60' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 60gal'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIVEWELL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Live Well'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ROD-HOLDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 6, 'part_name', 'Rod Holder'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Small Cooler'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Anchor 15lb'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-6' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 4, 'part_name', '6" Cleat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Bilge Pump'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-SM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Battery 12V Small'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 4, 'part_name', 'Boat Fender')
    )
  )
);

-- Type 4: Family Cruiser (Large, family/recreation)
INSERT INTO boat_types (entity_id, name, model, description, default_manufacturing_time_days, is_active, mbom)
VALUES (
  (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'),
  'Family Cruiser',
  'FC-2400',
  'Spacious 24ft boat for family outings and entertaining',
  6,
  true,
  jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Hull 26ft'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Deck Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-250' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Outboard 250HP'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-17' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Propeller 17"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-12' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', '12" GPS Display'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'VHF Radio'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-STEREO' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Marine Stereo'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Console'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Helm Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-BENCH' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Bench Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-FOLD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Folding Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Bimini Top'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-100' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 100gal'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Large Cooler'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'WINDSHIELD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Windshield'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Anchor 35lb'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-10' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 6, 'part_name', '10" Cleat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Bilge Pump'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-DECK' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Deck Lighting'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Battery 12V Large'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LADDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Swim Ladder'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 6, 'part_name', 'Boat Fender')
    )
  )
);

-- Type 5: Offshore Pro (Large, offshore fishing, dual engines)
INSERT INTO boat_types (entity_id, name, model, description, default_manufacturing_time_days, is_active, mbom)
VALUES (
  (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'),
  'Offshore Pro',
  'OP-2600',
  'Premium 26ft offshore fishing boat with twin engines',
  5,
  true,
  jsonb_build_object(
    'parts', jsonb_build_array(
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'HULL-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Hull 26ft'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'DECK-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Deck Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ENG-200' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Outboard 200HP'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PROP-17' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Propeller 17"'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'GPS-12' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', '12" GPS Display'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-VHF' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'VHF Radio'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'RADIO-STEREO' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Marine Stereo'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CONSOLE-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Console'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-HELM' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Helm Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SEAT-FOLD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Folding Seat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CANVAS-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Bimini Top'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'TANK-100' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Fuel Tank 100gal'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIVEWELL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Live Well'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ROD-HOLDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 8, 'part_name', 'Rod Holder'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'COOLER-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Large Cooler'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'WINDSHIELD' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Windshield'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'ANCHOR-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Anchor 35lb'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'CLEAT-10' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 6, 'part_name', '10" Cleat'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'PUMP-BILGE' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 2, 'part_name', 'Bilge Pump'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-NAV' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Navigation Lights'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LIGHT-DECK' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Deck Lighting'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'BATTERY-LG' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 3, 'part_name', 'Battery 12V Large'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'SWITCH-PANEL' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Switch Panel'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'LADDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 1, 'part_name', 'Swim Ladder'),
      jsonb_build_object('part_id', (SELECT id FROM parts WHERE part_number = 'FENDER' AND entity_id = (SELECT id FROM entities WHERE name = 'Arc Demo - Complex'))::text, 'quantity_required', 6, 'part_name', 'Boat Fender')
    )
  )
);

-- =============================================================================
-- PRODUCTION UNITS (30 boats: 6 of each type)
-- Scheduled over 3 months with staggered due dates
-- =============================================================================

DO $$
DECLARE
  complex_entity_id UUID;
  type_record RECORD;
  i INTEGER;
  unit_number INTEGER;
  due_date DATE;
BEGIN
  SELECT id INTO complex_entity_id FROM entities WHERE name = 'Arc Demo - Complex';
  
  -- For each boat type, create 6 production units
  FOR type_record IN 
    SELECT id, name, model, default_manufacturing_time_days
    FROM boat_types 
    WHERE entity_id = complex_entity_id
    ORDER BY model
  LOOP
    FOR i IN 1..6 LOOP
      -- Calculate unit number across all types (1-30)
      unit_number := (
        SELECT COUNT(*) 
        FROM boat_types bt2 
        WHERE bt2.entity_id = complex_entity_id 
        AND bt2.model < type_record.model
      ) * 6 + i;
      
      -- Stagger due dates every 3 days starting 30 days from now
      due_date := CURRENT_DATE + (30 + (unit_number - 1) * 3)::INTEGER;
      
      INSERT INTO boats (
        entity_id,
        boat_type_id,
        name,
        model,
        due_date,
        manufacturing_time_days,
        status,
        mbom,
        notes
      ) VALUES (
        complex_entity_id,
        type_record.id,
        type_record.name || ' Unit #' || i,
        type_record.model,
        due_date,
        type_record.default_manufacturing_time_days,
        'scheduled',
        '{"parts": []}'::jsonb,  -- Production units inherit MBOM from type
        'Production unit ' || i || ' of 6 for ' || type_record.name
      );
    END LOOP;
  END LOOP;
END $$;

COMMENT ON TABLE boat_types IS 'Boat type templates with editable MBOMs. These define the standard configuration for each model.';
COMMENT ON TABLE boats IS 'Individual production units scheduled for manufacturing. Each references a boat_type for its MBOM template.';
