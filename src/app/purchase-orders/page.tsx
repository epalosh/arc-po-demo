'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PurchaseOrder, PurchaseOrderLine } from '@/types/database'
import { useEntity } from '@/contexts/EntityContext'
import { generatePOPDF } from '@/lib/pdf-generator'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'

type POWithDetails = PurchaseOrder & {
  suppliers: { name: string } | null
}

type POLineWithDetails = PurchaseOrderLine & {
  parts: { part_number: string; name: string } | null
}

export default function PurchaseOrdersPage() {
  const { selectedEntity } = useEntity()
  const [purchaseOrders, setPurchaseOrders] = useState<POWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<POWithDetails | null>(null)
  const [poLines, setPOLines] = useState<POLineWithDetails[]>([])
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [clearingPOs, setClearingPOs] = useState(false)

  useEffect(() => {
    if (selectedEntity) {
      loadPurchaseOrders()
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

  async function viewDetails(po: POWithDetails) {
    try {
      setSelectedPO(po)
      
      const { data, error } = await supabase
        .from('purchase_order_lines')
        .select('*, parts(part_number, name, description)')
        .eq('po_id', po.id)
      
      if (error) throw error
      setPOLines(data || [])
      setIsDetailModalOpen(true)
    } catch (error) {
      console.error('Error loading PO lines:', error)
      alert('Error loading PO details')
    }
  }

  async function downloadPDF(po: POWithDetails) {
    try {
      setGeneratingPDF(true)
      
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
    } finally {
      setGeneratingPDF(false)
    }
  }

  async function clearAllPOs() {
    if (!selectedEntity) return
    
    const confirmMessage = `Are you sure you want to delete ALL ${purchaseOrders.length} purchase orders for ${selectedEntity.name}?\n\nThis action cannot be undone and will also delete all associated PO line items.`
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    // Double confirmation for safety
    if (!confirm('This is your final warning. Delete all POs?')) {
      return
    }
    
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
      
      alert(`Successfully deleted all ${purchaseOrders.length} purchase orders`)
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-mono text-3xl font-bold text-black">Purchase Orders</h1>
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

      {!selectedEntity ? (
        <div className="text-center py-12 font-mono text-gray-600">Please select an entity</div>
      ) : loading ? (
        <div className="text-center py-12 font-mono">Loading...</div>
      ) : purchaseOrders.length === 0 ? (
        <div className="text-center py-12 border border-gray-300">
          <p className="font-mono text-gray-600 mb-4">No purchase orders yet</p>
          <p className="font-mono text-sm text-gray-500">
            Generate purchase orders from the Generate POs page
          </p>
        </div>
      ) : (
        <div className="border border-black">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>PO Number</TableHeader>
                <TableHeader>Supplier</TableHeader>
                <TableHeader>Order Date</TableHeader>
                <TableHeader>Required By</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Total Amount</TableHeader>
                <TableHeader>System Gen</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-bold">{po.po_number}</TableCell>
                  <TableCell>{po.suppliers?.name || 'Unknown'}</TableCell>
                  <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(po.required_by_date).toLocaleDateString()}</TableCell>
                  <TableCell className={getStatusColor(po.status)}>
                    {po.status}
                  </TableCell>
                  <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{po.generated_by_system ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewDetails(po)}
                        className="text-black hover:underline font-mono text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => downloadPDF(po)}
                        disabled={generatingPDF}
                        className="text-black hover:underline font-mono text-sm disabled:text-gray-400"
                      >
                        PDF
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Purchase Order: ${selectedPO?.po_number}`}
        footer={
          <div className="flex gap-3">
            <Button 
              onClick={() => selectedPO && downloadPDF(selectedPO)} 
              disabled={generatingPDF || !selectedPO}
            >
              {generatingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedPO && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-300">
              <div>
                <div className="font-mono text-xs text-gray-600">Supplier</div>
                <div className="font-mono font-bold">{selectedPO.suppliers?.name}</div>
              </div>
              <div>
                <div className="font-mono text-xs text-gray-600">Status</div>
                <div className={`font-mono font-bold ${getStatusColor(selectedPO.status)}`}>
                  {selectedPO.status}
                </div>
              </div>
              <div>
                <div className="font-mono text-xs text-gray-600">Order Date</div>
                <div className="font-mono">{new Date(selectedPO.order_date).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="font-mono text-xs text-gray-600">Required By</div>
                <div className="font-mono">{new Date(selectedPO.required_by_date).toLocaleDateString()}</div>
              </div>
              {selectedPO.notes && (
                <div className="col-span-2">
                  <div className="font-mono text-xs text-gray-600">Notes</div>
                  <div className="font-mono text-sm">{selectedPO.notes}</div>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-mono font-bold mb-3">Line Items</h3>
              <div className="border border-gray-300">
                <table className="w-full">
                  <thead className="border-b border-gray-300 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-mono text-xs font-bold">Part</th>
                      <th className="px-3 py-2 text-right font-mono text-xs font-bold">Qty</th>
                      <th className="px-3 py-2 text-right font-mono text-xs font-bold">Unit Price</th>
                      <th className="px-3 py-2 text-right font-mono text-xs font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poLines.map((line) => (
                      <tr key={line.id} className="border-b border-gray-200">
                        <td className="px-3 py-2 font-mono text-xs">
                          {line.parts?.part_number} - {line.parts?.name}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-right">{line.quantity}</td>
                        <td className="px-3 py-2 font-mono text-xs text-right">${line.unit_price.toFixed(2)}</td>
                        <td className="px-3 py-2 font-mono text-xs text-right font-bold">
                          ${line.line_total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-black bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 font-mono text-xs font-bold text-right">
                        Total:
                      </td>
                      <td className="px-3 py-2 font-mono text-xs font-bold text-right">
                        ${selectedPO.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
