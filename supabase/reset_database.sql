-- Reset Database - Drop all tables and start fresh
-- WARNING: This will delete ALL data in your database
-- Run this in Supabase SQL Editor before running migrations

-- Drop all views first (they depend on tables)
DROP VIEW IF EXISTS purchase_orders_with_entity CASCADE;
DROP VIEW IF EXISTS boats_with_entity CASCADE;
DROP VIEW IF EXISTS suppliers_with_entity CASCADE;
DROP VIEW IF EXISTS parts_with_entity CASCADE;

-- Drop all tables in reverse order of dependencies
DROP TABLE IF EXISTS purchase_order_lines CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS generation_runs CASCADE;
DROP TABLE IF EXISTS supplier_parts CASCADE;
DROP TABLE IF EXISTS boats CASCADE;
DROP TABLE IF EXISTS parts CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS entities CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_po_number(UUID) CASCADE;
DROP FUNCTION IF EXISTS set_po_number() CASCADE;

-- Now you can run your migrations from the beginning
