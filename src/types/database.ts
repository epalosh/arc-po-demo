// TypeScript types for our database tables

export interface Entity {
  id: string
  name: string
  description: string | null
  industry: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Part {
  id: string
  entity_id: string
  part_number: string
  name: string
  description: string | null
  category: string | null
  current_stock: number
  unit_of_measure: string
  unit_cost: number
  reorder_point: number
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  entity_id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  rating: number | null
  payment_terms: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplierPart {
  id: string
  entity_id: string
  supplier_id: string
  part_id: string
  lead_time_days: number
  minimum_order_quantity: number
  batch_size: number
  price_per_unit: number
  is_preferred: boolean
  max_monthly_capacity: number | null
  created_at: string
  updated_at: string
}

export interface BoatType {
  id: string
  entity_id: string
  name: string
  model: string
  description: string | null
  default_manufacturing_time_days: number
  mbom: MBOM
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Boat {
  id: string
  entity_id: string
  boat_type_id: string
  name: string
  model: string
  due_date: string
  manufacturing_time_days: number
  status: 'scheduled' | 'in_progress' | 'completed'
  mbom: MBOM
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MBOM {
  parts: MBOMPart[]
}

export interface MBOMPart {
  part_id: string
  quantity_required: number
  part_name: string
}

export interface PurchaseOrder {
  id: string
  entity_id: string
  po_number: string
  supplier_id: string
  order_date: string
  required_by_date: string
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled'
  total_amount: number
  notes: string | null
  generated_by_system: boolean
  generation_run_id: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseOrderLine {
  id: string
  entity_id: string
  po_id: string
  part_id: string
  quantity: number
  unit_price: number
  line_total: number
  linked_boat_ids: string[]
  notes: string | null
  created_at: string
}

export interface GenerationRun {
  id: string
  entity_id: string
  run_date: string
  parameters: GenerationParameters
  total_pos_generated: number
  total_amount: number
  status: 'running' | 'completed' | 'failed'
  error_message: string | null
  execution_time_ms: number | null
  created_at: string
}

export interface GenerationParameters {
  planning_horizon_months: number
  max_pos_per_supplier_per_month: number
  prefer_batch_optimization: boolean
  safety_stock_percentage: number
}
