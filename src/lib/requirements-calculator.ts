import { SupabaseClient } from '@supabase/supabase-js'
import { Boat, BoatType, Part, SupplierPart } from '@/types/database'

interface BoatWithType extends Boat {
  boat_type: BoatType
}

export interface PartRequirement {
  part_id: string
  part_name: string
  part_number: string
  total_quantity_needed: number
  net_quantity_needed: number // After accounting for inventory
  current_stock: number
  unit_cost: number
  total_cost: number
  earliest_need_date: string
  latest_need_date: string
  boats_needing: Array<{
    boat_id: string
    boat_name: string
    quantity: number
    need_by_date: string
    due_date: string
  }>
}

export interface SupplierRequirement {
  supplier_id: string
  supplier_name: string
  supplier_contact: string | null
  supplier_email: string | null
  supplier_phone: string | null
  total_parts: number
  total_cost: number
  parts: Array<PartRequirement & {
    lead_time_days: number
    batch_size: number
    minimum_order_quantity: number
    max_monthly_capacity: number | null
    is_preferred: boolean
  }>
}

export interface RequirementsAnalysis {
  calculated_at: string
  entity_id: string
  total_parts: number
  total_suppliers: number
  total_cost: number
  total_boats: number
  planning_horizon_start: string
  planning_horizon_end: string
  parts: PartRequirement[]
  suppliers: SupplierRequirement[]
}

export class RequirementsCalculator {
  constructor(
    private supabase: SupabaseClient,
    private entityId: string
  ) {}

  async calculate(safetyStockPercentage: number = 10, startDate?: string, endDate?: string): Promise<RequirementsAnalysis> {
    // Step 1: Get scheduled boats
    const boats = await this.getScheduledBoats(startDate, endDate)
    
    if (!boats || boats.length === 0) {
      throw new Error('No scheduled boats found')
    }

    // Step 2: Calculate raw requirements from BOMs
    const rawRequirements = this.calculateRawRequirements(boats)
    
    // Step 3: Get parts data
    const partIds = [...new Set(rawRequirements.map(r => r.part_id))]
    const { data: parts } = await this.supabase
      .from('parts')
      .select('*')
      .eq('entity_id', this.entityId)
      .in('id', partIds)
    
    const partMap = new Map<string, Part>()
    parts?.forEach(part => partMap.set(part.id, part))
    
    // Step 4: Calculate net requirements (after inventory)
    const partRequirements = this.calculateNetRequirements(
      rawRequirements,
      partMap,
      safetyStockPercentage
    )
    
    // Step 5: Match with suppliers
    const supplierRequirements = await this.matchWithSuppliers(partRequirements)
    
    // Step 6: Calculate totals and metadata
    const totalCost = supplierRequirements.reduce((sum, s) => sum + s.total_cost, 0)
    const dates = boats.map(b => new Date(b.due_date))
    
    return {
      calculated_at: new Date().toISOString(),
      entity_id: this.entityId,
      total_parts: partRequirements.length,
      total_suppliers: supplierRequirements.length,
      total_cost: totalCost,
      total_boats: boats.length,
      planning_horizon_start: new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0],
      planning_horizon_end: new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0],
      parts: partRequirements,
      suppliers: supplierRequirements
    }
  }

  private async getScheduledBoats(startDate?: string, endDate?: string): Promise<BoatWithType[]> {
    let query = this.supabase
      .from('boats')
      .select(`
        *,
        boat_type:boat_types(*)
      `)
      .eq('entity_id', this.entityId)
      .in('status', ['scheduled', 'in_progress'])
    
    // Apply date filters if provided
    if (startDate) {
      query = query.gte('due_date', startDate)
    }
    if (endDate) {
      query = query.lte('due_date', endDate)
    }
    
    const { data, error } = await query.order('due_date')
    
    if (error) throw error
    
    const boats = (data || []).map(boat => ({
      ...boat,
      boat_type: Array.isArray(boat.boat_type) ? boat.boat_type[0] : boat.boat_type
    }))
    
    return boats as BoatWithType[]
  }

  private calculateRawRequirements(boats: BoatWithType[]) {
    interface RawReq {
      part_id: string
      part_name: string
      boats_needing: Array<{
        boat_id: string
        boat_name: string
        quantity: number
        need_by_date: string
        due_date: string
      }>
    }

    const reqMap = new Map<string, RawReq>()
    
    boats.forEach(boat => {
      const dueDate = new Date(boat.due_date)
      const needByDate = new Date(dueDate)
      needByDate.setDate(needByDate.getDate() - boat.manufacturing_time_days)
      const needByDateStr = needByDate.toISOString().split('T')[0]
      
      boat.boat_type?.mbom?.parts?.forEach(mbomPart => {
        if (!reqMap.has(mbomPart.part_id)) {
          reqMap.set(mbomPart.part_id, {
            part_id: mbomPart.part_id,
            part_name: mbomPart.part_name,
            boats_needing: []
          })
        }
        
        reqMap.get(mbomPart.part_id)!.boats_needing.push({
          boat_id: boat.id,
          boat_name: boat.name,
          quantity: mbomPart.quantity_required,
          need_by_date: needByDateStr,
          due_date: boat.due_date
        })
      })
    })
    
    return Array.from(reqMap.values())
  }

  private calculateNetRequirements(
    rawRequirements: ReturnType<typeof this.calculateRawRequirements>,
    partMap: Map<string, Part>,
    safetyStockPercentage: number
  ): PartRequirement[] {
    const partRequirements: PartRequirement[] = []
    
    rawRequirements.forEach(req => {
      const part = partMap.get(req.part_id)
      if (!part) return
      
      // Sort boats by need date
      req.boats_needing.sort((a, b) => a.need_by_date.localeCompare(b.need_by_date))
      
      const totalQuantity = req.boats_needing.reduce((sum, b) => sum + b.quantity, 0)
      const currentStock = part.current_stock || 0
      const netQuantity = Math.max(0, totalQuantity - currentStock)
      
      // Apply safety stock only to the net requirement
      const netWithSafety = Math.ceil(netQuantity * (1 + safetyStockPercentage / 100))
      
      if (netWithSafety > 0) {
        const dates = req.boats_needing.map(b => b.need_by_date)
        
        partRequirements.push({
          part_id: req.part_id,
          part_name: req.part_name,
          part_number: part.part_number,
          total_quantity_needed: totalQuantity,
          net_quantity_needed: netWithSafety,
          current_stock: currentStock,
          unit_cost: 0, // Will be filled from supplier data
          total_cost: 0, // Will be filled from supplier data
          earliest_need_date: Math.min(...dates.map(d => new Date(d).getTime())).toString(),
          latest_need_date: Math.max(...dates.map(d => new Date(d).getTime())).toString(),
          boats_needing: req.boats_needing
        })
      }
    })
    
    return partRequirements
  }

  private async matchWithSuppliers(
    partRequirements: PartRequirement[]
  ): Promise<SupplierRequirement[]> {
    // Get all supplier parts for needed parts
    const partIds = partRequirements.map(r => r.part_id)
    
    const { data: supplierParts } = await this.supabase
      .from('supplier_parts')
      .select('*, suppliers(*)')
      .eq('entity_id', this.entityId)
      .in('part_id', partIds)
    
    if (!supplierParts) return []
    
    // Build supplier map
    const supplierMap = new Map<string, SupplierRequirement>()
    
    partRequirements.forEach(partReq => {
      // Find best supplier for this part (preferred first, then cheapest)
      const availableSuppliers = supplierParts.filter(sp => sp.part_id === partReq.part_id)
      availableSuppliers.sort((a, b) => {
        if (a.is_preferred && !b.is_preferred) return -1
        if (!a.is_preferred && b.is_preferred) return 1
        return a.price_per_unit - b.price_per_unit
      })
      
      const bestSupplier = availableSuppliers[0]
      if (!bestSupplier) return
      
      const supplierId = bestSupplier.supplier_id
      const supplier = bestSupplier.suppliers
      
      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplier_id: supplierId,
          supplier_name: supplier.name,
          supplier_contact: supplier.contact_name,
          supplier_email: supplier.email,
          supplier_phone: supplier.phone,
          total_parts: 0,
          total_cost: 0,
          parts: []
        })
      }
      
      const supplierReq = supplierMap.get(supplierId)!
      const partCost = partReq.net_quantity_needed * bestSupplier.price_per_unit
      
      supplierReq.parts.push({
        ...partReq,
        unit_cost: bestSupplier.price_per_unit,
        total_cost: partCost,
        lead_time_days: bestSupplier.lead_time_days,
        batch_size: bestSupplier.batch_size,
        minimum_order_quantity: bestSupplier.minimum_order_quantity,
        max_monthly_capacity: bestSupplier.max_monthly_capacity,
        is_preferred: bestSupplier.is_preferred
      })
      
      supplierReq.total_parts++
      supplierReq.total_cost += partCost
    })
    
    return Array.from(supplierMap.values()).sort((a, b) => 
      a.supplier_name.localeCompare(b.supplier_name)
    )
  }
}
