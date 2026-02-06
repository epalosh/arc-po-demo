'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEntity } from '@/contexts/EntityContext'
import { Card } from '@/components/ui/Card'

export default function DiagnosticPage() {
  const { selectedEntity } = useEntity()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedEntity) {
      loadDiagnostics()
    }
  }, [selectedEntity])

  async function loadDiagnostics() {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      
      // Get boats with their boat types, ordered by due date (production schedule order)
      const { data: boats } = await supabase
        .from('boats')
        .select('*, boat_types(*)')
        .eq('entity_id', selectedEntity.id)
        .in('status', ['scheduled', 'in_progress'])
        .order('due_date', { ascending: true })
      
      // Get all active boat types (to check all parts that might be needed)
      const { data: boatTypes } = await supabase
        .from('boat_types')
        .select('*')
        .eq('entity_id', selectedEntity.id)
        .eq('is_active', true)
      
      // Get parts
      const { data: parts } = await supabase
        .from('parts')
        .select('*')
        .eq('entity_id', selectedEntity.id)
      
      // Get suppliers
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('*')
        .eq('entity_id', selectedEntity.id)
      
      // Get supplier parts
      const { data: supplierParts } = await supabase
        .from('supplier_parts')
        .select('*, parts(part_number, name), suppliers(name)')
        .eq('entity_id', selectedEntity.id)
      
      // Get generated POs
      const { data: pos } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .eq('entity_id', selectedEntity.id)
        .eq('generated_by_system', true)
        .order('created_at', { ascending: false })
        .limit(10)
      
      // Create a running inventory tracker
      // Initialize with current stock levels
      const runningInventory = new Map<string, number>()
      parts?.forEach(part => {
        runningInventory.set(part.id, part.current_stock || 0)
      })
      
      // Analyze boats and requirements with cumulative consumption
      const boatAnalysis = boats?.map((boat, boatIndex) => {
        // Get MBOM from boat_type, not from boat itself
        const partsInMbom = boat.boat_types?.mbom?.parts || []
        const partIds = partsInMbom.map((p: any) => p.part_id)
        
        // Check which parts have supplier relationships
        const partsWithSuppliers = partIds.filter((partId: string) => 
          supplierParts?.some(sp => sp.part_id === partId)
        )
        
        // Check stock levels accounting for previous boats' consumption
        const partsData = partsInMbom.map((mbomPart: any) => {
          const part = parts?.find(p => p.id === mbomPart.part_id)
          const hasSupplier = supplierParts?.some(sp => sp.part_id === mbomPart.part_id)
          
          // Get the available stock BEFORE this boat (after previous boats consumed their parts)
          const availableStock = runningInventory.get(mbomPart.part_id) || 0
          const quantityNeeded = mbomPart.quantity_required
          const netRequirement = Math.max(0, quantityNeeded - availableStock)
          
          // Update running inventory by consuming this boat's requirement
          runningInventory.set(mbomPart.part_id, availableStock - quantityNeeded)
          
          return {
            part_id: mbomPart.part_id,
            part_name: mbomPart.part_name,
            quantity_needed: quantityNeeded,
            available_stock: availableStock,
            net_requirement: netRequirement,
            has_supplier: hasSupplier,
            supplier_count: supplierParts?.filter(sp => sp.part_id === mbomPart.part_id).length || 0
          }
        })
        
        return {
          boat_name: boat.name,
          status: boat.status,
          due_date: boat.due_date,
          parts_count: partsInMbom.length,
          parts_with_suppliers: partsWithSuppliers.length,
          parts_data: partsData,
          position_in_schedule: boatIndex + 1
        }
      })
      
      // Create final inventory summary (after all boats)
      const finalInventorySummary = Array.from(runningInventory.entries()).map(([partId, remainingStock]) => {
        const part = parts?.find(p => p.id === partId)
        return {
          part_id: partId,
          part_name: part?.name || 'Unknown',
          part_number: part?.part_number || 'Unknown',
          initial_stock: part?.current_stock || 0,
          final_stock: remainingStock,
          total_consumed: (part?.current_stock || 0) - remainingStock
        }
      }).filter(item => item.total_consumed !== 0)
        .sort((a, b) => a.final_stock - b.final_stock) // Sort by final stock (most negative first)
      
      setData({
        boats: boats || [],
        boatTypes: boatTypes || [],
        boatAnalysis,
        finalInventorySummary,
        parts: parts || [],
        suppliers: suppliers || [],
        supplierParts: supplierParts || [],
        pos: pos || []
      })
    } catch (error) {
      console.error('Error loading diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedEntity) {
    return <div className="max-w-7xl mx-auto px-6 py-8 font-mono text-gray-600">Please select an entity</div>
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-8 font-mono">Loading diagnostics...</div>
  }

  if (!data) {
    return <div className="max-w-7xl mx-auto px-6 py-8 font-mono text-red-600">Error loading data</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="font-mono text-3xl font-bold text-black mb-8">PO Generation Diagnostics</h1>
      
      <div className="space-y-6">
        {/* Summary Stats */}
        <Card title="Summary">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="font-mono text-2xl font-bold">{data.boats.length}</div>
              <div className="font-mono text-xs text-gray-600">Active Boats</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold">{data.parts.length}</div>
              <div className="font-mono text-xs text-gray-600">Total Parts</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold">{data.suppliers.length}</div>
              <div className="font-mono text-xs text-gray-600">Suppliers</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold">{data.supplierParts.length}</div>
              <div className="font-mono text-xs text-gray-600">Supplier-Part Links</div>
            </div>
          </div>
        </Card>

        {/* Boat Analysis */}
        <Card title="Boat Requirements Analysis">
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-600">
            <div className="font-mono text-sm text-blue-900">
              <strong>Cumulative Consumption Model:</strong> Parts availability accounts for previous boats in the schedule. 
              "Available" shows remaining stock after earlier boats consume their requirements. 
              Negative values indicate backorders that will affect subsequent boats.
            </div>
          </div>
          {data.boatAnalysis.map((boat: any, idx: number) => (
            <div key={idx} className="mb-6 pb-6 border-b border-gray-300 last:border-0">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-mono font-bold text-lg">
                    #{boat.position_in_schedule}: {boat.boat_name}
                  </h3>
                  <div className="font-mono text-sm text-gray-600">
                    Due: {new Date(boat.due_date).toLocaleDateString()} | Status: {boat.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">
                    {boat.parts_count} parts in MBOM
                  </div>
                  <div className={`font-mono text-sm ${
                    boat.parts_with_suppliers === boat.parts_count ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {boat.parts_with_suppliers} have suppliers
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead className="border-b-2 border-black">
                    <tr>
                      <th className="text-left py-2">Part</th>
                      <th className="text-right py-2">Needed</th>
                      <th className="text-right py-2">Available</th>
                      <th className="text-right py-2">Net Req</th>
                      <th className="text-center py-2">Supplier?</th>
                      <th className="text-right py-2"># Suppliers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boat.parts_data.map((part: any, pidx: number) => (
                      <tr key={pidx} className="border-b border-gray-200">
                        <td className="py-2">{part.part_name}</td>
                        <td className="text-right">{part.quantity_needed}</td>
                        <td className={`text-right ${
                          part.available_stock < 0 ? 'text-red-600 font-bold' : 
                          part.available_stock < part.quantity_needed ? 'text-orange-600' : 
                          'text-gray-900'
                        }`}>
                          {part.available_stock}
                        </td>
                        <td className={`text-right font-bold ${
                          part.net_requirement > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {part.net_requirement}
                        </td>
                        <td className="text-center">
                          {part.has_supplier ? 'Yes' : 'No'}
                        </td>
                        <td className="text-right">{part.supplier_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </Card>

        {/* Final Inventory Summary */}
        <Card title="Projected Inventory After All Scheduled Boats">
          {data.finalInventorySummary && data.finalInventorySummary.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-600">
                <div className="font-mono text-sm text-yellow-900">
                  <strong>Final Inventory Projection:</strong> Shows expected stock levels after fulfilling all scheduled boats. 
                  Negative values indicate parts that need to be ordered.
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead className="border-b-2 border-black">
                    <tr>
                      <th className="text-left py-2 px-2">Part Number</th>
                      <th className="text-left py-2 px-2">Part Name</th>
                      <th className="text-right py-2 px-2 w-28">Initial Stock</th>
                      <th className="text-right py-2 px-2 w-32">Total Consumed</th>
                      <th className="text-right py-2 px-2 w-28">Final Stock</th>
                      <th className="text-left py-2 px-2 w-40">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.finalInventorySummary.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-2 px-2">{item.part_number}</td>
                        <td className="py-2 px-2">{item.part_name}</td>
                        <td className="text-right py-2 px-2">{item.initial_stock}</td>
                        <td className="text-right py-2 px-2">{item.total_consumed}</td>
                        <td className={`text-right font-bold py-2 px-2 ${
                          item.final_stock < 0 ? 'text-red-600' : 
                          item.final_stock === 0 ? 'text-orange-600' : 
                          'text-green-600'
                        }`}>
                          {item.final_stock}
                        </td>
                        <td className="text-left py-2 px-2">
                          {item.final_stock < 0 ? (
                            <span className="text-red-600">Need {Math.abs(item.final_stock)} more</span>
                          ) : item.final_stock === 0 ? (
                            <span className="text-orange-600">Depleted</span>
                          ) : (
                            <span className="text-green-600">Sufficient</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="font-mono text-sm text-gray-600">No parts consumption detected for scheduled boats</div>
          )}
        </Card>

        {/* Missing Supplier Relationships */}
        <Card title="Parts Without Suppliers">
          {(() => {
            // Check all parts used in active boat types (not just scheduled boats)
            const allPartIds = new Set<string>()
            const partToBoatTypeMap = new Map<string, Set<string>>()
            
            data.boatTypes?.forEach((boatType: any) => {
              boatType.mbom?.parts?.forEach((part: any) => {
                allPartIds.add(part.part_id)
                if (!partToBoatTypeMap.has(part.part_id)) {
                  partToBoatTypeMap.set(part.part_id, new Set())
                }
                partToBoatTypeMap.get(part.part_id)?.add(boatType.name)
              })
            })
            
            const partsWithoutSuppliers = Array.from(allPartIds).filter(partId => 
              !data.supplierParts.some((sp: any) => sp.part_id === partId)
            ).map(partId => {
              const boatType = data.boatTypes?.find((bt: any) => 
                bt.mbom?.parts?.some((p: any) => p.part_id === partId)
              )
              const mbomPart = boatType?.mbom?.parts?.find((p: any) => p.part_id === partId)
              const usedInBoatTypes = partToBoatTypeMap.get(partId)
              
              return {
                part_id: partId,
                part_name: mbomPart?.part_name || 'Unknown',
                used_in_boat_types: Array.from(usedInBoatTypes || [])
              }
            })
            
            if (partsWithoutSuppliers.length === 0) {
              return <div className="font-mono text-sm text-green-600">All parts in active boat types have supplier relationships</div>
            }
            
            return (
              <div className="space-y-2">
                <div className="font-mono text-sm text-red-600 mb-3">
                  {partsWithoutSuppliers.length} parts need supplier relationships
                </div>
                {partsWithoutSuppliers.map((part: any, idx: number) => (
                  <div key={idx} className="font-mono text-sm border-l-4 border-red-600 pl-3 py-2">
                    <div className="font-bold">{part.part_name}</div>
                    <div className="text-xs text-gray-600">
                      Used in boat type(s): {part.used_in_boat_types.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </Card>

        {/* Recent Generated POs */}
        <Card title="Recently Generated POs">
          {data.pos.length === 0 ? (
            <div className="font-mono text-sm text-gray-600">No generated POs yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead className="border-b-2 border-black">
                  <tr>
                    <th className="text-left py-2">PO Number</th>
                    <th className="text-left py-2">Supplier</th>
                    <th className="text-left py-2">Order Date</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pos.map((po: any) => (
                    <tr key={po.id} className="border-b border-gray-200">
                      <td className="py-2">{po.po_number}</td>
                      <td>{po.suppliers?.name}</td>
                      <td>{new Date(po.order_date).toLocaleDateString()}</td>
                      <td className="text-right">${po.total_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
