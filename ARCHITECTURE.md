# Arc PO Demo - System Architecture

## Executive Summary

This application demonstrates an intelligent Purchase Order (PO) automation system that ingests production schedules, inventory data, and supplier information to automatically generate optimally-timed purchase orders. The system distributes orders across multiple months while managing volume constraints and lead times.

**Multi-Entity Architecture**: The system supports multiple independent business entities, each with completely siloed data at the database level. Each entity can manage its own parts, suppliers, production schedules, and purchase orders without any data crossover.

## Core Value Proposition

**Problem**: Manufacturers struggle to manually calculate when and how much to order from suppliers to meet production schedules while managing cash flow and inventory levels.

**Solution**: Automated PO generation that:
- Ensures parts arrive just-in-time for production
- Distributes order volume across multiple months
- Respects supplier batch sizes and lead times
- Optimizes for cost and inventory management
- **Supports multiple business entities with complete data isolation**

## System Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Hosting**: Vercel
- **UI Components**: React with TypeScript
- **Styling**: Tailwind CSS (minimalist black & white design)
- **State Management**: React Context for entity selection and global state
- **Entity Management**: EntityProvider context for managing selected entity across the application

#### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (optional for demo)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (for file uploads if needed)

#### Computation Engine
- **Option 1 (Recommended for Demo)**: Supabase Edge Functions
  - Serverless functions deployed to Deno runtime
  - Can handle complex PO generation algorithms
  - Direct database access
  - Fast cold starts
  
- **Option 2 (Alternative)**: Vercel Serverless Functions
  - API routes in Next.js
  - Good for lighter computation
  - Easy integration with frontend

- **Option 3 (Production Scale)**: Separate compute service
  - AWS Lambda or Google Cloud Functions
  - For heavy optimization algorithms
  - Can use Python for complex OR (Operations Research) libraries

**Recommendation**: Start with Supabase Edge Functions for the demo. They provide sufficient compute power for the algorithm and keep the architecture simple.

## Data Model

### 0. Entities (Multi-Tenancy)

```typescript
interface Entity {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

**Database Table**: `entities`
- Primary key: `id`
- All other tables reference this via `entity_id` foreign key
- Provides complete data isolation between business entities
- Entity selector in UI allows switching between different entities
- Each entity maintains separate: parts, suppliers, boats, POs, etc.

**Data Isolation Strategy**:
- All tables include `entity_id` column with NOT NULL constraint
- Database-level enforcement ensures no data mixing
- Queries automatically filter by selected entity
- RLS policies can be configured for additional security

### 1. Boats (Production Schedule)

```typescript
interface Boat {
  id: string;
  entity_id: string; // Foreign key to entities table
  name: string;
  model: string;
  due_date: Date;
  manufacturing_time_days: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  mbom: MBOM;
  created_at: Date;
  updated_at: Date;
}

interface MBOM {
  boat_id: string;
  parts: MBOMPart[];
}

interface MBOMPart {
  part_id: string;
  quantity_required: number;
  part_name: string; // denormalized for display
}
```

**Database Table**: `boats`
- Primary key: `id`
- Foreign key: `entity_id` references `entities(id)`
- Includes JSONB column for `mbom` data
- Indexed on `due_date` and `entity_id` for query performance

### 2. Parts (Inventory)

```typescript
interface Part {
  id: string;
  entity_id: string; // Foreign key to entities table
  part_number: string;
  name: string;
  description: string;
  category: string;
  current_stock: number;
  unit_of_measure: string;
  unit_cost: number;
  reorder_point: number; // minimum stock level
  created_at: Date;
  updated_at: Date;
}
```

**Database Table**: `parts`
- Primary key: `id`
- Unique index on `part_number`

### 3. Suppliers

```typescript
interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  payment_terms: string;
  notes: string;
  created_at: Date;
  updated_at: Date;
}
```

**Database Table**: `suppliers`

### 4. Supplier Parts (Junction Table with Details)

```typescript
interface SupplierPart {
  id: string;
  supplier_id: string;
  part_id: string;
  lead_time_days: number;
  minimum_order_quantity: number;
  batch_size: number; // parts per batch/package
  price_per_unit: number;
  is_preferred: boolean;
  max_monthly_capacity: number | null; // optional volume constraint
  created_at: Date;
  updated_at: Date;
}
```

**Database Table**: `supplier_parts`
- Composite unique index on `(supplier_id, part_id)`

### 5. Purchase Orders (Generated Output)

```typescript
interface PurchaseOrder {
  id: string;
  po_number: string; // auto-generated
  supplier_id: string;
  order_date: Date;
  required_by_date: Date;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received';
  total_amount: number;
  notes: string;
  generated_by_system: boolean;
  generation_run_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface PurchaseOrderLine {
  id: string;
  po_id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string;
  linked_boat_ids: string[]; // which boats need this
}
```

**Database Tables**: `purchase_orders`, `purchase_order_lines`

### 6. Generation Runs (Audit Trail)

```typescript
interface GenerationRun {
  id: string;
  run_date: Date;
  parameters: GenerationParameters;
  total_pos_generated: number;
  total_amount: number;
  status: 'running' | 'completed' | 'failed';
  error_message: string | null;
  execution_time_ms: number;
  created_at: Date;
}

interface GenerationParameters {
  planning_horizon_months: number;
  max_pos_per_supplier_per_month: number;
  prefer_batch_optimization: boolean;
  safety_stock_percentage: number;
}
```

**Database Table**: `generation_runs`

## Core Algorithm: PO Generation Logic

### High-Level Flow

1. **Analyze Production Schedule**
   - Extract all boats and their MBOMs
   - Calculate required parts and quantities
   - Work backwards from due dates to determine "need by" dates

2. **Calculate Net Requirements**
   - For each part, sum total requirements across all boats
   - Subtract current inventory
   - Group requirements by time windows
   - Add safety stock buffer (e.g., 10%)

3. **Match with Suppliers**
   - For each required part, identify suppliers
   - Select preferred suppliers or best price/lead time
   - Consider batch sizes and MOQs

4. **Generate PO Schedule**
   - Calculate order dates by working backwards from "need by" dates using lead times
   - Distribute large orders across multiple months
   - Respect monthly volume constraints
   - Optimize for batch sizes to minimize waste

5. **Create PO Records**
   - Generate PO numbers
   - Group parts by supplier and delivery month
   - Calculate totals
   - Save to database with audit trail

### Algorithm Pseudocode

```
function generatePurchaseOrders(parameters):
  run = createGenerationRun(parameters)
  
  // 1. Get all scheduled boats
  boats = getScheduledBoats()
  
  // 2. Calculate requirements
  requirements = []
  for each boat in boats:
    needByDate = boat.due_date - boat.manufacturing_time_days
    for each part in boat.mbom:
      requirements.push({
        part_id: part.part_id,
        quantity: part.quantity_required,
        need_by_date: needByDate,
        boat_id: boat.id
      })
  
  // 3. Aggregate and net against inventory
  netRequirements = aggregateByPart(requirements)
  for each req in netRequirements:
    currentStock = getPart(req.part_id).current_stock
    req.net_quantity = max(0, req.quantity - currentStock)
    req.net_quantity *= (1 + parameters.safety_stock_percentage)
  
  // 4. Create PO schedule
  poSchedule = []
  for each req in netRequirements where req.net_quantity > 0:
    supplierPart = selectSupplier(req.part_id)
    
    // Calculate order date
    orderDate = req.need_by_date - supplierPart.lead_time_days - BUFFER_DAYS
    
    // Round up to batch sizes
    batchesNeeded = ceiling(req.net_quantity / supplierPart.batch_size)
    orderQuantity = batchesNeeded * supplierPart.batch_size
    
    // Check if we need to split across months
    if shouldSplitOrder(orderQuantity, supplierPart):
      splitOrders = distributeAcrossMonths(
        orderQuantity, 
        orderDate,
        parameters.planning_horizon_months,
        supplierPart.max_monthly_capacity
      )
      poSchedule.push(...splitOrders)
    else:
      poSchedule.push({
        supplier_id: supplierPart.supplier_id,
        part_id: req.part_id,
        quantity: orderQuantity,
        order_date: orderDate,
        required_by_date: req.need_by_date,
        boat_ids: req.boat_ids
      })
  
  // 5. Group by supplier and month, create POs
  groupedOrders = groupBy(poSchedule, [supplier_id, orderMonth])
  
  for each group in groupedOrders:
    po = createPurchaseOrder({
      supplier_id: group.supplier_id,
      order_date: group.month_start,
      lines: group.parts
    })
    savePurchaseOrder(po)
  
  completeGenerationRun(run)
  return run
```

## Application Features & Pages

### Navigation Structure

```
┌─────────────────────────────────────────┐
│         Arc PO Demo                     │
├─────────────────────────────────────────┤
│ 🏠 Dashboard                            │
│ 🚤 Boats (Production Schedule)          │
│ 📦 Parts (Inventory)                    │
│ 🏭 Suppliers                            │
│ 🔗 Supplier Parts                       │
│ 📋 Purchase Orders                      │
│ ⚡ Generate POs (Demo)                  │
│ 📊 Analytics (Optional)                 │
└─────────────────────────────────────────┘
```

### 1. Dashboard (Home Page)
- Overview metrics:
  - Total boats scheduled
  - Current inventory value
  - Active suppliers
  - Recent POs generated
- Quick actions
- Recent activity feed

### 2. Boats Management
**CRUD Interface for Production Schedule**

Features:
- List view: Table of all boats with due dates, status
- Create/Edit form:
  - Basic boat info (name, model, due date, manufacturing time)
  - MBOM builder: Add/remove parts with quantities
  - Part selector with autocomplete
- Delete with confirmation
- Import from CSV (bonus feature)

### 3. Parts Management
**Inventory Management Interface**

Features:
- List view: Searchable/filterable table
  - Display current stock levels
  - Highlight low stock (below reorder point)
- Create/Edit form:
  - Part details
  - Current stock quantity
  - Reorder point
- Bulk import (bonus)

### 4. Suppliers Management
**Supplier Directory**

Features:
- Card or table view of suppliers
- Create/Edit supplier form
- Contact information
- Rating system
- Delete with cascade warning

### 5. Supplier Parts
**Junction Table Management**

Features:
- List view grouped by supplier or part
- Create/Edit form:
  - Select supplier and part
  - Enter lead time, batch size, MOQ
  - Pricing information
  - Capacity constraints
- "Quick add" workflow for adding multiple parts to a supplier

### 6. Purchase Orders
**View Generated POs**

Features:
- List view with filters:
  - By supplier
  - By date range
  - By status
- Detail view:
  - PO header information
  - Line items with part details
  - Total calculations
  - Linked boats (traceability)
- Export to PDF (bonus)
- Manual PO creation (optional)

### 7. Generate POs (Main Demo Page)
**The Showcase Feature**

Layout:
```
┌─────────────────────────────────────────┐
│  Generate Purchase Orders               │
├─────────────────────────────────────────┤
│                                         │
│  [Configuration Panel]                  │
│  ┌───────────────────────────────────┐  │
│  │ Planning Horizon: [3] months      │  │
│  │ Max POs per supplier/month: [5]   │  │
│  │ Safety Stock: [10]%               │  │
│  │ Optimize for batches: [✓]         │  │
│  │                                   │  │
│  │      [Clear Old POs] [Generate]   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Status Panel]                         │
│  ┌───────────────────────────────────┐  │
│  │ ⚙️ Running analysis...            │  │
│  │ ✓ Analyzed 5 boats                │  │
│  │ ✓ Calculated requirements          │  │
│  │ ⚙️ Generating POs...               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Results Panel]                        │
│  ┌───────────────────────────────────┐  │
│  │ Generated 12 Purchase Orders       │  │
│  │ Total Value: $45,320               │  │
│  │ Suppliers: 5                       │  │
│  │ Execution Time: 234ms              │  │
│  │                                   │  │
│  │ [View POs] [Export Report]        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Visualization]                        │
│  ┌───────────────────────────────────┐  │
│  │  Timeline chart showing:           │  │
│  │  - Boats due dates                 │  │
│  │  - PO order dates                  │  │
│  │  - Lead times                      │  │
│  │  - Parts arrival dates             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Workflow:
1. User configures parameters
2. Clicks "Generate"
3. System calls Supabase Edge Function
4. Real-time status updates (via polling or websocket)
5. Results display with visualization
6. Navigate to PO list to see details

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Supabase project
- [ ] Create database schema and tables
- [ ] Set up Next.js project structure
- [ ] Implement basic navigation
- [ ] Create reusable UI components (tables, forms, buttons)

### Phase 2: Data Management (Week 2)
- [ ] Implement Parts CRUD
- [ ] Implement Suppliers CRUD
- [ ] Implement Supplier Parts CRUD
- [ ] Implement Boats CRUD with MBOM builder
- [ ] Add sample/seed data

### Phase 3: Core Algorithm (Week 3)
- [ ] Develop PO generation algorithm
- [ ] Implement as Supabase Edge Function
- [ ] Test with various scenarios
- [ ] Add error handling and validation

### Phase 4: Demo Page (Week 4)
- [ ] Build Generate POs interface
- [ ] Implement real-time status updates
- [ ] Create PO list and detail views
- [ ] Add timeline visualization
- [ ] Implement generation runs audit trail

### Phase 5: Polish (Week 5)
- [ ] Add loading states and error handling
- [ ] Improve UI/UX
- [ ] Add data validation
- [ ] Performance optimization
- [ ] Documentation and help text
- [ ] Deploy to Vercel

## Technical Considerations

### Supabase Setup

**Row Level Security (RLS)**: For demo, can disable or use simple policies. For production, implement proper policies.

**Database Functions**: Consider creating PostgreSQL functions for complex queries.

**Indexes**: Add indexes on:
- `boats.due_date`
- `purchase_orders.supplier_id`
- `purchase_orders.order_date`
- `supplier_parts` composite keys

### Edge Function Structure

```typescript
// supabase/functions/generate-pos/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )
  
  const { parameters } = await req.json()
  
  try {
    // Run algorithm
    const result = await generatePOs(supabase, parameters)
    
    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

### Frontend API Integration

```typescript
// lib/api/generate-pos.ts

export async function generatePurchaseOrders(parameters: GenerationParameters) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-pos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ parameters })
    }
  )
  
  return response.json()
}
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│  Users (Browser)                                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  Vercel Edge Network                                │
│  ┌───────────────────────────────────────────────┐  │
│  │  Next.js App (Static + SSR)                   │  │
│  └───────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────┐
│  Supabase                                           │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  PostgreSQL DB   │  │  Edge Functions  │        │
│  │  - All tables    │  │  - generate-pos  │        │
│  │  - Indexes       │  │                  │        │
│  │  - RLS policies  │  │                  │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  Auth            │  │  Storage         │        │
│  │  (optional)      │  │  (optional)      │        │
│  └──────────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────┘
```

## Future Enhancements

1. **Optimization Algorithm Improvements**
   - Multi-objective optimization (cost, lead time, reliability)
   - ML-based demand forecasting
   - Supplier performance tracking

2. **Advanced Features**
   - Email notifications for PO approvals
   - Integration with supplier APIs
   - Real-time inventory tracking
   - What-if scenario analysis
   - Constraint satisfaction solver for complex cases

3. **Reporting & Analytics**
   - Cost analysis reports
   - Supplier performance dashboards
   - Inventory turnover metrics
   - Lead time trends

4. **Production Features**
   - User authentication and roles
   - Multi-tenant support
   - Audit logs
   - Backup and disaster recovery
   - API for integration

## Success Metrics

For the demo, success means:
- ✅ Can add boats with MBOMs easily
- ✅ Can manage parts inventory
- ✅ Can configure suppliers with lead times
- ✅ Generate POs button produces accurate results in <2 seconds
- ✅ Generated POs are logically correct (parts arrive before needed)
- ✅ UI is clean and professional
- ✅ Demo tells a clear story

## Sample Demo Scenario

**Setup Data:**
1. 3 boat models scheduled over 6 months
2. 20 different parts in inventory
3. 5 suppliers with varying lead times (7-45 days)
4. Some parts already in stock, others at zero

**Demo Flow:**
1. Show production schedule (boats page)
2. Show current inventory (low stock on key items)
3. Show supplier information
4. Navigate to Generate POs page
5. Configure: 3-month horizon, 10% safety stock
6. Click Generate
7. Watch progress indicators
8. Show results: 8 POs generated across 4 suppliers
9. Navigate to PO detail - show traceability to boats
10. Show timeline visualization

**Key Talking Points:**
- "Notice how orders are scheduled to arrive just-in-time"
- "The system respected batch sizes - ordered in multiples"
- "Orders are distributed across months to manage cash flow"
- "Full traceability: which parts for which boats"

---

## Questions to Address Before Development

1. **Data Volume**: How many boats/parts in a typical production schedule?
2. **Constraints**: Are there hard constraints (must-use suppliers, max spending per month)?
3. **Complexity**: Should we handle partial deliveries or supplier substitutions?
4. **Timeline**: When does this need to be demo-ready?
5. **Audience**: Who will see this demo? (Technical, business stakeholders, investors?)

---

*This architecture provides a solid foundation for a compelling demo while remaining scalable for production use.*
