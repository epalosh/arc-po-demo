'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEntity } from '@/contexts/EntityContext'
import { RequirementsCalculator, RequirementsAnalysis } from '@/lib/requirements-calculator'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type ViewMode = 'all-parts' | 'by-supplier'

export default function ReviewRequirementsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedEntity } = useEntity()
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('by-supplier')
  const [analysis, setAnalysis] = useState<RequirementsAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set())
  const [safetyMargins, setSafetyMargins] = useState<Record<string, number>>({})
  const [showHorizonConfig, setShowHorizonConfig] = useState(false)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    if (selectedEntity) {
      loadRequirements()
    }
  }, [selectedEntity])

  async function loadRequirements(customStartDate?: string, customEndDate?: string) {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      setError(null)
      
      const calculator = new RequirementsCalculator(supabase, selectedEntity.id)
      const result = await calculator.calculate(0, customStartDate, customEndDate) // 0% safety stock
      
      setAnalysis(result)
      
      // Initialize safety margins for all parts (default 0%)
      const margins: Record<string, number> = {}
      result.parts.forEach(part => {
        margins[part.part_id] = 0
      })
      setSafetyMargins(margins)
    } catch (err) {
      console.error('Error calculating requirements:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate requirements')
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculateWithDates = () => {
    loadRequirements(startDate || undefined, endDate || undefined)
    setShowHorizonConfig(false)
  }

  const handleResetDates = () => {
    setStartDate('')
    setEndDate('')
    loadRequirements()
    setShowHorizonConfig(false)
  }

  const toggleRow = (partId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId)
    } else {
      newExpanded.add(partId)
    }
    setExpandedRows(newExpanded)
  }

  const toggleSupplier = (supplierId: string) => {
    const newExpanded = new Set(expandedSuppliers)
    if (newExpanded.has(supplierId)) {
      newExpanded.delete(supplierId)
    } else {
      newExpanded.add(supplierId)
    }
    setExpandedSuppliers(newExpanded)
  }

  const updateSafetyMargin = (partId: string, value: number) => {
    setSafetyMargins(prev => ({
      ...prev,
      [partId]: Math.max(0, Math.min(100, value))
    }))
  }

  const calculateNetWithMargin = (baseNetQty: number, currentStock: number, totalNeeded: number, margin: number) => {
    // Recalculate net quantity with custom margin
    const netQty = Math.max(0, totalNeeded - currentStock)
    return Math.ceil(netQty * (1 + margin / 100))
  }

  const getPartCostFromSuppliers = (partId: string) => {
    // Find this part in any supplier's parts list to get the cost
    if (!analysis) return 0
    for (const supplier of analysis.suppliers) {
      const supplierPart = supplier.parts.find(p => p.part_id === partId)
      if (supplierPart) {
        return supplierPart.unit_cost
      }
    }
    return 0
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
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 font-mono text-sm text-gray-600 hover:text-black transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="font-mono text-4xl font-bold text-black mb-2">Generate Purchase Orders</h1>
        <p className="font-mono text-sm text-gray-600">Review requirements and configure POs for each supplier</p>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg border border-black mb-6 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-mono text-2xl font-bold text-black">Summary</h3>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-500">Planning Horizon:</span>
            <span className="font-mono text-xs text-black">
              {new Date(analysis.planning_horizon_start).toLocaleDateString()} - {new Date(analysis.planning_horizon_end).toLocaleDateString()}
            </span>
            <button 
              onClick={() => setShowHorizonConfig(!showHorizonConfig)} 
              className="text-xs py-1 px-3 bg-black hover:bg-gray-800 text-white font-mono transition-colors ml-2 rounded"
            >
              {showHorizonConfig ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-6">
          <div className="bg-white rounded-lg p-4">
            <div className="font-mono text-3xl font-bold text-black mb-1">{analysis.total_boats}</div>
            <div className="font-mono text-xs text-gray-500 uppercase tracking-wide">Boats Scheduled</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="font-mono text-3xl font-bold text-black mb-1">{analysis.total_parts}</div>
            <div className="font-mono text-xs text-gray-500 uppercase tracking-wide">SKUs</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="font-mono text-3xl font-bold text-black mb-1">
              {analysis.parts.reduce((sum, part) => {
                const margin = safetyMargins[part.part_id] || 0
                const adjustedQty = calculateNetWithMargin(
                  part.net_quantity_needed,
                  part.current_stock,
                  part.total_quantity_needed,
                  margin
                )
                return sum + adjustedQty
              }, 0).toLocaleString()}
            </div>
            <div className="font-mono text-xs text-gray-500 uppercase tracking-wide">Total Parts</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="font-mono text-3xl font-bold text-black mb-1">{analysis.total_suppliers}</div>
            <div className="font-mono text-xs text-gray-500 uppercase tracking-wide">Suppliers</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="font-mono text-3xl font-bold text-black mb-1">${analysis.total_cost.toLocaleString()}</div>
            <div className="font-mono text-xs text-gray-500 uppercase tracking-wide">Total Cost</div>
          </div>
        </div>
        
        {/* Date Edit Popover */}
        {showHorizonConfig && (
          <div className="mt-6 bg-white rounded-lg p-6 border border-black">
            <div className="font-mono text-sm font-bold text-gray-900 mb-4">
              Adjust Planning Horizon
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-600">
              <div className="font-mono text-xs text-blue-900">
                Filter boats by due date range
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-mono text-xs font-semibold text-gray-700 mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm"
                />
                      </div>
              <div>
                <label className="font-mono text-xs font-semibold text-gray-700 mb-2 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Button 
                onClick={handleRecalculateWithDates}
                disabled={loading}
                className="flex-1 text-xs py-2"
              >
                {loading ? 'Applying...' : 'Apply'}
              </Button>
              <Button 
                onClick={handleResetDates}
                variant="secondary"
                disabled={loading}
                className="flex-1 text-xs py-2"
              >
                Reset
              </Button>
            </div>
            
            {(startDate || endDate) && (
              <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                <div className="font-mono text-xs text-green-900">
                  <strong>Filter:</strong> 
                  {startDate && ` From ${new Date(startDate).toLocaleDateString()}`}
                  {startDate && endDate && ' -'}
                  {endDate && ` To ${new Date(endDate).toLocaleDateString()}`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="mb-6 p-4 bg-green-50 rounded border-l-4 border-green-500">
        <div className="font-mono text-sm text-gray-700">
          <strong className="text-black">Next Steps:</strong> Review the parts and quantities below, then click "Configure POs" for each supplier to finalize your purchase orders.
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mt-8 mb-6 flex gap-2">
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
        <div className="space-y-3">
          {analysis.suppliers.map(supplier => {
            const isExpanded = expandedSuppliers.has(supplier.supplier_id)
            const totalCost = supplier.parts.reduce((sum, part) => {
              const margin = safetyMargins[part.part_id] || 0
              const adjustedQty = calculateNetWithMargin(
                part.net_quantity_needed,
                part.current_stock,
                part.total_quantity_needed,
                margin
              )
              return sum + (adjustedQty * part.unit_cost)
            }, 0)
            
            const totalParts = supplier.parts.reduce((sum, part) => {
              const margin = safetyMargins[part.part_id] || 0
              const adjustedQty = calculateNetWithMargin(
                part.net_quantity_needed,
                part.current_stock,
                part.total_quantity_needed,
                margin
              )
              return sum + adjustedQty
            }, 0)
            
            return (
              <Card key={supplier.supplier_id}>
                {/* Collapsible header */}
                <div 
                  className={`border-b border-gray-300 px-6 py-3 flex justify-between items-center -m-6 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'mb-6' : ''}`}
                  onClick={() => toggleSupplier(supplier.supplier_id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-lg text-gray-400">{isExpanded ? '−' : '+'}</span>
                    <h3 className="font-mono text-lg font-bold text-black">{supplier.supplier_name}</h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-mono text-base font-bold">${totalCost.toLocaleString()}</div>
                      <div className="font-mono text-xs text-gray-600">{supplier.total_parts} SKUs, {totalParts.toLocaleString()} Parts</div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/configure-po?supplier=${supplier.supplier_id}`)
                      }}
                    >
                      Configure POs →
                    </Button>
                  </div>
                </div>
                
                {/* Collapsible content */}
                {isExpanded && (
                  <>
                    <div className="mb-3 flex justify-between items-start">
                      <div className="font-mono text-xs text-gray-600">
                        {supplier.supplier_contact && <div>Contact: {supplier.supplier_contact}</div>}
                        {supplier.supplier_email && <div>Email: {supplier.supplier_email}</div>}
                        {supplier.supplier_phone && <div>Phone: {supplier.supplier_phone}</div>}
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-3">
                      <table className="w-full text-sm font-mono">
                  <thead className="border-b border-black bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2 w-8"></th>
                      <th className="text-left py-2 px-2">Part Number</th>
                      <th className="text-left py-2 px-2">Part Name</th>
                      <th className="text-right py-2 px-2">In Stock</th>
                      <th className="text-right py-2 px-2">Net Qty to Order</th>
                      <th className="text-right py-2 px-2">Unit Cost</th>
                      <th className="text-right py-2 px-2">Total Cost</th>
                      <th className="text-center py-2 px-2">Safety Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.parts.map(part => {
                      const isExpanded = expandedRows.has(part.part_id)
                      const margin = safetyMargins[part.part_id] || 0
                      const adjustedQty = calculateNetWithMargin(
                        part.net_quantity_needed,
                        part.current_stock,
                        part.total_quantity_needed,
                        margin
                      )
                      const adjustedCost = adjustedQty * part.unit_cost

                      return (
                        <Fragment key={part.part_id}>
                          <tr 
                            className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => toggleRow(part.part_id)}
                          >
                            <td className="py-2 px-2 text-gray-400">
                              {isExpanded ? '−' : '+'}
                            </td>
                            <td className="py-2 px-2 font-semibold">{part.part_number}</td>
                            <td className="py-2 px-2">{part.part_name}</td>
                            <td className="text-right py-2 px-2">{part.current_stock}</td>
                            <td className="text-right py-2 px-2 font-bold text-blue-600">{adjustedQty}</td>
                            <td className="text-right py-2 px-2">${part.unit_cost.toFixed(2)}</td>
                            <td className="text-right py-3 px-2 font-bold">${adjustedCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="text-center py-3 px-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  value={margin}
                                  onChange={(e) => updateSafetyMargin(part.part_id, parseFloat(e.target.value) || 0)}
                                  className="w-16 text-center text-sm"
                                  min="0"
                                  max="100"
                                  step="5"
                                />
                                <span className="text-xs">%</span>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-blue-50 border-b border-gray-200">
                              <td colSpan={8} className="py-2 px-3">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <div className="font-bold text-gray-700 mb-1">Quantity Details</div>
                                    <div className="space-y-0.5 text-gray-600">
                                      <div className="flex justify-between">
                                        <span>Total Quantity Needed:</span>
                                        <span className="font-semibold">{part.total_quantity_needed}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Current Stock:</span>
                                        <span className="font-semibold">{part.current_stock}</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-0.5">
                                        <span>Base Net Requirement:</span>
                                        <span className="font-semibold">{Math.max(0, part.total_quantity_needed - part.current_stock)}</span>
                                      </div>
                                      <div className="flex justify-between text-blue-700">
                                        <span>Safety Margin ({margin}%):</span>
                                        <span className="font-semibold">+{adjustedQty - Math.max(0, part.total_quantity_needed - part.current_stock)}</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-0.5 font-bold text-blue-600">
                                        <span>Final Order Quantity:</span>
                                        <span>{adjustedQty}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-700 mb-1">Supplier & Timing</div>
                                    <div className="space-y-0.5 text-gray-600">
                                      <div className="flex justify-between">
                                        <span>Lead Time:</span>
                                        <span className="font-semibold">{part.lead_time_days} days</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Batch Size:</span>
                                        <span className="font-semibold">{part.batch_size}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Min Order Qty:</span>
                                        <span className="font-semibold">{part.minimum_order_quantity}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Earliest Need Date:</span>
                                        <span className="font-semibold">
                                          {new Date(parseInt(part.earliest_need_date)).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Latest Need Date:</span>
                                        <span className="font-semibold">
                                          {new Date(parseInt(part.latest_need_date)).toLocaleDateString()}
                                        </span>
                                      </div>
                                      {part.is_preferred && (
                                        <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-center">
                                          Preferred Supplier
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-blue-200">
                                  <div className="font-bold text-gray-700 mb-2">Boats Requiring This Part</div>
                                  <div className="space-y-1 text-gray-600">
                                    {part.boats_needing.map((boat, idx) => (
                                      <div key={idx} className="flex justify-between text-xs">
                                        <span>{boat.boat_name}</span>
                                        <span className="flex gap-4">
                                          <span>Qty: <span className="font-semibold">{boat.quantity}</span></span>
                                          <span>Need by: <span className="font-semibold">{new Date(boat.need_by_date).toLocaleDateString()}</span></span>
                                          <span>Due: <span className="font-semibold">{new Date(boat.due_date).toLocaleDateString()}</span></span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
                  </>
                )}
            </Card>
            )
          })}
        </div>
      )}

      {/* View: All Parts */}
      {viewMode === 'all-parts' && (
        <Card title="All Parts Required">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead className="border-b-2 border-black bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-2 w-8"></th>
                  <th className="text-left py-3 px-2">Part Number</th>
                  <th className="text-left py-3 px-2">Part Name</th>
                  <th className="text-right py-3 px-2">In Stock</th>
                  <th className="text-right py-3 px-2">Net Qty to Order</th>
                  <th className="text-right py-3 px-2">Unit Cost</th>
                  <th className="text-right py-3 px-2">Total Cost</th>
                  <th className="text-center py-3 px-2">Safety Margin</th>
                </tr>
              </thead>
              <tbody>
                {analysis.parts.map(part => {
                  const isExpanded = expandedRows.has(part.part_id)
                  const margin = safetyMargins[part.part_id] || 0
                  const adjustedQty = calculateNetWithMargin(
                    part.net_quantity_needed,
                    part.current_stock,
                    part.total_quantity_needed,
                    margin
                  )
                  const unitCost = getPartCostFromSuppliers(part.part_id)
                  const adjustedCost = adjustedQty * unitCost

                  return (
                    <Fragment key={part.part_id}>
                      <tr 
                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleRow(part.part_id)}
                      >
                        <td className="py-3 px-2 text-gray-400">
                          {isExpanded ? '−' : '+'}
                        </td>
                        <td className="py-3 px-2 font-semibold">{part.part_number}</td>
                        <td className="py-3 px-2">{part.part_name}</td>
                        <td className="text-right py-3 px-2">{part.current_stock}</td>
                        <td className="text-right py-3 px-2 font-bold text-blue-600">{adjustedQty}</td>
                        <td className="text-right py-3 px-2">${unitCost.toFixed(2)}</td>
                        <td className="text-right py-3 px-2 font-bold">${adjustedCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="text-center py-3 px-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              value={margin}
                              onChange={(e) => updateSafetyMargin(part.part_id, parseFloat(e.target.value) || 0)}
                              className="w-16 text-center text-sm"
                              min="0"
                              max="100"
                              step="5"
                            />
                            <span className="text-xs">%</span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-blue-50 border-b border-gray-200">
                          <td colSpan={8} className="py-4 px-6">
                            <div className="grid grid-cols-2 gap-6 text-xs">
                              <div>
                                <div className="font-bold text-gray-700 mb-2">Quantity Details</div>
                                <div className="space-y-1 text-gray-600">
                                  <div className="flex justify-between">
                                    <span>Total Quantity Needed:</span>
                                    <span className="font-semibold">{part.total_quantity_needed}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Current Stock:</span>
                                    <span className="font-semibold">{part.current_stock}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-1">
                                    <span>Base Net Requirement:</span>
                                    <span className="font-semibold">{Math.max(0, part.total_quantity_needed - part.current_stock)}</span>
                                  </div>
                                  <div className="flex justify-between text-blue-700">
                                    <span>Safety Margin ({margin}%):</span>
                                    <span className="font-semibold">+{adjustedQty - Math.max(0, part.total_quantity_needed - part.current_stock)}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-1 font-bold text-blue-600">
                                    <span>Final Order Quantity:</span>
                                    <span>{adjustedQty}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-gray-700 mb-2">Timing Information</div>
                                <div className="space-y-1 text-gray-600">
                                  <div className="flex justify-between">
                                    <span>Earliest Need Date:</span>
                                    <span className="font-semibold">
                                      {new Date(parseInt(part.earliest_need_date)).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Latest Need Date:</span>
                                    <span className="font-semibold">
                                      {new Date(parseInt(part.latest_need_date)).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Number of Boats:</span>
                                    <span className="font-semibold">{part.boats_needing.length}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-blue-200">
                              <div className="font-bold text-gray-700 mb-2">Boats Requiring This Part</div>
                              <div className="space-y-1 text-gray-600">
                                {part.boats_needing.map((boat, idx) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span>{boat.boat_name}</span>
                                    <span className="flex gap-4">
                                      <span>Qty: <span className="font-semibold">{boat.quantity}</span></span>
                                      <span>Need by: <span className="font-semibold">{new Date(boat.need_by_date).toLocaleDateString()}</span></span>
                                      <span>Due: <span className="font-semibold">{new Date(boat.due_date).toLocaleDateString()}</span></span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
