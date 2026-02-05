# Database Rebuild Instructions

Run these SQL files **in order** in your Supabase SQL Editor:

## Step 1: Initial Schema
**File:** `migrations/00000000000000_initial_schema.sql`

Creates:
- Helper functions (update_updated_at_column)
- Base tables: parts, suppliers, supplier_parts, boats, generation_runs, purchase_orders, purchase_order_lines
- Indexes and RLS policies
- PO number generation function

## Step 2: Seed Data
**File:** `migrations/00000000000001_seed_data.sql`

Creates:
- 20 boat parts (hulls, engines, electronics, hardware, etc.)
- 5 suppliers with different specialties
- Supplier-part relationships with pricing and lead times
- 3 scheduled boats with MBOMs (Material Bills of Materials)

## Step 3: Add Entity Support
**File:** `migrations/20260204000000_add_entities.sql`

Creates:
- entities table
- Adds entity_id to all existing tables
- Creates Entity 1: "Arc Demo - Complex" (gets all existing data)
- Adds entity-aware constraints and views
- Updates PO number generation to be entity-aware

## Step 4: Add Second Entity
**File:** `migrations/20260204000001_seed_additional_entities.sql`

Creates:
- Entity 2: "Arc Demo - Simple" (empty, ready for new data)

---

## Quick Run (Copy-Paste)

If you want to run everything at once, you can concatenate all files in order.

## What You'll Have After Running All Migrations:

### Entities:
- **Arc Demo - Complex**: Contains all the seed data (20 parts, 5 suppliers, 3 boats)
- **Arc Demo - Simple**: Empty entity ready for minimal data

### In "Arc Demo - Complex" Entity:
- ✅ 20 parts in inventory (engines, hulls, electronics, hardware)
- ✅ 5 suppliers with different lead times
- ✅ 3 boats scheduled (90, 120, 180 days out)
- ✅ Supplier-part relationships configured
- ✅ Ready to generate purchase orders!

---

## Verification Queries

After running all migrations, verify with these queries:

```sql
-- Check entities
SELECT * FROM entities ORDER BY name;

-- Check parts count by entity
SELECT e.name, COUNT(p.id) as part_count
FROM entities e
LEFT JOIN parts p ON p.entity_id = e.id
GROUP BY e.name
ORDER BY e.name;

-- Check boats scheduled
SELECT e.name as entity, b.name as boat, b.model, b.due_date, b.status
FROM boats b
JOIN entities e ON b.entity_id = e.id
ORDER BY e.name, b.due_date;

-- Check suppliers
SELECT e.name as entity, s.name as supplier, s.contact_name, s.email
FROM suppliers s
JOIN entities e ON s.entity_id = e.id
ORDER BY e.name, s.name;
```

---

## Troubleshooting

If you get an error:
1. Make sure you ran `reset_database.sql` first to clean everything
2. Run migrations in the exact order listed above
3. Check for any error messages and verify the previous step completed successfully

## Need to Start Over?

Run `reset_database.sql` to drop all tables, then run these migrations again in order.
