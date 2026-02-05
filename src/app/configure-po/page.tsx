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

type SpreadStrategy = 'single' | 'weekly' | 'bi-weekly' | 'monthly'

export default function ConfigurePOPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supplierId = searchParams.get('supplier')
  const { selectedEntity } = useEntity()
  
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<RequirementsAnalysis | null>(null)
  const [supplier, setSupplier] = useState<SupplierRequirement | null>(null)
  const [spreadStrategy, setSpreadStrategy] = useState<SpreadStrategy>('single')
  const [numBatches, setNumBatches] = useState(1)
  const [generatingPOs, setGeneratingPOs] = useState(false)

  useEffect(() => {
    if (selectedEntity && supplierId) {
      loadSupplierRequirements()
    }
  }, [selectedEntity, supplierId])

  async function loadSupplierRequirements() {
    if (!selectedEntity || !supplierId) return
    
    try {
      setLoading(true)
      
      const calculator = new RequirementsCalculator(supabase, selectedEntity.id)
      const result = await calculator.calculate(10)
      
      const supplierReq = result.suppliers.find(s => s.supplier_id === supplierId)
      if (!supplierReq) {
        throw new Error('Supplier not found in requirements')
      }
      
      setAnalysis(result)
      setSupplier(supplierReq)
    } catch (err) {
      console.error('Error loading requirements:', err)
      alert('Failed to load supplier requirements')
      router.push('/review-requirements')
    } finally {
      setLoading(false)
    }
  }

  // Calculate PO batches based on spread strategy
  const poBatches = useMemo(() => {
    if (!supplier) return []
    
    const batches: POBatch[] = []
    
    // Find earliest need date across all parts
    const earliestNeedDates = supplier.parts.map(part => 
      new Date(parseInt(part.earliest_need_date))
    )
    const earliestDate = new Date(Math.min(...earliestNeedDates.map(d => d.getTime())))
    
    // Calculate order date based on longest lead time
    const maxLeadTime = Math.max(...supplier.parts.map(p => p.lead_time_days))
    const baseOrderDate = new Date(earliestDate)
    baseOrderDate.setDate(baseOrderDate.getDate() - maxLeadTime - 3) // 3 day buffer
    
    if (spreadStrategy === 'single') {
      // Single PO with all parts
      batches.push({
        order_date: baseOrderDate.toISOString().split('T')[0],
        parts: supplier.parts.map(part => ({
          part_id: part.part_id,
          part_name: part.part_name,
          part_number: part.part_number,
          quantity: part.net_quantity_needed,
          unit_cost: part.unit_cost,
          total_cost: part.total_cost
        })),
        total_cost: supplier.total_cost
      })
    } else {
      // Calculate interval based on strategy
      let daysBetweenOrders = 0
      if (spreadStrategy === 'weekly') daysBetweenOrders = 7
      else if (spreadStrategy === 'bi-weekly') daysBetweenOrders = 14
      else if (spreadStrategy === 'monthly') daysBetweenOrders = 30
      
      // Split each part across batches
      for (let i = 0; i < numBatches; i++) {
        const orderDate = new Date(baseOrderDate)
        orderDate.setDate(orderDate.getDate() + (i * daysBetweenOrders))
        
        const batchParts = supplier.parts.map(part => {
          // Distribute quantity across batches
          const qtyPerBatch = Math.floor(part.net_quantity_needed / numBatches)
          const isLastBatch = i === numBatches - 1
          const quantity = isLastBatch 
            ? part.net_quantity_needed - (qtyPerBatch * (numBatches - 1))
            : qtyPerBatch
          
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
          order_date: orderDate.toISOString().split('T')[0],
          parts: batchParts,
          total_cost: batchTotal
        })
      }
    }
    
    return batches
  }, [supplier, spreadStrategy, numBatches])

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
    
    if (!confirm(`Generate ${poBatches.length} purchase order(s) for ${supplier.supplier_name}?`)) {
      return
    }
    
    try {
      setGeneratingPOs(true)
      
      // Create each PO batch
      for (const batch of poBatches) {
        // Create PO
        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .insert([{
            entity_id: selectedEntity.id,
            supplier_id: supplier.supplier_id,
            order_date: batch.order_date,
            required_by_date: batch.order_date, // Can be refined
            status: 'draft',
            total_amount: batch.total_cost,
            generated_by_system: false, // User-configured, not auto-generated
            notes: `Configured via interactive PO builder - ${spreadStrategy} strategy`
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
      
      alert(`Successfully generated ${poBatches.length} purchase order(s)!`)
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
        <Button onClick={() => router.push('/review-requirements')}>
          Back to Requirements
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
        <Button onClick={() => router.push('/review-requirements')} variant="secondary">
          ← Back to Requirements
        </Button>
      </div>

      {/* Timeline Visualization */}
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

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Supplier Info & Parts */}
        <div className="col-span-2 space-y-6">
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

          <Card title="Parts Required">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="border-b-2 border-black">
                  <tr>
                    <th className="text-left py-2">Part #</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-right py-2">Net Qty</th>
                    <th className="text-right py-2">Unit Cost</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-left py-2">Need By</th>
                    <th className="text-center py-2">Lead Time</th>
                    <th className="text-right py-2">MOQ</th>
                    <th className="text-right py-2">Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.parts.map(part => (
                    <tr key={part.part_id} className="border-b border-gray-200">
                      <td className="py-2">{part.part_number}</td>
                      <td>{part.part_name}</td>
                      <td className="text-right font-bold">{part.net_quantity_needed}</td>
                      <td className="text-right">${part.unit_cost.toFixed(2)}</td>
                      <td className="text-right font-bold">${part.total_cost.toLocaleString()}</td>
                      <td className="text-left text-xs">
                        {new Date(parseInt(part.earliest_need_date)).toLocaleDateString()}
                      </td>
                      <td className="text-center">{part.lead_time_days}d</td>
                      <td className="text-right">{part.minimum_order_quantity}</td>
                      <td className="text-right">{part.batch_size}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-black">
                  <tr>
                    <td colSpan={4} className="py-2 font-bold">TOTAL</td>
                    <td className="text-right font-bold">${supplier.total_cost.toLocaleString()}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
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
                <div key={boat.boat_id} className="font-mono text-sm border-l-4 border-blue-600 pl-3 py-2 bg-blue-50">
                  <div className="font-bold">{boat.boat_name}</div>
                  <div className="text-xs text-gray-600">
                    Due: {new Date(boat.due_date).toLocaleDateString()} | 
                    Need parts by: {new Date(boat.need_by_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Configuration */}
        <div className="col-span-1 space-y-6">
          <Card title="PO Spreading Strategy">
            <div className="space-y-4">
              <div>
                <label className="font-mono text-sm font-bold mb-2 block">Strategy</label>
                <select
                  value={spreadStrategy}
                  onChange={(e) => {
                    setSpreadStrategy(e.target.value as SpreadStrategy)
                    if (e.target.value === 'single') setNumBatches(1)
                    else if (numBatches === 1) setNumBatches(2)
                  }}
                  className="w-full px-3 py-2 border-2 border-black font-mono text-sm"
                >
                  <option value="single">Single PO (All at Once)</option>
                  <option value="weekly">Weekly Batches</option>
                  <option value="bi-weekly">Bi-Weekly Batches</option>
                  <option value="monthly">Monthly Batches</option>
                </select>
              </div>

              {spreadStrategy !== 'single' && (
                <div>
                  <label className="font-mono text-sm font-bold mb-2 block">
                    Number of Batches: {numBatches}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={numBatches}
                    onChange={(e) => setNumBatches(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between font-mono text-xs text-gray-600 mt-1">
                    <span>2</span>
                    <span>12</span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-600">
                <div className="font-mono text-xs text-yellow-900">
                  <strong>📅 Strategy Impact:</strong>
                  {spreadStrategy === 'single' && ' All parts ordered at once for maximum efficiency.'}
                  {spreadStrategy === 'weekly' && ` ${numBatches} POs spread ${7} days apart.`}
                  {spreadStrategy === 'bi-weekly' && ` ${numBatches} POs spread ${14} days apart.`}
                  {spreadStrategy === 'monthly' && ` ${numBatches} POs spread ${30} days apart.`}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Preview: Generated POs">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {poBatches.map((batch, idx) => (
                <div key={idx} className="border-2 border-gray-300 p-3">
                  <div className="font-mono text-sm font-bold mb-2">
                    PO #{idx + 1}
                  </div>
                  <div className="font-mono text-xs mb-2">
                    <div className="text-gray-600">Order Date:</div>
                    <div className="font-bold">{new Date(batch.order_date).toLocaleDateString()}</div>
                  </div>
                  <div className="font-mono text-xs mb-2">
                    <div className="text-gray-600">{batch.parts.length} parts</div>
                    {batch.parts.map(part => (
                      <div key={part.part_id} className="text-xs">
                        • {part.quantity}x {part.part_number}
                      </div>
                    ))}
                  </div>
                  <div className="font-mono text-sm font-bold text-blue-600 border-t pt-2">
                    ${batch.total_cost.toLocaleString()}
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
              
              <Button
                onClick={handleGeneratePOs}
                disabled={generatingPOs || hasStockShortages.hasShortage}
                className={`w-full ${hasStockShortages.hasShortage ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={hasStockShortages.hasShortage ? 'Cannot generate: Stock shortages detected in timeline' : ''}
              >
                {generatingPOs ? 'Generating...' : hasStockShortages.hasShortage ? `⚠️ Stock Shortage (${poBatches.length} PO${poBatches.length > 1 ? 's' : ''})` : `Generate ${poBatches.length} PO${poBatches.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
