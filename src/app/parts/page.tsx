'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Part } from '@/types/database'
import { useEntity } from '@/contexts/EntityContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'

export default function PartsPage() {
  const { selectedEntity } = useEntity()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [formData, setFormData] = useState({
    part_number: '',
    name: '',
    description: '',
    category: '',
    current_stock: 0,
    unit_of_measure: 'EA',
    unit_cost: 0,
    reorder_point: 0
  })

  useEffect(() => {
    if (selectedEntity) {
      loadParts()
    }
  }, [selectedEntity])

  async function loadParts() {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('entity_id', selectedEntity.id)
        .order('part_number')
      
      if (error) throw error
      setParts(data || [])
    } catch (error) {
      console.error('Error loading parts:', error)
      alert('Error loading parts')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingPart(null)
    setFormData({
      part_number: '',
      name: '',
      description: '',
      category: '',
      current_stock: 0,
      unit_of_measure: 'EA',
      unit_cost: 0,
      reorder_point: 0
    })
    setIsModalOpen(true)
  }

  function openEditModal(part: Part) {
    setEditingPart(part)
    setFormData({
      part_number: part.part_number,
      name: part.name,
      description: part.description || '',
      category: part.category || '',
      current_stock: part.current_stock,
      unit_of_measure: part.unit_of_measure,
      unit_cost: part.unit_cost,
      reorder_point: part.reorder_point
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedEntity) return
    
    try {
      if (editingPart) {
        const { error } = await supabase
          .from('parts')
          .update(formData)
          .eq('id', editingPart.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('parts')
          .insert([{ ...formData, entity_id: selectedEntity.id }])
        
        if (error) throw error
      }
      
      setIsModalOpen(false)
      loadParts()
    } catch (error) {
      console.error('Error saving part:', error)
      alert('Error saving part')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this part?')) return
    
    try {
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      loadParts()
    } catch (error) {
      console.error('Error deleting part:', error)
      alert('Error deleting part')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-mono text-3xl font-bold text-black">Parts Inventory</h1>
        <Button onClick={openCreateModal} disabled={!selectedEntity}>Add Part</Button>
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
                <TableHeader>Part Number</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Stock</TableHeader>
                <TableHeader>Unit Cost</TableHeader>
                <TableHeader>Reorder Point</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {parts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-bold">{part.part_number}</TableCell>
                  <TableCell>{part.name}</TableCell>
                  <TableCell>{part.category || '-'}</TableCell>
                  <TableCell className={part.current_stock <= part.reorder_point ? 'text-red-600 font-bold' : ''}>
                    {part.current_stock} {part.unit_of_measure}
                  </TableCell>
                  <TableCell>${part.unit_cost.toFixed(2)}</TableCell>
                  <TableCell>{part.reorder_point}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(part)}
                        className="text-black hover:underline font-mono text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(part.id)}
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
        title={editingPart ? 'Edit Part' : 'Add New Part'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPart ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Part Number *"
            value={formData.part_number}
            onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
            required
          />
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <Input
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Stock *"
              type="number"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
              required
            />
            <Input
              label="Unit of Measure *"
              value={formData.unit_of_measure}
              onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Cost *"
              type="number"
              step="0.01"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Reorder Point *"
              type="number"
              value={formData.reorder_point}
              onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
