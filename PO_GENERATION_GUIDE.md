# Purchase Order Generation System

## Overview

The PO Generation system automatically creates optimized purchase orders based on your production schedule, current inventory, and supplier information. It implements a sophisticated algorithm that ensures parts arrive just-in-time for manufacturing while respecting supplier constraints.

## How It Works

### Algorithm Flow

1. **Analyze Production Schedule**
   - Retrieves all boats with status "scheduled" or "in_progress"
   - Extracts MBOM (Manufacturing Bill of Materials) from each boat
   - Calculates "need by" dates by working backwards from due dates

2. **Calculate Requirements**
   - Aggregates part requirements across all boats
   - Groups by part and need-by date
   - Combines requirements for the same part needed on the same date

3. **Net Against Inventory**
   - Retrieves current stock levels for all required parts
   - Subtracts available inventory from requirements
   - Applies safety stock percentage as buffer (default 10%)
   - Only creates POs for parts with net requirements > 0

4. **Match With Suppliers**
   - Finds suppliers for each required part
   - Prioritizes preferred suppliers
   - Falls back to lowest price if no preferred supplier
   - Validates supplier has the part available

5. **Calculate Order Dates**
   - Works backwards from need-by date
   - Accounts for supplier lead time
   - Adds buffer days (3 days) for safety
   - Ensures orders are placed with sufficient time

6. **Optimize Order Quantities**
   - Rounds up to supplier batch sizes (if optimization enabled)
   - Ensures minimum order quantities are met
   - Splits large orders across months if supplier has capacity limits
   - Minimizes waste while meeting requirements

7. **Group and Create POs**
   - Groups line items by supplier and month
   - Creates one PO per supplier per month
   - Calculates totals automatically
   - Links to boats that need the parts for traceability

## Configuration Parameters

### Planning Horizon (months)
- **Range**: 1-12 months
- **Default**: 3 months
- **Purpose**: Defines how far ahead to plan for future production
- Currently used for informational purposes; orders are created as needed

### Max POs per Supplier per Month
- **Range**: 1-20
- **Default**: 5
- **Purpose**: Limits the number of separate POs created for each supplier per month
- Currently grouped by month, so typically results in 1 PO per supplier per month

### Safety Stock Percentage
- **Range**: 0-100%
- **Default**: 10%
- **Purpose**: Adds a buffer to requirements to prevent stockouts
- Example: If 100 parts needed, 10% safety stock means ordering 110 parts

### Optimize for Batch Sizes
- **Type**: Boolean checkbox
- **Default**: Enabled
- **Purpose**: Rounds order quantities up to supplier batch sizes
- Example: If batch size is 5 and need 7 parts, orders 10 parts (2 batches)

## Using the System

### Prerequisites

Before generating POs, ensure you have:

1. **Parts** - At least one part in the parts table with current stock level
2. **Suppliers** - At least one supplier in the suppliers table
3. **Supplier Parts** - Relationships between suppliers and parts with:
   - Lead time (days)
   - Batch size
   - Minimum order quantity
   - Price per unit
4. **Boats** - At least one boat with:
   - Status: "scheduled" or "in_progress"
   - Due date
   - Manufacturing time (days)
   - MBOM with parts and quantities

### Generation Process

1. Navigate to **Generate POs** page
2. Adjust configuration parameters if needed
3. Click **"Generate Purchase Orders"**
4. Monitor status messages during generation
5. Review results summary
6. Click **"View Purchase Orders"** to see generated POs

### Status Messages

During generation, you'll see status messages indicating:
- Starting generation
- Analyzing production schedule
- Calculating requirements
- Matching with suppliers
- Creating purchase orders
- Success/error messages
- Execution time

### Results

After generation completes, you'll see:
- **Number of POs Created** - Total purchase orders generated
- **Total Value** - Sum of all PO amounts
- **Execution Time** - How long the algorithm took (in milliseconds)
- **Number of Suppliers** - How many suppliers were included

## Generated Purchase Orders

### PO Status

All generated POs are created with status **"draft"**. This allows you to:
- Review the generated orders
- Make manual adjustments if needed
- Approve and send to suppliers when ready

### PO Details

Each generated PO includes:
- **Auto-generated PO Number** (format: PO-YYYYMMDD-NNNN)
- **Supplier** - The supplier to order from
- **Order Date** - When to place the order
- **Required By Date** - When parts are needed
- **Total Amount** - Calculated sum of all line items
- **System Generated Flag** - Marked as auto-generated
- **Generation Run ID** - Links to the generation audit trail

### Line Items

Each PO line item includes:
- **Part** - The part being ordered
- **Quantity** - Number of units
- **Unit Price** - Price per unit from supplier
- **Line Total** - Quantity × Unit Price
- **Linked Boat IDs** - Which boats need these parts (traceability)

## Example Scenario

### Scenario Setup

- **Boat**: "Speedster 3000" due in 30 days
- **Manufacturing Time**: 14 days
- **Need By Date**: 16 days from now (30 - 14)
- **Part Required**: "Outboard Motor 50HP" × 1
- **Current Stock**: 0
- **Supplier**: "PowerBoat Motors LLC"
- **Lead Time**: 10 days
- **Batch Size**: 1
- **Price**: $4,500

### Generation Result

The algorithm will:
1. Calculate need-by date: Today + 16 days
2. Calculate order date: Need-by date - 10 days lead time - 3 days buffer = Today + 3 days
3. Determine order quantity: 1 unit (meets requirement and MOQ)
4. Create PO for $4,500 to PowerBoat Motors LLC
5. Set order date to 3 days from now
6. Set required-by date to 16 days from now
7. Link to "Speedster 3000" boat for traceability

## Clearing Old POs

The **"Clear Old POs"** button allows you to delete all system-generated purchase orders. This is useful for:
- Testing different generation parameters
- Resetting the system
- Removing outdated test data

**Note**: This only deletes POs where `generated_by_system = true`. Manual POs are preserved.

## Best Practices

1. **Regular Generation**
   - Run the generator weekly or when production schedule changes
   - Review generated POs before approving

2. **Maintain Accurate Data**
   - Keep inventory levels up to date
   - Ensure supplier lead times are accurate
   - Update batch sizes and MOQs as suppliers change terms

3. **Safety Stock**
   - Use 10-15% for standard parts
   - Use 20-30% for critical or long-lead-time parts
   - Use 5% for high-value, low-variability parts

4. **Review Before Ordering**
   - Check generated quantities make sense
   - Verify order dates align with production needs
   - Confirm supplier selection is appropriate

5. **Traceability**
   - Use the linked boat IDs to track which boats need which parts
   - Review the generation run audit trail for analysis

## Technical Details

### Implementation

The PO generation is implemented in:
- **File**: `/src/lib/po-generator.ts`
- **Class**: `POGenerator`
- **Method**: `generate(parameters: GenerationParameters)`

### Database Tables Used

- **boats** - Production schedule
- **parts** - Inventory levels
- **supplier_parts** - Supplier relationships and constraints
- **purchase_orders** - Generated PO headers
- **purchase_order_lines** - Generated PO line items
- **generation_runs** - Audit trail

### Algorithm Complexity

- **Time Complexity**: O(n × m) where n = boats and m = parts per boat
- **Space Complexity**: O(p) where p = unique parts required
- **Typical Execution**: 200-500ms for 10 boats with 20 parts each

## Troubleshooting

### No POs Generated

**Possible Causes**:
- No boats in "scheduled" or "in_progress" status
- All required parts already in stock
- No supplier relationships defined for required parts

**Solutions**:
- Add boats with future due dates
- Reduce current stock levels (for testing)
- Create supplier_parts relationships

### Missing Parts in POs

**Causes**:
- Part has no supplier relationship
- Current stock covers requirement

**Solutions**:
- Add supplier_parts entry for the part
- Check inventory levels

### Incorrect Order Dates

**Causes**:
- Lead times not set correctly
- Due dates too soon

**Solutions**:
- Review and update supplier lead times
- Adjust boat due dates to be further in future

### Execution Errors

**Common Errors**:
- Database connection issues
- Missing required data
- Constraint violations

**Debug Steps**:
1. Check browser console for error messages
2. Verify all prerequisite data exists
3. Review generation run record for error details
4. Check Supabase logs

## Future Enhancements

Potential improvements to the algorithm:

1. **Advanced Optimization**
   - Linear programming for multi-supplier optimization
   - Cost minimization across suppliers
   - Lead time optimization

2. **Forecasting**
   - Predict future requirements
   - Seasonal adjustment
   - Trend analysis

3. **Supplier Rating**
   - Factor in supplier ratings
   - Preferred supplier weighting
   - Delivery performance tracking

4. **Multi-Currency**
   - Support for international suppliers
   - Currency conversion
   - Exchange rate handling

5. **Approval Workflow**
   - Multi-level approval process
   - Automated notifications
   - Budget checking

## Support

For questions or issues:
- Review this documentation
- Check the ARCHITECTURE.md file for system design
- Review the code comments in po-generator.ts
