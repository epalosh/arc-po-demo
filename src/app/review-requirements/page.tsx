'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEntity } from '@/contexts/EntityContext'
import { RequirementsCalculator, RequirementsAnalysis } from '@/lib/requirements-calculator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type ViewMode = 'all-parts' | 'by-supplier'

export default function ReviewRequirementsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedEntity } = useEntity()
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('by-supplier')
  const [analysis, setAnalysis] = useState<RequirementsAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedEntity) {
      loadRequirements()
    }
  }, [selectedEntity])

  async function loadRequirements() {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      setError(null)
      
      const calculator = new RequirementsCalculator(supabase, selectedEntity.id)
      const result = await calculator.calculate(10) // 10% safety stock
      
      setAnalysis(result)
    } catch (err) {
      console.error('Error calculating requirements:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate requirements')
    } finally {
      setLoading(false)
    }
  }

  if (!selectedEntity) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 font-mono text-gray-600">
        Please select an entity
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 font-mono">
        Calculating requirements...
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="font-mono text-red-600 mb-4">
          {error || 'Failed to load requirements'}
        </div>
        <Button onClick={() => router.push('/generate')}>
          Back to Generate
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-mono text-3xl font-bold text-black">Review Requirements</h1>
        <Button onClick={() => router.push('/generate')} variant="secondary">
          ← Back
        </Button>
      </div>

      {/* Summary Stats */}
      <Card title="Summary">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div>
            <div className="font-mono text-2xl font-bold">{analysis.total_boats}</div>
            <div className="font-mono text-xs text-gray-600">Boats Scheduled</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold">{analysis.total_parts}</div>
            <div className="font-mono text-xs text-gray-600">Parts to Order</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold">{analysis.total_suppliers}</div>
            <div className="font-mono text-xs text-gray-600">Suppliers</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold">${analysis.total_cost.toLocaleString()}</div>
            <div className="font-mono text-xs text-gray-600">Total Cost</div>
          </div>
          <div>
            <div className="font-mono text-xs text-gray-600">Planning Horizon</div>
            <div className="font-mono text-sm">
              {new Date(analysis.planning_horizon_start).toLocaleDateString()} - {new Date(analysis.planning_horizon_end).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 border-l-4 border-blue-600">
          <div className="font-mono text-sm text-blue-900">
            <strong>Next Steps:</strong> Review the requirements below, then click "Configure POs" for each supplier to customize your purchase orders.
          </div>
        </div>
      </Card>

      {/* View Mode Toggle */}
      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => setViewMode('by-supplier')}
          variant={viewMode === 'by-supplier' ? 'primary' : 'secondary'}
        >
          Grouped by Supplier
        </Button>
        <Button
          onClick={() => setViewMode('all-parts')}
          variant={viewMode === 'all-parts' ? 'primary' : 'secondary'}
        >
          All Parts
        </Button>
      </div>

      {/* View: Grouped by Supplier */}
      {viewMode === 'by-supplier' && (
        <div className="space-y-6">
          {analysis.suppliers.map(supplier => (
            <Card key={supplier.supplier_id} title={supplier.supplier_name}>
              <div className="mb-4 flex justify-between items-start">
                <div className="font-mono text-sm text-gray-600">
                  {supplier.supplier_contact && <div>Contact: {supplier.supplier_contact}</div>}
                  {supplier.supplier_email && <div>Email: {supplier.supplier_email}</div>}
                  {supplier.supplier_phone && <div>Phone: {supplier.supplier_phone}</div>}
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg font-bold">${supplier.total_cost.toLocaleString()}</div>
                  <div className="font-mono text-xs text-gray-600">{supplier.total_parts} parts</div>
                </div>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs font-mono">
                  <thead className="border-b-2 border-black">
                    <tr>
                      <th className="text-left py-3">Part Number</th>
                      <th className="text-left py-3">Part Name</th>
                      <th className="text-right py-3">Qty Needed</th>
                      <th className="text-right py-3">In Stock</th>
                      <th className="text-right py-3">Net Qty</th>
                      <th className="text-right py-3">Unit Cost</th>
                      <th className="text-right py-3">Total Cost</th>
                      <th className="text-left py-3">Earliest Need</th>
                      <th className="text-center py-3">Lead Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.parts.map(part => (
                      <tr key={part.part_id} className="border-b border-gray-200">
                        <td className="py-3">{part.part_number}</td>
                        <td className="py-3">{part.part_name}</td>
                        <td className="text-right py-3">{part.total_quantity_needed}</td>
                        <td className="text-right py-3">{part.current_stock}</td>
                        <td className="text-right font-bold py-3">{part.net_quantity_needed}</td>
                        <td className="text-right py-3">${part.unit_cost.toFixed(2)}</td>
                        <td className="text-right font-bold py-3">${part.total_cost.toLocaleString()}</td>
                        <td className="text-left py-3">
                          {new Date(parseInt(part.earliest_need_date)).toLocaleDateString()}
                        </td>
                        <td className="text-center py-3">{part.lead_time_days}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => router.push(`/configure-po?supplier=${supplier.supplier_id}`)}
                >
                  Configure POs for {supplier.supplier_name} →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View: All Parts */}
      {viewMode === 'all-parts' && (
        <Card title="All Parts Required">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead className="border-b-2 border-black">
                <tr>
                  <th className="text-left py-3">Part Number</th>
                  <th className="text-left py-3">Part Name</th>
                  <th className="text-right py-3">Total Needed</th>
                  <th className="text-right py-3">In Stock</th>
                  <th className="text-right py-3">Net to Order</th>
                  <th className="text-left py-3">Earliest Need</th>
                  <th className="text-left py-3">Latest Need</th>
                  <th className="text-right py-3"># Boats</th>
                </tr>
              </thead>
              <tbody>
                {analysis.parts.map(part => (
                  <tr key={part.part_id} className="border-b border-gray-200">
                    <td className="py-3">{part.part_number}</td>
                    <td className="py-3">{part.part_name}</td>
                    <td className="text-right py-3">{part.total_quantity_needed}</td>
                    <td className="text-right py-3">{part.current_stock}</td>
                    <td className="text-right font-bold text-red-600 py-3">
                      {part.net_quantity_needed}
                    </td>
                    <td className="text-left py-3">
                      {new Date(parseInt(part.earliest_need_date)).toLocaleDateString()}
                    </td>
                    <td className="text-left py-3">
                      {new Date(parseInt(part.latest_need_date)).toLocaleDateString()}
                    </td>
                    <td className="text-right py-3">{part.boats_needing.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
