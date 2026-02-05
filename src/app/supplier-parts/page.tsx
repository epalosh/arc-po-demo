'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SupplierPart, Supplier, Part } from '@/types/database'
import { useEntity } from '@/contexts/EntityContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'

type SupplierPartWithDetails = SupplierPart & {
  suppliers: { name: string } | null
  parts: { part_number: string; name: string } | null
}

export default function SupplierPartsPage() {
  const { selectedEntity } = useEntity()
  const [supplierParts, setSupplierParts] = useState<SupplierPartWithDetails[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplierPart, setEditingSupplierPart] = useState<SupplierPartWithDetails | null>(null)
  const [formData, setFormData] = useState({
    supplier_id: '',
    part_id: '',
    lead_time_days: 7,
    minimum_order_quantity: 1,
    batch_size: 1,
    price_per_unit: 0,
    is_preferred: false,
    max_monthly_capacity: null as number | null
  })

  useEffect(() => {
    if (selectedEntity) {
      loadData()
    }
  }, [selectedEntity])

  async function loadData() {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      
      const [supplierPartsRes, suppliersRes, partsRes] = await Promise.all([
        supabase
          .from('supplier_parts')
          .select('*, suppliers(name), parts(part_number, name)')
          .eq('entity_id', selectedEntity.id)
          .order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').eq('entity_id', selectedEntity.id).order('name'),
        supabase.from('parts').select('*').eq('entity_id', selectedEntity.id).order('part_number')
      ])
      
      if (supplierPartsRes.error) throw supplierPartsRes.error
      if (suppliersRes.error) throw suppliersRes.error
      if (partsRes.error) throw partsRes.error
      
      setSupplierParts(supplierPartsRes.data || [])
      setSuppliers(suppliersRes.data || [])
      setParts(partsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingSupplierPart(null)
    setFormData({
      supplier_id: '',
      part_id: '',
      lead_time_days: 7,
      minimum_order_quantity: 1,
      batch_size: 1,
      price_per_unit: 0,
      is_preferred: false,
      max_monthly_capacity: null
    })
    setIsModalOpen(true)
  }

  function openEditModal(supplierPart: SupplierPartWithDetails) {
    setEditingSupplierPart(supplierPart)
    setFormData({
      supplier_id: supplierPart.supplier_id,
      part_id: supplierPart.part_id,
      lead_time_days: supplierPart.lead_time_days,
      minimum_order_quantity: supplierPart.minimum_order_quantity,
      batch_size: supplierPart.batch_size,
      price_per_unit: supplierPart.price_per_unit,
      is_preferred: supplierPart.is_preferred,
      max_monthly_capacity: supplierPart.max_monthly_capacity
    })
    setIsModalOpen(true)
  }

  function handlePartSelection(partId: string) {
    const selectedPart = parts.find(p => p.id === partId)
    setFormData({ 
      ...formData, 
      part_id: partId,
      // Only autopopulate if creating new (not editing) and part has a unit cost
      price_per_unit: !editingSupplierPart && selectedPart?.unit_cost 
        ? selectedPart.unit_cost 
        : formData.price_per_unit
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedEntity) return
    
    try {
      if (editingSupplierPart) {
        const { error } = await supabase
          .from('supplier_parts')
          .update(formData)
          .eq('id', editingSupplierPart.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('supplier_parts')
          .insert([{ ...formData, entity_id: selectedEntity.id }])
        
        if (error) throw error
      }
      
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error('Error saving supplier part:', error)
      alert('Error saving supplier part')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this supplier-part relationship?')) return
    
    try {
      const { error } = await supabase
        .from('supplier_parts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error deleting supplier part:', error)
      alert('Error deleting supplier part')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-mono text-3xl font-bold text-black">Supplier Parts</h1>
        <Button onClick={openCreateModal} disabled={!selectedEntity}>Add Supplier-Part</Button>
      </div>

      {!selectedEntity ? (
        <div className="text-center py-12 font-mono text-gray-600">Please select an entity</div>
      ) : loading ? (
        <div className="text-center py-12 font-mono">Loading...</div>
      ) : (
        <div className="border border-black">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Supplier</TableHeader>
                <TableHeader>Part</TableHeader>
                <TableHeader>Lead Time</TableHeader>
                <TableHeader>MOQ</TableHeader>
                <TableHeader>Batch Size</TableHeader>
                <TableHeader>Price/Unit</TableHeader>
                <TableHeader>Preferred</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierParts.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell className="font-bold">{sp.suppliers?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {sp.parts?.part_number || 'Unknown'} - {sp.parts?.name || ''}
                  </TableCell>
                  <TableCell>{sp.lead_time_days} days</TableCell>
                  <TableCell>{sp.minimum_order_quantity}</TableCell>
                  <TableCell>{sp.batch_size}</TableCell>
                  <TableCell>${sp.price_per_unit.toFixed(2)}</TableCell>
                  <TableCell>{sp.is_preferred ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(sp)}
                        className="text-black hover:underline font-mono text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sp.id)}
                        className="text-red-600 hover:underline font-mono text-sm"
                      >
                        Delete
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplierPart ? 'Edit Supplier-Part' : 'Add New Supplier-Part'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSupplierPart ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Supplier *"
            value={formData.supplier_id}
            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            options={[
              { value: '', label: '-- Select Supplier --' },
              ...suppliers.map(s => ({ value: s.id, label: s.name }))
            ]}
            required
          />
          <Select
            label="Part *"
            value={formData.part_id}
            onChange={(e) => handlePartSelection(e.target.value)}
            options={[
              { value: '', label: '-- Select Part --' },
              ...parts.map(p => ({ value: p.id, label: `${p.part_number} - ${p.name}` }))
            ]}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Lead Time (days) *"
              type="number"
              value={formData.lead_time_days}
              onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })}
              required
            />
            <Input
              label="Min Order Qty *"
              type="number"
              value={formData.minimum_order_quantity}
              onChange={(e) => setFormData({ ...formData, minimum_order_quantity: parseInt(e.target.value) || 1 })}
              required
            />
            <Input
              label="Batch Size *"
              type="number"
              value={formData.batch_size}
              onChange={(e) => setFormData({ ...formData, batch_size: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price per Unit *"
              type="number"
              step="0.01"
              value={formData.price_per_unit}
              onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Max Monthly Capacity"
              type="number"
              value={formData.max_monthly_capacity || ''}
              onChange={(e) => setFormData({ ...formData, max_monthly_capacity: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_preferred"
              checked={formData.is_preferred}
              onChange={(e) => setFormData({ ...formData, is_preferred: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_preferred" className="font-mono text-sm text-black">
              Preferred Supplier
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
