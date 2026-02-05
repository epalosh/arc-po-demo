'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEntity } from '@/contexts/EntityContext'
import { POGenerator } from '@/lib/po-generator'
import { generatePOPDF } from '@/lib/pdf-generator'
import { GenerationParameters } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function GeneratePage() {
  const router = useRouter()
  const { selectedEntity } = useEntity()
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusMessages, setStatusMessages] = useState<string[]>([])
  const [exportingPDFs, setExportingPDFs] = useState(false)
  
  const [parameters, setParameters] = useState<GenerationParameters>({
    planning_horizon_months: 3,
    max_pos_per_supplier_per_month: 5,
    prefer_batch_optimization: true,
    safety_stock_percentage: 10
  })

  const addStatusMessage = (message: string) => {
    setStatusMessages(prev => [...prev, message])
  }

  const handleGenerate = async () => {
    if (!selectedEntity) {
      alert('Please select an entity first')
      return
    }
    
    setGenerating(true)
    setResult(null)
    setError(null)
    setStatusMessages([])
    
    try {
      addStatusMessage('Starting PO generation...')
      
      const generator = new POGenerator(supabase, selectedEntity.id)
      
      addStatusMessage('Analyzing production schedule...')
      addStatusMessage('Calculating part requirements...')
      addStatusMessage('Matching with suppliers...')
      addStatusMessage('Creating purchase orders...')
      
      const generationResult = await generator.generate(parameters)
      
      addStatusMessage(`✓ Successfully generated ${generationResult.pos_generated} purchase orders`)
      addStatusMessage(`✓ Total value: $${generationResult.total_amount.toLocaleString()}`)
      addStatusMessage(`✓ Execution time: ${generationResult.execution_time_ms}ms`)
      
      setResult(generationResult)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during generation')
      addStatusMessage(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleClearOldPOs = async () => {
    if (!selectedEntity) {
      alert('Please select an entity first')
      return
    }
    
    if (!confirm('Are you sure you want to delete all system-generated purchase orders for this entity?')) {
      return
    }
    
    try {
      // Delete all system-generated POs for this entity
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('generated_by_system', true)
        .eq('entity_id', selectedEntity.id)
      
      if (error) throw error
      
      alert('All system-generated purchase orders for this entity have been deleted.')
    } catch (err) {
      console.error('Error clearing POs:', err)
      alert('Error clearing purchase orders: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleExportAllPDFs = async () => {
    if (!result?.generation_run_id) return
    
    try {
      setExportingPDFs(true)
      
      // Get all POs from this generation run
      const { data: pos, error: posError } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(*)')
        .eq('generation_run_id', result.generation_run_id)
      
      if (posError) throw posError
      if (!pos || pos.length === 0) {
        alert('No purchase orders found')
        return
      }
      
      // Generate PDFs for each PO
      for (const po of pos) {
        // Get PO lines
        const { data: lines } = await supabase
          .from('purchase_order_lines')
          .select('*, parts(part_number, name, description)')
          .eq('po_id', po.id)
        
        if (!lines) continue
        
        const pdfData = {
          po_number: po.po_number,
          order_date: po.order_date,
          required_by_date: po.required_by_date,
          supplier: {
            name: po.suppliers.name,
            contact_name: po.suppliers.contact_name,
            address: po.suppliers.address,
            phone: po.suppliers.phone,
            email: po.suppliers.email
          },
          lines: lines.map(line => ({
            part_number: line.parts?.part_number || 'N/A',
            part_name: line.parts?.name || 'Unknown Part',
            description: line.parts?.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_total: line.line_total
          })),
          total_amount: po.total_amount,
          notes: po.notes,
          terms: po.suppliers.payment_terms || undefined
        }
        
        await generatePOPDF(pdfData, true)
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      alert(`Successfully exported ${pos.length} PO PDFs`)
    } catch (err) {
      console.error('Error exporting PDFs:', err)
      alert('Error exporting PDFs: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setExportingPDFs(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="font-mono text-3xl font-bold text-black mb-2">Generate Purchase Orders</h1>
      <p className="font-mono text-sm text-gray-600 mb-8">
        Automatically generate optimized purchase orders based on production schedule and inventory
      </p>
      
      {!selectedEntity ? (
        <Card>
          <div className="text-center py-12 font-mono text-gray-600">
            Please select an entity to generate purchase orders
          </div>
        </Card>
      ) : (
      <div className="grid grid-cols-1 gap-6">
        {/* Configuration Panel */}
        <Card title="Configuration">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Planning Horizon (months)"
              type="number"
              min="1"
              max="12"
              value={parameters.planning_horizon_months}
              onChange={(e) => setParameters({
                ...parameters,
                planning_horizon_months: parseInt(e.target.value) || 1
              })}
            />
            <Input
              label="Max POs per Supplier per Month"
              type="number"
              min="1"
              max="20"
              value={parameters.max_pos_per_supplier_per_month}
              onChange={(e) => setParameters({
                ...parameters,
                max_pos_per_supplier_per_month: parseInt(e.target.value) || 1
              })}
            />
            <Input
              label="Safety Stock Percentage"
              type="number"
              min="0"
              max="100"
              value={parameters.safety_stock_percentage}
              onChange={(e) => setParameters({
                ...parameters,
                safety_stock_percentage: parseInt(e.target.value) || 0
              })}
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 font-mono text-sm">
                <input
                  type="checkbox"
                  checked={parameters.prefer_batch_optimization}
                  onChange={(e) => setParameters({
                    ...parameters,
                    prefer_batch_optimization: e.target.checked
                  })}
                  className="w-4 h-4 border-black"
                />
                Optimize for batch sizes
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button 
              onClick={handleGenerate} 
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Purchase Orders'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleClearOldPOs}
              disabled={generating}
            >
              Clear Old POs
            </Button>
          </div>
        </Card>

        {/* Status Panel */}
        {(generating || statusMessages.length > 0) && (
          <Card title="Status">
            <div className="space-y-2">
              {statusMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`font-mono text-sm ${
                    message.startsWith('✓') ? 'text-green-600' :
                    message.startsWith('✗') ? 'text-red-600' :
                    'text-black'
                  }`}
                >
                  {message}
                </div>
              ))}
              {generating && (
                <div className="font-mono text-sm text-black animate-pulse">
                  Processing...
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Error Panel */}
        {error && (
          <Card>
            <div className="bg-red-50 border border-red-600 p-4">
              <div className="font-mono text-sm font-bold text-red-900 mb-2">Error</div>
              <div className="font-mono text-sm text-red-800">{error}</div>
            </div>
          </Card>
        )}

        {/* Results Panel */}
        {result && (
          <Card title="Generation Results">
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div>
                <div className="font-mono text-3xl font-bold text-black">
                  {result.pos_generated}
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  Purchase Orders
                </div>
              </div>
              <div>
                <div className="font-mono text-3xl font-bold text-green-600">
                  ${result.total_amount.toLocaleString()}
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  Total Value
                </div>
              </div>
              <div>
                <div className="font-mono text-3xl font-bold text-blue-600">
                  {result.execution_time_ms}ms
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  Execution Time
                </div>
              </div>
              <div>
                <div className="font-mono text-3xl font-bold text-black">
                  {result.purchase_orders?.length || 0}
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  Suppliers
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={() => router.push('/purchase-orders')}>
                View Purchase Orders
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleExportAllPDFs}
                disabled={exportingPDFs}
              >
                {exportingPDFs ? 'Exporting PDFs...' : 'Export All PDFs'}
              </Button>
            </div>
          </Card>
        )}

        {/* Information Panel */}
        <Card title="How It Works">
          <div className="space-y-4">
            <p className="font-mono text-sm text-gray-700">
              The PO generation algorithm analyzes your production schedule and automatically creates
              purchase orders that ensure parts arrive just-in-time for manufacturing.
            </p>
            
            <div className="border border-gray-300 bg-gray-50 p-4">
              <div className="font-mono text-xs font-bold text-black mb-3">Algorithm Steps:</div>
              <ol className="font-mono text-xs text-gray-700 space-y-2 list-decimal list-inside">
                <li>Analyzes all scheduled boats and their MBOMs (Manufacturing Bill of Materials)</li>
                <li>Calculates when parts are needed based on due dates and manufacturing times</li>
                <li>Nets requirements against current inventory levels</li>
                <li>Applies safety stock buffer to prevent stockouts</li>
                <li>Matches parts with preferred suppliers considering lead times</li>
                <li>Optimizes order quantities based on batch sizes and MOQs</li>
                <li>Calculates order dates to ensure on-time arrival</li>
                <li>Groups orders by supplier and month for efficient purchasing</li>
              </ol>
            </div>
            
            <div className="border-l-4 border-black pl-4">
              <div className="font-mono text-xs font-bold text-black mb-1">Note</div>
              <div className="font-mono text-xs text-gray-700">
                Generated POs are created in "draft" status. Review them in the Purchase Orders page
                before marking as approved or ordered.
              </div>
            </div>
          </div>
        </Card>
      </div>
      )}
    </div>
  )
}

