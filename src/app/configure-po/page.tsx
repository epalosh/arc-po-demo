'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEntity } from '@/contexts/EntityContext'
import { RequirementsCalculator, RequirementsAnalysis, SupplierRequirement } from '@/lib/requirements-calculator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { POTimeline } from '@/components/POTimeline'

interface POBatch {
  id: string
  order_date: string
  parts: Array<{
    part_id: string
    part_name: string
    part_number: string
    quantity: number
    unit_cost: number
    total_cost: number
  }>
  total_cost: number
}

interface CustomPO {
  id: string
  order_date: string
  quantityMultiplier: number // Percentage of total parts (0-100)
  partAllocations: Record<string, number> // Actual quantity per part
}

export default function ConfigurePOPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supplierId = searchParams.get('supplier')
  const marginsParam = searchParams.get('margins')
  const { selectedEntity } = useEntity()
  
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<RequirementsAnalysis | null>(null)
  const [supplier, setSupplier] = useState<SupplierRequirement | null>(null)
  const [customPOs, setCustomPOs] = useState<CustomPO[]>([])
  const [generatingPOs, setGeneratingPOs] = useState(false)
  const [safetyMargins, setSafetyMargins] = useState<Record<string, number>>({})

  useEffect(() => {
    if (selectedEntity && supplierId) {
      // Parse safety margins from URL
      let margins: Record<string, number> = {}
      if (marginsParam) {
        try {
          margins = JSON.parse(decodeURIComponent(marginsParam))
          setSafetyMargins(margins)
        } catch (err) {
          console.error('Failed to parse safety margins:', err)
        }
      }
      loadSupplierRequirements(margins)
    }
  }, [selectedEntity, supplierId, marginsParam])

  // Initialize with a single PO when supplier is loaded
  useEffect(() => {
    if (supplier && customPOs.length === 0) {
      // Find earliest need date across all parts
      const earliestNeedDates = supplier.parts.map(part => 
        new Date(parseInt(part.earliest_need_date))
      )
      const earliestDate = new Date(Math.min(...earliestNeedDates.map(d => d.getTime())))
      
      // Calculate order date based on longest lead time
      const maxLeadTime = Math.max(...supplier.parts.map(p => p.lead_time_days))
      const baseOrderDate = new Date(earliestDate)
      baseOrderDate.setDate(baseOrderDate.getDate() - maxLeadTime - 3) // 3 day buffer
      
      // Allocate all parts to the initial PO
      const initialAllocations: Record<string, number> = {}
      supplier.parts.forEach(part => {
        initialAllocations[part.part_id] = part.net_quantity_needed
      })
      
      setCustomPOs([{
        id: crypto.randomUUID(),
        order_date: baseOrderDate.toISOString().split('T')[0],
        quantityMultiplier: 100,
        partAllocations: initialAllocations
      }])
    }
  }, [supplier])

  // Helper function to redistribute parts evenly across POs
  const redistributePartsEvenly = (pos: CustomPO[]) => {
    if (!supplier || pos.length === 0) return pos
    
    const numPOs = pos.length
    
    // For each part, distribute quantities evenly
    supplier.parts.forEach(part => {
      const totalNeeded = part.net_quantity_needed
      const baseAmount = Math.floor(totalNeeded / numPOs)
      const remainder = totalNeeded % numPOs
      
      // Allocate base amount to all POs, then distribute remainder
      pos.forEach((po, idx) => {
        po.partAllocations[part.part_id] = baseAmount + (idx < remainder ? 1 : 0)
      })
    })
    
    // Recalculate quantity multipliers based on allocations
    pos.forEach(po => {
      const totalAllocated = Object.values(po.partAllocations).reduce((sum, qty) => sum + qty, 0)
      const totalNeeded = supplier.parts.reduce((sum, part) => sum + part.net_quantity_needed, 0)
      po.quantityMultiplier = totalNeeded > 0 ? Math.round((totalAllocated / totalNeeded) * 100) : 0
    })
    
    return pos
  }

  const addPO = () => {
    const lastPO = customPOs[customPOs.length - 1]
    const newDate = lastPO 
      ? new Date(new Date(lastPO.order_date).getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days later
      : new Date()
    
    // Add new PO with empty allocations
    const newPO: CustomPO = {
      id: crypto.randomUUID(),
      order_date: newDate.toISOString().split('T')[0],
      quantityMultiplier: 0,
      partAllocations: {}
    }
    
    const newPOs = [...customPOs, newPO]
    
    // Redistribute parts evenly across all POs
    const redistributed = redistributePartsEvenly(newPOs)
    setCustomPOs(redistributed)
  }

  const removePO = (id: string) => {
    if (customPOs.length === 1) {
      alert('You must have at least one PO')
      return
    }
    
    // Remove PO and redistribute parts evenly across remaining POs
    const remainingPOs = customPOs.filter(po => po.id !== id)
    const redistributed = redistributePartsEvenly(remainingPOs)
    setCustomPOs(redistributed)
  }

  const updatePODate = (id: string, newDate: string) => {
    setCustomPOs(customPOs.map(po => 
      po.id === id ? { ...po, order_date: newDate } : po
    ))
  }

  const updatePOQuantity = (id: string, partId: string, newQuantity: number) => {
    if (!supplier) return
    
    const part = supplier.parts.find(p => p.part_id === partId)
    if (!part) return
    
    // Clamp to valid range [0, total needed]
    const clampedQuantity = Math.max(0, Math.min(part.net_quantity_needed, newQuantity))
    
    // Update this PO's allocation
    const updatedPOs = customPOs.map(po => {
      if (po.id === id) {
        return {
          ...po,
          partAllocations: {
            ...po.partAllocations,
            [partId]: clampedQuantity
          }
        }
      }
      return po
    })
    
    // Recalculate quantity multipliers
    updatedPOs.forEach(po => {
      const totalAllocated = Object.values(po.partAllocations).reduce((sum, qty) => sum + qty, 0)
      const totalNeeded = supplier.parts.reduce((sum, part) => sum + part.net_quantity_needed, 0)
      po.quantityMultiplier = totalNeeded > 0 ? Math.round((totalAllocated / totalNeeded) * 100) : 0
    })
    
    setCustomPOs(updatedPOs)
  }

  // Helper to adjust all parts proportionally for a PO
  const updatePOPercentage = (id: string, newPercentage: number) => {
    if (!supplier) return
    
    const clampedPercentage = Math.max(0, Math.min(100, newPercentage))
    
    const updatedPOs = customPOs.map(po => {
      if (po.id === id) {
        const newAllocations: Record<string, number> = {}
        supplier.parts.forEach(part => {
          newAllocations[part.part_id] = Math.round(part.net_quantity_needed * (clampedPercentage / 100))
        })
        
        return {
          ...po,
          quantityMultiplier: clampedPercentage,
          partAllocations: newAllocations
        }
      }
      return po
    })
    
    setCustomPOs(updatedPOs)
  }

  const movePOBackward = (id: string, days: number = 1) => {
    setCustomPOs(customPOs.map(po => {
      if (po.id === id) {
        const currentDate = new Date(po.order_date)
        currentDate.setDate(currentDate.getDate() - days)
        return { ...po, order_date: currentDate.toISOString().split('T')[0] }
      }
      return po
    }))
  }

  const movePOForward = (id: string, days: number = 1) => {
    setCustomPOs(customPOs.map(po => {
      if (po.id === id) {
        const currentDate = new Date(po.order_date)
        currentDate.setDate(currentDate.getDate() + days)
        return { ...po, order_date: currentDate.toISOString().split('T')[0] }
      }
      return po
    }))
  }

  async function loadSupplierRequirements(margins: Record<string, number> = {}) {
    if (!selectedEntity || !supplierId) return
    
    try {
      setLoading(true)
      
      const calculator = new RequirementsCalculator(supabase, selectedEntity.id)
      // Use 0% safety stock to match the review-requirements page
      const result = await calculator.calculate(0)
      
      const supplierReq = result.suppliers.find(s => s.supplier_id === supplierId)
      if (!supplierReq) {
        throw new Error('Supplier not found in requirements')
      }
      
      // Apply safety margins to parts if they were provided
      if (Object.keys(margins).length > 0) {
        supplierReq.parts = supplierReq.parts.map(part => {
          const margin = margins[part.part_id] || 0
          if (margin > 0) {
            // Calculate adjusted quantity with margin
            const baseNetQty = Math.max(0, part.total_quantity_needed - part.current_stock)
            const adjustedQty = Math.ceil(baseNetQty * (1 + margin / 100))
            return {
              ...part,
              net_quantity_needed: adjustedQty
            }
          }
          return part
        })
      }
      
      setAnalysis(result)
      setSupplier(supplierReq)
    } catch (err) {
      console.error('Error loading requirements:', err)
      alert('Failed to load supplier requirements')
      router.push('/generate-pos')
    } finally {
      setLoading(false)
    }
  }

  // Calculate PO batches based on custom PO list with actual allocations
  const poBatches = useMemo(() => {
    if (!supplier || customPOs.length === 0) return []
    
    const batches: POBatch[] = []
    
    // Use actual part allocations from each PO
    customPOs.forEach((customPO) => {
      const batchParts = supplier.parts.map(part => {
        const quantity = customPO.partAllocations[part.part_id] || 0
        
        return {
          part_id: part.part_id,
          part_name: part.part_name,
          part_number: part.part_number,
          quantity,
          unit_cost: part.unit_cost,
          total_cost: quantity * part.unit_cost
        }
      }).filter(p => p.quantity > 0)
      
      const batchTotal = batchParts.reduce((sum, p) => sum + p.total_cost, 0)
      
      batches.push({
        id: customPO.id,
        order_date: customPO.order_date,
        parts: batchParts,
        total_cost: batchTotal
      })
    })
    
    return batches
  }, [supplier, customPOs])

  // Validate if stock will go negative at any point (proper cumulative validation)
  const hasStockShortages = useMemo(() => {
    if (!supplier || poBatches.length === 0) return { hasShortage: false, shortageEvents: [] }
    
    const maxLeadTime = Math.max(...supplier.parts.map(p => p.lead_time_days))
    
    // Build timeline of all events (deliveries and consumption)
    const events: Array<{ date: Date, type: 'delivery' | 'consumption', parts: Record<string, number> }> = []
    
    // Add delivery events
    poBatches.forEach(batch => {
      const deliveryDate = new Date(batch.order_date)
      deliveryDate.setDate(deliveryDate.getDate() + maxLeadTime)
      deliveryDate.setHours(0, 0, 0, 0)
      
      const partsInBatch: Record<string, number> = {}
      batch.parts.forEach(part => {
        partsInBatch[part.part_id] = part.quantity
      })
      
      events.push({
        date: deliveryDate,
        type: 'delivery',
        parts: partsInBatch
      })
    })
    
    // Add consumption events (boats needing parts)
    supplier.parts.forEach(part => {
      part.boats_needing.forEach(boat => {
        const needDate = new Date(boat.need_by_date)
        needDate.setHours(0, 0, 0, 0)
        
        // Find or create event for this date
        let event = events.find(e => e.date.getTime() === needDate.getTime() && e.type === 'consumption')
        if (!event) {
          event = {
            date: needDate,
            type: 'consumption',
            parts: {}
          }
          events.push(event)
        }
        
        event.parts[part.part_id] = (event.parts[part.part_id] || 0) + boat.quantity
      })
    })
    
    // Sort events by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    // Initialize stock levels
    const stockByPart: Record<string, number> = {}
    supplier.parts.forEach(part => {
      stockByPart[part.part_id] = part.current_stock
    })
    
    // Process events and check for negative stock
    const shortageEvents: Array<{ date: Date, part: string, stock: number }> = []
    
    events.forEach(event => {
      Object.entries(event.parts).forEach(([partId, quantity]) => {
        if (event.type === 'delivery') {
          stockByPart[partId] = (stockByPart[partId] || 0) + quantity
        } else {
          stockByPart[partId] = (stockByPart[partId] || 0) - quantity
          
          // Check for shortage
          if (stockByPart[partId] < 0) {
            const part = supplier.parts.find(p => p.part_id === partId)
            shortageEvents.push({
              date: event.date,
              part: part?.part_number || partId,
              stock: stockByPart[partId]
            })
            console.log('SHORTAGE in configure-po:', {
              date: event.date.toISOString(),
              part: part?.part_number,
              stock: stockByPart[partId]
            })
          }
        }
      })
    })
    
    console.log('hasStockShortages result:', {
      hasShortage: shortageEvents.length > 0,
      shortageCount: shortageEvents.length
    })
    
    return {
      hasShortage: shortageEvents.length > 0,
      shortageEvents
    }
  }, [poBatches, supplier])

  async function handleGeneratePOs() {
    if (!selectedEntity || !supplier) return
    // Prevent generation if there are stock shortages
    if (hasStockShortages.hasShortage) {
      const firstShortage = hasStockShortages.shortageEvents[0]
      alert(`Cannot generate POs: Stock shortage detected on ${firstShortage.date.toLocaleDateString()}. Part ${firstShortage.part} will have ${firstShortage.stock} units (negative stock). Please adjust your spreading strategy to ensure earlier deliveries.`)
      return
    }
    // Confirmation popup removed
    
    try {
      setGeneratingPOs(true)
      
      // Calculate max lead time for required_by_date
      const maxLeadTime = Math.max(...supplier.parts.map(p => p.lead_time_days))
      
      // Create each PO batch
      for (const batch of poBatches) {
        // Calculate required delivery date (order date + lead time)
        const requiredByDate = new Date(batch.order_date)
        requiredByDate.setDate(requiredByDate.getDate() + maxLeadTime)
        
        // Create PO
        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .insert([{
            entity_id: selectedEntity.id,
            supplier_id: supplier.supplier_id,
            order_date: batch.order_date,
            required_by_date: requiredByDate.toISOString().split('T')[0],
            status: 'draft',
            total_amount: batch.total_cost,
            generated_by_system: false, // User-configured, not auto-generated
            notes: `Configured via interactive PO builder - ${customPOs.length} PO${customPOs.length > 1 ? 's' : ''}`
          }])
          .select()
          .single()
        
        if (poError) throw poError
        
        // Create PO lines
        const lines = batch.parts.map(part => ({
          entity_id: selectedEntity.id,
          po_id: po.id,
          part_id: part.part_id,
          quantity: part.quantity,
          unit_price: part.unit_cost,
          line_total: part.total_cost
        }))
        
        const { error: linesError } = await supabase
          .from('purchase_order_lines')
          .insert(lines)
        
        if (linesError) throw linesError
      }
      
  // Success alert removed; just redirect
  router.push('/purchase-orders')
    } catch (err) {
      console.error('Error generating POs:', err)
      alert('Failed to generate purchase orders: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setGeneratingPOs(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 font-mono">
        Loading supplier configuration...
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="font-mono text-red-600 mb-4">Supplier not found</div>
        <Button onClick={() => router.push('/generate-pos')}>
          Back to Generate POs
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-3xl font-bold text-black">Configure POs</h1>
          <div className="font-mono text-lg text-gray-600 mt-2">{supplier.supplier_name}</div>
        </div>
        <Button onClick={() => router.back()} variant="secondary">
          ← Back
        </Button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Timeline and Details */}
        <div className="col-span-2 space-y-6">
          <Card title="PO Schedule Timeline">
            <POTimeline
              poBatches={poBatches}
              boatsNeeding={supplier.parts.flatMap(part => part.boats_needing).reduce((unique, boat) => {
                if (!unique.find(b => b.boat_id === boat.boat_id)) {
                  unique.push(boat)
                }
                return unique
              }, [] as typeof supplier.parts[0]['boats_needing'])}
              maxLeadTime={Math.max(...supplier.parts.map(p => p.lead_time_days))}
              initialStock={supplier.parts.reduce((acc, part) => {
                acc[part.part_id] = part.current_stock
                return acc
              }, {} as Record<string, number>)}
              boatConsumption={supplier.parts.flatMap(part => 
                part.boats_needing.map(boat => ({
                  boat_id: boat.boat_id,
                  boat_name: boat.boat_name,
                  need_by_date: boat.need_by_date,
                  parts: { [part.part_id]: boat.quantity }
                }))
              ).reduce((unique, boat) => {
                const existing = unique.find(b => b.boat_id === boat.boat_id && b.need_by_date === boat.need_by_date)
                if (existing) {
                  Object.assign(existing.parts, boat.parts)
                } else {
                  unique.push(boat)
                }
                return unique
              }, [] as Array<{
                boat_id: string
                boat_name: string
                need_by_date: string
                parts: Record<string, number>
              }>)}
            />
          </Card>

          <Card title="Parts Required">
            <div className="overflow-x-auto">
              <table className="w-full font-mono">
                <thead className="border-b-2 border-black">
                  <tr className="text-sm">
                    <th className="text-left py-3 pr-6 font-bold">Part #</th>
                    <th className="text-left py-3 pr-6 font-bold">Name</th>
                    <th className="text-right py-3 pr-6 font-bold">Net Qty</th>
                    <th className="text-right py-3 pr-6 font-bold">Unit Cost</th>
                    <th className="text-right py-3 pr-6 font-bold">Total</th>
                    <th className="text-left py-3 pr-6 font-bold">Need By</th>
                    <th className="text-center py-3 pr-6 font-bold">Lead Time</th>
                    <th className="text-right py-3 pr-6 font-bold">MOQ</th>
                    <th className="text-right py-3 font-bold">Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.parts.map(part => {
                    const hasMargin = safetyMargins[part.part_id] && safetyMargins[part.part_id] > 0
                    return (
                      <tr key={part.part_id} className="border-b border-gray-300 text-sm">
                        <td className="py-4 pr-6">{part.part_number}</td>
                        <td className="py-4 pr-6">{part.part_name}</td>
                        <td className="text-right py-4 pr-6 font-semibold">
                          {part.net_quantity_needed}
                          {hasMargin && (
                            <span className="ml-1 text-xs text-green-600" title={`${safetyMargins[part.part_id]}% safety margin applied`}>
                              (+{safetyMargins[part.part_id]}%)
                            </span>
                          )}
                        </td>
                        <td className="text-right py-4 pr-6">${part.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="text-right py-4 pr-6 font-semibold">${part.total_cost.toLocaleString()}</td>
                        <td className="text-left py-4 pr-6">
                          {new Date(parseInt(part.earliest_need_date)).toLocaleDateString()}
                        </td>
                        <td className="text-center py-4 pr-6">{part.lead_time_days}d</td>
                        <td className="text-right py-4 pr-6">{part.minimum_order_quantity}</td>
                        <td className="text-right py-4">{part.batch_size}</td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Remove table footer total. Add total below table, right-aligned. */}
              </table>
            </div>
            <div className="w-full flex justify-end">
              <div className="bg-gray-50 py-4 pr-6 font-bold text-lg font-mono text-right" style={{ minWidth: '220px' }}>
                TOTAL ${supplier.total_cost.toLocaleString()}
              </div>
            </div>
          </Card>

          <Card title="Boats Needing These Parts">
            <div className="space-y-3">
              {supplier.parts.flatMap(part => part.boats_needing).reduce((unique, boat) => {
                if (!unique.find(b => b.boat_id === boat.boat_id)) {
                  unique.push(boat)
                }
                return unique
              }, [] as typeof supplier.parts[0]['boats_needing']).map(boat => (
                <div key={boat.boat_id} className="font-mono text-sm border-l-4 border-purple-600 pl-3 py-2 bg-purple-50">
                  <div className="font-bold">{boat.boat_name}</div>
                  <div className="text-xs text-gray-600">
                    Due: {new Date(boat.due_date).toLocaleDateString()} | 
                    Need parts by: {new Date(boat.need_by_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Supplier Information">
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <span className="text-gray-600">Contact:</span> {supplier.supplier_contact || 'N/A'}
              </div>
              <div>
                <span className="text-gray-600">Email:</span> {supplier.supplier_email || 'N/A'}
              </div>
              <div>
                <span className="text-gray-600">Phone:</span> {supplier.supplier_phone || 'N/A'}
              </div>
              <div>
                <span className="text-gray-600">Total Parts:</span> {supplier.total_parts}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Configure Purchase Orders */}
        <div className="col-span-1">
          <Card>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold font-mono">Configure</span>
              {/* Total Allocation Indicator (x/y) */}
              {(() => {
                if (!supplier) return null
                const allocationStatus = supplier.parts.map(part => {
                  const totalAllocated = customPOs.reduce((sum, po) => sum + (po.partAllocations[part.part_id] || 0), 0)
                  return {
                    partId: part.part_id,
                    partNumber: part.part_number,
                    needed: part.net_quantity_needed,
                    allocated: totalAllocated,
                    isOver: totalAllocated > part.net_quantity_needed,
                    isUnder: totalAllocated < part.net_quantity_needed,
                    isPerfect: totalAllocated === part.net_quantity_needed
                  }
                })
                const totalAllocatedVolume = allocationStatus.reduce((sum, s) => sum + s.allocated, 0)
                const totalNeededVolume = allocationStatus.reduce((sum, s) => sum + s.needed, 0)
                return (
                  <span className="font-mono text-xs font-semibold text-gray-700">{totalAllocatedVolume}/{totalNeededVolume} allocated</span>
                )
              })()}
            </div>
            {/* Detailed allocation indicator, only if not perfect */}
            {(() => {
              if (!supplier) return null
              const allocationStatus = supplier.parts.map(part => {
                const totalAllocated = customPOs.reduce((sum, po) => sum + (po.partAllocations[part.part_id] || 0), 0)
                return {
                  partId: part.part_id,
                  partNumber: part.part_number,
                  needed: part.net_quantity_needed,
                  allocated: totalAllocated,
                  isOver: totalAllocated > part.net_quantity_needed,
                  isUnder: totalAllocated < part.net_quantity_needed,
                  isPerfect: totalAllocated === part.net_quantity_needed
                }
              })
              const hasOverAllocation = allocationStatus.some(s => s.isOver)
              const hasUnderAllocation = allocationStatus.some(s => s.isUnder)
              const isPerfect = allocationStatus.every(s => s.isPerfect)
              if (isPerfect) return null
              return (
                <div className={`font-mono text-xs p-3 rounded border-2 ${
                  hasOverAllocation ? 'bg-red-50 border-red-600 text-red-900' :
                  hasUnderAllocation ? 'bg-yellow-50 border-yellow-600 text-yellow-900' :
                  'bg-green-50 border-green-600 text-green-900'
                }`}>
                  <div className="font-bold flex items-center">
                    {hasOverAllocation ? '⚠ Over-Allocated Parts' : '⚠ Under-Allocated Parts'}
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto mt-2">
                    {allocationStatus.filter(s => !s.isPerfect).map(status => (
                      <div key={status.partId} className="flex justify-between text-[10px]">
                        <span className="truncate mr-2">{status.partNumber}:</span>
                        <span className={`font-bold whitespace-nowrap ${
                          status.isOver ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          {status.allocated}/{status.needed}
                          {status.isOver && ` (+${status.allocated - status.needed})`}
                          {status.isUnder && ` (-${status.needed - status.allocated})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
            <div className="space-y-4">
              
              {/* PO List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customPOs.map((po, idx) => (
                  <div key={po.id} className="border border-gray-300 p-2 bg-gray-50">
                    {/* Header Row: PO # and Remove Button */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-xs font-bold">
                        PO #{idx + 1} ({po.quantityMultiplier}%)
                      </div>
                      <button
                        onClick={() => removePO(po.id)}
                        disabled={customPOs.length === 1}
                        className="px-1.5 py-0.5 text-[10px] font-mono border border-red-600 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-50"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Date and Percentage Row */}
                    <div className="space-y-3 mb-2">
                      <div>
                        <label className="font-mono text-[10px] text-gray-600 block mb-0.5">
                          Order Date:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={po.order_date}
                            onChange={(e) => updatePODate(po.id, e.target.value)}
                            className="flex-1 px-1.5 py-0.5 border border-gray-300 font-mono text-[10px]"
                          />
                          <button
                            onClick={() => movePOBackward(po.id, 1)}
                            className="px-1.5 py-0.5 text-[10px] font-mono border border-black hover:bg-gray-200"
                            title="Move back 1 day"
                          >
                            ← 1d
                          </button>
                          <button
                            onClick={() => movePOForward(po.id, 1)}
                            className="px-1.5 py-0.5 text-[10px] font-mono border border-black hover:bg-gray-200"
                            title="Move forward 1 day"
                          >
                            1d →
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="font-mono text-[10px] text-gray-600 block mb-0.5">
                          Adjust All:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={po.quantityMultiplier}
                            onChange={(e) => updatePOPercentage(po.id, parseInt(e.target.value))}
                            className="flex-1 accent-black"
                            style={{ height: '20px' }}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={po.quantityMultiplier}
                            onChange={(e) => updatePOPercentage(po.id, parseInt(e.target.value) || 0)}
                            className="w-10 px-1 py-0.5 border border-gray-300 font-mono text-[10px] text-right"
                          />
                          <span className="font-mono text-[10px] text-gray-600">%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Per-part allocation details - Always visible */}
                    {supplier && (
                      <div className="border-t pt-1.5 mt-1.5">
                        <div className="font-mono text-[10px] text-gray-600 mb-1">Part Quantities:</div>
                        <div className="space-y-0.5 max-h-32 overflow-y-auto">
                          {supplier.parts.map(part => {
                            const allocated = po.partAllocations[part.part_id] || 0
                            const totalAllocated = customPOs.reduce((sum, p) => 
                              sum + (p.partAllocations[part.part_id] || 0), 0
                            )
                            const isOver = totalAllocated > part.net_quantity_needed
                            const isUnder = totalAllocated < part.net_quantity_needed
                            
                            return (
                              <div key={part.part_id} className="flex items-center gap-1">
                                <span className="font-mono text-[9px] text-gray-600 truncate flex-1">
                                  {part.part_number}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={part.net_quantity_needed}
                                  value={allocated}
                                  onChange={(e) => updatePOQuantity(po.id, part.part_id, parseInt(e.target.value) || 0)}
                                  className={`w-12 px-1 py-0 border font-mono text-xs text-right ${
                                    isOver ? 'border-red-500 bg-red-50' : 
                                    isUnder ? 'border-yellow-500 bg-yellow-50' : 
                                    'border-gray-300'
                                  }`}
                                />
                                <span className="font-mono text-xs text-gray-500 w-10">
                                  /{part.net_quantity_needed}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                onClick={addPO}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                + Add Another PO
              </Button>
            </div>
          </Card>

          <div className="mt-6"></div>
          <Card title="Preview: Generated POs">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {poBatches.map((batch, idx) => (
                <div key={batch.id} className="border border-blue-600 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-mono text-xs font-bold">PO #{idx + 1}</div>
                    <div className="font-mono text-xs font-bold text-blue-600">
                      ${batch.total_cost.toLocaleString()}
                    </div>
                  </div>
                  <div className="font-mono text-xs flex items-center justify-between mb-1">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-bold">{new Date(batch.order_date).toLocaleDateString()}</span>
                  </div>
                  <div className="font-mono text-xs">
                    <div className="text-gray-600 mb-0.5">{batch.parts.length} parts:</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {batch.parts.map(part => (
                        <div key={part.part_id} className="text-xs truncate">
                          • {part.quantity}x {part.part_number}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t-2 border-black">
              <div className="font-mono text-sm flex justify-between mb-3">
                <span>Total POs:</span>
                <span className="font-bold">{poBatches.length}</span>
              </div>
              <div className="font-mono text-sm flex justify-between mb-4">
                <span>Grand Total:</span>
                <span className="font-bold">${supplier.total_cost.toLocaleString()}</span>
              </div>
              
              {(() => {
                // Check if allocation is perfect
                const allocationStatus = supplier.parts.map(part => {
                  const totalAllocated = customPOs.reduce((sum, po) => 
                    sum + (po.partAllocations[part.part_id] || 0), 0
                  )
                  return {
                    isPerfect: totalAllocated === part.net_quantity_needed,
                    isOver: totalAllocated > part.net_quantity_needed,
                    isUnder: totalAllocated < part.net_quantity_needed
                  }
                })
                
                const hasImperfectAllocation = !allocationStatus.every(s => s.isPerfect)
                const canGenerate = !generatingPOs && !hasStockShortages.hasShortage && !hasImperfectAllocation
                
                return (
                  <Button
                    onClick={handleGeneratePOs}
                    disabled={!canGenerate}
                    className={`w-full ${!canGenerate ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={
                      hasStockShortages.hasShortage ? 'Cannot generate: Stock shortages detected in timeline' :
                      hasImperfectAllocation ? 'Cannot generate: Part allocations must match requirements exactly' :
                      ''
                    }
                  >
                    {generatingPOs ? 'Generating...' : 
                     hasStockShortages.hasShortage ? `Stock Shortage (${poBatches.length} PO${poBatches.length > 1 ? 's' : ''})` : 
                     hasImperfectAllocation ? `Fix Allocations (${poBatches.length} PO${poBatches.length > 1 ? 's' : ''})` :
                     `Generate ${poBatches.length} PO${poBatches.length > 1 ? 's' : ''}`}
                  </Button>
                )
              })()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
