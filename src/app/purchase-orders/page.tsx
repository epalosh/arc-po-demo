'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PurchaseOrder, PurchaseOrderLine } from '@/types/database'
import { useEntity } from '@/contexts/EntityContext'
import { generatePOPDF } from '@/lib/pdf-generator'
import { Button } from '@/components/ui/Button'

type POWithDetails = PurchaseOrder & {
  suppliers: { name: string } | null
}

type POLineWithDetails = PurchaseOrderLine & {
  parts: { part_number: string; name: string } | null
}

type ExpandedPOData = {
  lines: POLineWithDetails[]
  pdfUrl: string | null
  loadingPDF: boolean
}

export default function PurchaseOrdersPage() {
  const { selectedEntity } = useEntity()
  const [purchaseOrders, setPurchaseOrders] = useState<POWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPOs, setExpandedPOs] = useState<Record<string, ExpandedPOData>>({})
  const [selectedPOIds, setSelectedPOIds] = useState<Set<string>>(new Set())
  const [clearingPOs, setClearingPOs] = useState(false)
  const [downloadingBatch, setDownloadingBatch] = useState(false)

  useEffect(() => {
    if (selectedEntity) {
      loadPurchaseOrders()
      // Clear selections when entity changes
      setSelectedPOIds(new Set())
      // Clear expanded POs when entity changes
      setExpandedPOs({})
    }
  }, [selectedEntity])

  async function loadPurchaseOrders() {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .eq('entity_id', selectedEntity.id)
        .order('order_date', { ascending: false })
      
      if (error) throw error
      setPurchaseOrders(data || [])
    } catch (error) {
      console.error('Error loading purchase orders:', error)
      alert('Error loading purchase orders')
    } finally {
      setLoading(false)
    }
  }

  async function togglePOExpansion(po: POWithDetails) {
    const poId = po.id
    
    if (expandedPOs[poId]) {
      // Collapse - remove from expanded state
      const newExpanded = { ...expandedPOs }
      delete newExpanded[poId]
      setExpandedPOs(newExpanded)
      return
    }
    
    // Expand - load data and generate PDF
    try {
      // Initialize with loading state
      setExpandedPOs(prev => ({
        ...prev,
        [poId]: {
          lines: [],
          pdfUrl: null,
          loadingPDF: true
        }
      }))
      
      // Load PO lines
      const { data: lines, error: linesError } = await supabase
        .from('purchase_order_lines')
        .select('*, parts(part_number, name, description)')
        .eq('po_id', po.id)
      
      if (linesError) throw linesError
      
      // Load supplier details
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', po.supplier_id)
        .single()
      
      if (!supplier) throw new Error('Supplier not found')
      
      // Generate PDF blob
      const pdfData = {
        po_number: po.po_number,
        order_date: po.order_date,
        required_by_date: po.required_by_date,
        supplier: {
          name: supplier.name,
          contact_name: supplier.contact_name,
          address: supplier.address,
          phone: supplier.phone,
          email: supplier.email
        },
        lines: (lines || []).map(line => ({
          part_number: line.parts?.part_number || 'N/A',
          part_name: line.parts?.name || 'Unknown Part',
          description: line.parts?.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          line_total: line.line_total
        })),
        total_amount: po.total_amount,
        notes: po.notes,
        terms: supplier.payment_terms || undefined
      }
      
      const pdfBlob = await generatePOPDF(pdfData, false)
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Update with loaded data
      setExpandedPOs(prev => ({
        ...prev,
        [poId]: {
          lines: lines || [],
          pdfUrl,
          loadingPDF: false
        }
      }))
    } catch (error) {
      console.error('Error loading PO details:', error)
      alert('Error loading PO details')
      // Remove from expanded state on error
      const newExpanded = { ...expandedPOs }
      delete newExpanded[poId]
      setExpandedPOs(newExpanded)
    }
  }

  async function downloadPDF(po: POWithDetails) {
    try {
      // Get full supplier details
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', po.supplier_id)
        .single()
      
      // Get PO lines with part details
      const { data: lines } = await supabase
        .from('purchase_order_lines')
        .select('*, parts(part_number, name, description)')
        .eq('po_id', po.id)
      
      if (!supplier || !lines) {
        throw new Error('Failed to load PO data')
      }
      
      // Format data for PDF
      const pdfData = {
        po_number: po.po_number,
        order_date: po.order_date,
        required_by_date: po.required_by_date,
        supplier: {
          name: supplier.name,
          contact_name: supplier.contact_name,
          address: supplier.address,
          phone: supplier.phone,
          email: supplier.email
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
        terms: supplier.payment_terms || undefined
      }
      
      await generatePOPDF(pdfData, true)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function downloadSelectedPOs() {
    if (selectedPOIds.size === 0) {
      // No POs selected; do nothing
      return
    }

    try {
      setDownloadingBatch(true)
      const selectedPOs = purchaseOrders.filter(po => selectedPOIds.has(po.id))
      const pdfBlobs: { name: string, blob: Blob }[] = []
      for (const po of selectedPOs) {
        // Get full supplier details
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', po.supplier_id)
          .single()
        // Get PO lines with part details
        const { data: lines } = await supabase
          .from('purchase_order_lines')
          .select('*, parts(part_number, name, description)')
          .eq('po_id', po.id)
        if (!supplier || !lines) continue
        const pdfData = {
          po_number: po.po_number,
          order_date: po.order_date,
          required_by_date: po.required_by_date,
          supplier: {
            name: supplier.name,
            contact_name: supplier.contact_name,
            address: supplier.address,
            phone: supplier.phone,
            email: supplier.email
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
          terms: supplier.payment_terms || undefined
        }
        const pdfBlob = await generatePOPDF(pdfData, false)
        pdfBlobs.push({ name: `PO-${po.po_number}.pdf`, blob: pdfBlob })
      }
      if (pdfBlobs.length > 0) {
        const { downloadZip } = await import('@/lib/zip-download')
        await downloadZip(pdfBlobs, 'POs.zip')
      }
    } catch (error) {
      console.error('Error downloading PDFs:', error)
      alert('Error downloading PDFs')
    } finally {
      setDownloadingBatch(false)
    }
  }

  function toggleSelectPO(poId: string) {
    const newSelected = new Set(selectedPOIds)
    if (newSelected.has(poId)) {
      newSelected.delete(poId)
    } else {
      newSelected.add(poId)
    }
    setSelectedPOIds(newSelected)
  }

  function toggleSelectAll() {
    if (selectedPOIds.size === purchaseOrders.length) {
      setSelectedPOIds(new Set())
    } else {
      setSelectedPOIds(new Set(purchaseOrders.map(po => po.id)))
    }
  }

  async function clearAllPOs() {
    if (!selectedEntity) return
    // Confirmation popups removed; action proceeds immediately
    try {
      setClearingPOs(true)
      // Delete all PO lines first (foreign key constraint)
      const { error: linesError } = await supabase
        .from('purchase_order_lines')
        .delete()
        .eq('entity_id', selectedEntity.id)
      if (linesError) throw linesError
      // Delete all POs
      const { error: posError } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('entity_id', selectedEntity.id)
      if (posError) throw posError
      // Reset selected POs after clearing
      setSelectedPOIds(new Set())
      // Success alert removed; just reload
      await loadPurchaseOrders()
    } catch (error) {
      console.error('Error clearing POs:', error)
      alert('Error clearing purchase orders: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setClearingPOs(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'draft': return 'text-gray-600'
      case 'pending': return 'text-yellow-600'
      case 'approved': return 'text-blue-600'
      case 'ordered': return 'text-purple-600'
      case 'received': return 'text-green-600'
      case 'cancelled': return 'text-red-600'
      default: return 'text-black'
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-mono text-2xl font-bold text-black">Purchase Orders</h1>
        <div className="flex gap-2">
          {selectedPOIds.size > 0 && (
            <Button
              onClick={downloadSelectedPOs}
              disabled={downloadingBatch}
            >
              {downloadingBatch ? 'Downloading...' : `Download Selected (${selectedPOIds.size})`}
            </Button>
          )}
          {purchaseOrders.length > 0 && (
            <Button
              variant="secondary"
              onClick={clearAllPOs}
              disabled={clearingPOs || !selectedEntity}
            >
              {clearingPOs ? 'Clearing...' : 'Clear All POs'}
            </Button>
          )}
        </div>
      </div>

      {!selectedEntity ? (
        <div className="text-center py-8 font-mono text-sm text-gray-600">Please select an entity</div>
      ) : loading ? (
        <div className="text-center py-8 font-mono text-sm">Loading...</div>
      ) : purchaseOrders.length === 0 ? (
        <div className="text-center py-8 border border-gray-300">
          <p className="font-mono text-sm text-gray-600 mb-2">No purchase orders yet</p>
          <p className="font-mono text-xs text-gray-500">
            Generate purchase orders from the Generate POs page
          </p>
        </div>
      ) : (
        <div className="border border-black">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-3 bg-black text-white px-3 py-2 font-mono text-xs font-bold">
            <div className="col-span-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPOIds.size === purchaseOrders.length}
                onChange={toggleSelectAll}
                className="w-3 h-3 cursor-pointer"
              />
            </div>
            <div className="col-span-2">PO Number</div>
            <div className="col-span-2">Supplier</div>
            <div className="col-span-2">Order Date</div>
            <div className="col-span-2">Required By</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* PO Rows */}
          {purchaseOrders.map((po) => {
            const isExpanded = !!expandedPOs[po.id]
            const expandedData = expandedPOs[po.id]
            
            return (
              <div key={po.id} className="border-b border-gray-300 last:border-b-0">
                {/* Main Row */}
                <div 
                  className="grid grid-cols-12 gap-3 px-3 py-2 font-mono text-xs hover:bg-gray-50 cursor-pointer"
                  onClick={() => togglePOExpansion(po)}
                >
                  <div className="col-span-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPOIds.has(po.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleSelectPO(po.id)
                      }}
                      className="w-3 h-3 cursor-pointer"
                    />
                    <button
                      className="text-black hover:text-gray-600 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePOExpansion(po)
                      }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>
                  <div className="col-span-2 font-bold">{po.po_number}</div>
                  <div className="col-span-2">{po.suppliers?.name || 'Unknown'}</div>
                  <div className="col-span-2">{new Date(po.order_date).toLocaleDateString()}</div>
                  <div className="col-span-2">{new Date(po.required_by_date).toLocaleDateString()}</div>
                  <div className={`col-span-1 ${getStatusColor(po.status)}`}>
                    {po.status}
                  </div>
                  <div className="col-span-1 text-right font-bold">${po.total_amount.toFixed(2)}</div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadPDF(po)
                      }}
                      className="text-black hover:underline font-mono text-xs"
                    >
                      Download
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-300 p-4">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Left Side - PO Details */}
                      <div className="col-span-2 space-y-3">
                        <div className="bg-white border border-black p-3">
                          <h3 className="font-mono font-bold text-sm mb-3">Purchase Order Details</h3>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                            <div>
                              <div className="font-mono text-[10px] text-gray-600 mb-1">PO Number</div>
                              <div className="font-mono font-bold">{po.po_number}</div>
                            </div>
                            <div>
                              <div className="font-mono text-[10px] text-gray-600 mb-1">Status</div>
                              <div className={`font-mono font-bold ${getStatusColor(po.status)}`}>
                                {po.status.toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className="font-mono text-[10px] text-gray-600 mb-1">Order Date</div>
                              <div className="font-mono">{new Date(po.order_date).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <div className="font-mono text-[10px] text-gray-600 mb-1">Required By</div>
                              <div className="font-mono">{new Date(po.required_by_date).toLocaleDateString()}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="font-mono text-[10px] text-gray-600 mb-1">Supplier</div>
                              <div className="font-mono font-bold">{po.suppliers?.name}</div>
                            </div>
                            {po.generated_by_system && (
                              <div className="col-span-2">
                                <div className="font-mono text-[10px] text-gray-600 mb-1">System Generated</div>
                                <div className="font-mono">Yes</div>
                              </div>
                            )}
                            {po.notes && (
                              <div className="col-span-2">
                                <div className="font-mono text-[10px] text-gray-600 mb-1">Notes</div>
                                <div className="font-mono text-xs">{po.notes}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Line Items Table */}
                        <div className="bg-white border border-black">
                          <div className="px-3 py-2 border-b border-gray-300 bg-gray-50">
                            <h3 className="font-mono font-bold text-sm">Line Items</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="border-b border-black bg-gray-50">
                                <tr>
                                  <th className="px-2 py-1.5 text-left font-mono text-[10px] font-bold">Part Number</th>
                                  <th className="px-2 py-1.5 text-left font-mono text-[10px] font-bold">Part Name</th>
                                  <th className="px-2 py-1.5 text-right font-mono text-[10px] font-bold">Qty</th>
                                  <th className="px-2 py-1.5 text-right font-mono text-[10px] font-bold">Unit Price</th>
                                  <th className="px-2 py-1.5 text-right font-mono text-[10px] font-bold">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandedData?.lines.map((line) => (
                                  <tr key={line.id} className="border-b border-gray-200">
                                    <td className="px-2 py-1.5 font-mono text-[10px]">{line.parts?.part_number || 'N/A'}</td>
                                    <td className="px-2 py-1.5 font-mono text-[10px]">{line.parts?.name || 'Unknown'}</td>
                                    <td className="px-2 py-1.5 font-mono text-[10px] text-right">{line.quantity}</td>
                                    <td className="px-2 py-1.5 font-mono text-[10px] text-right">${line.unit_price.toFixed(2)}</td>
                                    <td className="px-2 py-1.5 font-mono text-[10px] text-right font-bold">
                                      ${line.line_total.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="border-t border-black bg-gray-100">
                                <tr>
                                  <td colSpan={4} className="px-2 py-2 font-mono text-xs font-bold text-right">
                                    TOTAL:
                                  </td>
                                  <td className="px-2 py-2 font-mono text-xs font-bold text-right">
                                    ${po.total_amount.toFixed(2)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - PDF Preview */}
                      <div className="col-span-1 bg-white border border-black">
                        <div className="px-3 py-2 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-mono font-bold text-sm">PDF Preview</h3>
                          <button
                            onClick={() => downloadPDF(po)}
                            className="font-mono text-xs text-black hover:underline"
                          >
                            Download
                          </button>
                        </div>
                        <div className="p-2" style={{ height: '700px' }}>
                          {expandedData?.loadingPDF ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="font-mono text-xs text-gray-600">Generating PDF preview...</div>
                            </div>
                          ) : expandedData?.pdfUrl ? (
                            <iframe
                              src={expandedData.pdfUrl}
                              className="w-full h-full border border-gray-300"
                              title={`PDF Preview for ${po.po_number}`}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="font-mono text-xs text-gray-600">Failed to load PDF</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
