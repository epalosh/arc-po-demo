import { SupabaseClient } from '@supabase/supabase-js'
import { Boat, BoatType, Part, SupplierPart, GenerationParameters } from '@/types/database'

interface BoatWithType extends Boat {
  boat_type: BoatType
}

interface Requirement {
  part_id: string
  part_name: string
  quantity: number
  need_by_date: string
  boat_ids: string[]
}

interface NetRequirement extends Requirement {
  net_quantity: number
  current_stock: number
}

interface POLineItem {
  supplier_id: string
  part_id: string
  part_name: string
  quantity: number
  unit_price: number
  line_total: number
  order_date: string
  required_by_date: string
  boat_ids: string[]
}

interface POGroup {
  supplier_id: string
  order_date: string
  lines: POLineItem[]
  total_amount: number
}

const BUFFER_DAYS = 3 // Extra days for safety

export class POGenerator {
  constructor(
    private supabase: SupabaseClient,
    private entityId: string
  ) {}

  async generate(parameters: GenerationParameters) {
    const startTime = Date.now()
    
    try {
      // Create generation run record
      const { data: runData, error: runError } = await this.supabase
        .from('generation_runs')
        .insert([{
          entity_id: this.entityId,
          parameters,
          status: 'running'
        }])
        .select()
        .single()
      
      if (runError) throw runError
      const generationRunId = runData.id
      
      // Step 1: Get scheduled boats
      const boats = await this.getScheduledBoats()
      
      // Step 2: Calculate requirements
      const requirements = this.calculateRequirements(boats)
      
      // Step 3: Get parts and calculate net requirements
      const netRequirements = await this.calculateNetRequirements(
        requirements,
        parameters.safety_stock_percentage
      )
      
      // Step 4: Match with suppliers and create PO schedule
      const poSchedule = await this.createPOSchedule(
        netRequirements,
        parameters
      )
      
      // Step 5: Group by supplier and month, create POs
      const poGroups = this.groupPOSchedule(poSchedule)
      
      // Step 6: Save purchase orders to database
      const savedPOs = await this.savePurchaseOrders(poGroups, generationRunId)
      
      // Calculate totals
      const totalAmount = savedPOs.reduce((sum, po) => sum + po.total_amount, 0)
      
      // Update generation run
      const executionTime = Date.now() - startTime
      await this.supabase
        .from('generation_runs')
        .update({
          status: 'completed',
          total_pos_generated: savedPOs.length,
          total_amount: totalAmount,
          execution_time_ms: executionTime
        })
        .eq('id', generationRunId)
      
      return {
        success: true,
        generation_run_id: generationRunId,
        pos_generated: savedPOs.length,
        total_amount: totalAmount,
        execution_time_ms: executionTime,
        purchase_orders: savedPOs
      }
    } catch (error) {
      console.error('PO Generation Error:', error)
      throw error
    }
  }

  private async getScheduledBoats(): Promise<BoatWithType[]> {
    const { data, error } = await this.supabase
      .from('boats')
      .select(`
        *,
        boat_type:boat_types(*)
      `)
      .eq('entity_id', this.entityId)
      .in('status', ['scheduled', 'in_progress'])
      .order('due_date')
    
    if (error) throw error
    
    // Transform data to proper structure
    const boats = (data || []).map(boat => ({
      ...boat,
      boat_type: Array.isArray(boat.boat_type) ? boat.boat_type[0] : boat.boat_type
    }))
    
    return boats as BoatWithType[]
  }

  private calculateRequirements(boats: BoatWithType[]): Requirement[] {
    const requirementMap = new Map<string, Requirement>()
    
    boats.forEach(boat => {
      // Calculate need by date
      const dueDate = new Date(boat.due_date)
      const needByDate = new Date(dueDate)
      needByDate.setDate(needByDate.getDate() - boat.manufacturing_time_days)
      const needByDateStr = needByDate.toISOString().split('T')[0]
      
      // Process MBOM parts from boat_type (not from individual boat)
      boat.boat_type?.mbom?.parts?.forEach(mbomPart => {
        const key = `${mbomPart.part_id}-${needByDateStr}`
        
        if (requirementMap.has(key)) {
          const existing = requirementMap.get(key)!
          existing.quantity += mbomPart.quantity_required
          existing.boat_ids.push(boat.id)
        } else {
          requirementMap.set(key, {
            part_id: mbomPart.part_id,
            part_name: mbomPart.part_name,
            quantity: mbomPart.quantity_required,
            need_by_date: needByDateStr,
            boat_ids: [boat.id]
          })
        }
      })
    })
    
    return Array.from(requirementMap.values())
  }

  private async calculateNetRequirements(
    requirements: Requirement[],
    safetyStockPercentage: number
  ): Promise<NetRequirement[]> {
    // Get all parts needed
    const partIds = [...new Set(requirements.map(r => r.part_id))]
    
    const { data: parts, error } = await this.supabase
      .from('parts')
      .select('*')
      .eq('entity_id', this.entityId)
      .in('id', partIds)
    
    if (error) throw error
    
    const partMap = new Map<string, Part>()
    parts?.forEach(part => partMap.set(part.id, part))
    
    // Calculate net requirements
    const netRequirements: NetRequirement[] = []
    
    // Group by part_id first
    const partGroups = new Map<string, Requirement[]>()
    requirements.forEach(req => {
      if (!partGroups.has(req.part_id)) {
        partGroups.set(req.part_id, [])
      }
      partGroups.get(req.part_id)!.push(req)
    })
    
    // Process each part group
    partGroups.forEach((reqs, partId) => {
      const part = partMap.get(partId)
      if (!part) return
      
      let remainingStock = part.current_stock
      
      // Sort by need_by_date
      reqs.sort((a, b) => a.need_by_date.localeCompare(b.need_by_date))
      
      reqs.forEach(req => {
        const quantityNeeded = req.quantity
        const netQuantity = Math.max(0, quantityNeeded - remainingStock)
        
        if (netQuantity > 0) {
          // Apply safety stock percentage
          const finalQuantity = Math.ceil(netQuantity * (1 + safetyStockPercentage / 100))
          
          netRequirements.push({
            ...req,
            net_quantity: finalQuantity,
            current_stock: remainingStock
          })
          
          remainingStock = 0
        } else {
          remainingStock -= quantityNeeded
        }
      })
    })
    
    return netRequirements.filter(r => r.net_quantity > 0)
  }

  private async createPOSchedule(
    netRequirements: NetRequirement[],
    parameters: GenerationParameters
  ): Promise<POLineItem[]> {
    const poSchedule: POLineItem[] = []
    
    for (const req of netRequirements) {
      // Get supplier for this part
      const { data: supplierParts, error } = await this.supabase
        .from('supplier_parts')
        .select('*')
        .eq('entity_id', this.entityId)
        .eq('part_id', req.part_id)
        .order('is_preferred', { ascending: false })
        .order('price_per_unit', { ascending: true })
        .limit(1)
      
      if (error || !supplierParts || supplierParts.length === 0) {
        console.warn(`No supplier found for part ${req.part_id}`)
        continue
      }
      
      const supplierPart = supplierParts[0] as SupplierPart
      
      // Calculate order date
      const needByDate = new Date(req.need_by_date)
      const orderDate = new Date(needByDate)
      orderDate.setDate(orderDate.getDate() - supplierPart.lead_time_days - BUFFER_DAYS)
      const orderDateStr = orderDate.toISOString().split('T')[0]
      
      // Round up to batch sizes
      let orderQuantity = req.net_quantity
      if (parameters.prefer_batch_optimization) {
        const batchesNeeded = Math.ceil(req.net_quantity / supplierPart.batch_size)
        orderQuantity = batchesNeeded * supplierPart.batch_size
      }
      
      // Ensure minimum order quantity
      orderQuantity = Math.max(orderQuantity, supplierPart.minimum_order_quantity)
      
      // Check if we need to split across months due to capacity
      if (supplierPart.max_monthly_capacity && orderQuantity > supplierPart.max_monthly_capacity) {
        // Split order across multiple months
        const numMonths = Math.ceil(orderQuantity / supplierPart.max_monthly_capacity)
        const quantityPerMonth = Math.floor(orderQuantity / numMonths)
        let remainingQuantity = orderQuantity
        
        for (let i = 0; i < numMonths && remainingQuantity > 0; i++) {
          const splitOrderDate = new Date(orderDate)
          splitOrderDate.setMonth(splitOrderDate.getMonth() - i)
          
          const splitQuantity = Math.min(quantityPerMonth, remainingQuantity)
          
          poSchedule.push({
            supplier_id: supplierPart.supplier_id,
            part_id: req.part_id,
            part_name: req.part_name,
            quantity: splitQuantity,
            unit_price: supplierPart.price_per_unit,
            line_total: splitQuantity * supplierPart.price_per_unit,
            order_date: splitOrderDate.toISOString().split('T')[0],
            required_by_date: req.need_by_date,
            boat_ids: req.boat_ids
          })
          
          remainingQuantity -= splitQuantity
        }
      } else {
        // Single order
        poSchedule.push({
          supplier_id: supplierPart.supplier_id,
          part_id: req.part_id,
          part_name: req.part_name,
          quantity: orderQuantity,
          unit_price: supplierPart.price_per_unit,
          line_total: orderQuantity * supplierPart.price_per_unit,
          order_date: orderDateStr,
          required_by_date: req.need_by_date,
          boat_ids: req.boat_ids
        })
      }
    }
    
    return poSchedule
  }

  private groupPOSchedule(poSchedule: POLineItem[]): POGroup[] {
    const groups = new Map<string, POGroup>()
    
    poSchedule.forEach(line => {
      // Group by supplier and month
      const orderDate = new Date(line.order_date)
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-01`
      const groupKey = `${line.supplier_id}-${monthKey}`
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          supplier_id: line.supplier_id,
          order_date: monthKey,
          lines: [],
          total_amount: 0
        })
      }
      
      const group = groups.get(groupKey)!
      group.lines.push(line)
      group.total_amount += line.line_total
    })
    
    return Array.from(groups.values())
  }

  private async savePurchaseOrders(poGroups: POGroup[], generationRunId: string) {
    const savedPOs = []
    
    for (const group of poGroups) {
      // Calculate required_by_date as the earliest need date from all line items
      const earliestRequiredDate = group.lines.reduce((earliest, line) => {
        const lineDate = new Date(line.required_by_date)
        return lineDate < earliest ? lineDate : earliest
      }, new Date(group.lines[0].required_by_date))
      
      // Create PO
      const { data: po, error: poError } = await this.supabase
        .from('purchase_orders')
        .insert([{
          entity_id: this.entityId,
          supplier_id: group.supplier_id,
          order_date: group.order_date,
          required_by_date: earliestRequiredDate.toISOString().split('T')[0],
          status: 'draft',
          total_amount: group.total_amount,
          generated_by_system: true,
          generation_run_id: generationRunId
        }])
        .select()
        .single()
      
      if (poError) throw poError
      
      // Create PO lines
      const lines = group.lines.map(line => ({
        entity_id: this.entityId,
        po_id: po.id,
        part_id: line.part_id,
        quantity: line.quantity,
        unit_price: line.unit_price,
        line_total: line.line_total,
        linked_boat_ids: line.boat_ids
      }))
      
      const { error: linesError } = await this.supabase
        .from('purchase_order_lines')
        .insert(lines)
      
      if (linesError) throw linesError
      
      savedPOs.push(po)
    }
    
    return savedPOs
  }
}
