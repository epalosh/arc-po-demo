'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BoatType, Part, MBOMPart } from '@/types/database'
import { useEntity } from '@/contexts/EntityContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'

export default function BoatTypesPage() {
  const { selectedEntity } = useEntity()
  const [boatTypes, setBoatTypes] = useState<BoatType[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<BoatType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    description: '',
    default_manufacturing_time_days: 7,
    is_active: true,
    notes: ''
  })
  const [mbomParts, setMbomParts] = useState<MBOMPart[]>([])
  const [selectedPartId, setSelectedPartId] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (selectedEntity) {
      loadData()
    }
  }, [selectedEntity])

  async function loadData() {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      const [typesRes, partsRes] = await Promise.all([
        supabase.from('boat_types').select('*').eq('entity_id', selectedEntity.id).order('model'),
        supabase.from('parts').select('*').eq('entity_id', selectedEntity.id).order('part_number')
      ])
      
      if (typesRes.error) throw typesRes.error
      if (partsRes.error) throw partsRes.error
      
      setBoatTypes(typesRes.data || [])
      setParts(partsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingType(null)
    setFormData({
      name: '',
      model: '',
      description: '',
      default_manufacturing_time_days: 7,
      is_active: true,
      notes: ''
    })
    setMbomParts([])
    setIsModalOpen(true)
  }

  function openEditModal(type: BoatType) {
    setEditingType(type)
    setFormData({
      name: type.name,
      model: type.model,
      description: type.description || '',
      default_manufacturing_time_days: type.default_manufacturing_time_days,
      is_active: type.is_active,
      notes: type.notes || ''
    })
    setMbomParts(type.mbom?.parts || [])
    setIsModalOpen(true)
  }

  function addPartToMbom() {
    if (!selectedPartId || quantity <= 0) return
    
    const part = parts.find(p => p.id === selectedPartId)
    if (!part) return
    
    const existingIndex = mbomParts.findIndex(p => p.part_id === selectedPartId)
    if (existingIndex >= 0) {
      const updated = [...mbomParts]
      updated[existingIndex].quantity_required = quantity
      setMbomParts(updated)
    } else {
      setMbomParts([
        ...mbomParts,
        {
          part_id: selectedPartId,
          quantity_required: quantity,
          part_name: `${part.part_number} - ${part.name}`
        }
      ])
    }
    
    setSelectedPartId('')
    setQuantity(1)
  }

  function updatePartQuantity(partId: string, newQuantity: number) {
    setMbomParts(mbomParts.map(p => 
      p.part_id === partId ? { ...p, quantity_required: newQuantity } : p
    ))
  }

  function removePartFromMbom(partId: string) {
    setMbomParts(mbomParts.filter(p => p.part_id !== partId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedEntity) return
    
    try {
      const dataToSave = {
        ...formData,
        mbom: { parts: mbomParts }
      }
      
      if (editingType) {
        const { error } = await supabase
          .from('boat_types')
          .update(dataToSave)
          .eq('id', editingType.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('boat_types')
          .insert([{ ...dataToSave, entity_id: selectedEntity.id }])
        
        if (error) throw error
      }
      
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error('Error saving boat type:', error)
      alert('Error saving boat type')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this boat type? This will also affect all production units of this type.')) return
    
    try {
      const { error} = await supabase
        .from('boat_types')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error deleting boat type:', error)
      alert('Error deleting boat type. Make sure no production units reference this type.')
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('boat_types')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error updating boat type status:', error)
      alert('Error updating boat type status')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-mono text-3xl font-bold text-black">Boat Types</h1>
          <p className="font-mono text-sm text-gray-600 mt-2">
            Manage boat models and their Manufacturing BOMs (MBOMs)
          </p>
        </div>
        <Button onClick={openCreateModal} disabled={!selectedEntity}>Add Boat Type</Button>
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
                <TableHeader>Name</TableHeader>
                <TableHeader>Model</TableHeader>
                <TableHeader>Mfg Time</TableHeader>
                <TableHeader>Parts in MBOM</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {boatTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-bold">{type.name}</TableCell>
                  <TableCell>{type.model}</TableCell>
                  <TableCell>{type.default_manufacturing_time_days} days</TableCell>
                  <TableCell>{type.mbom?.parts?.length || 0} parts</TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleActive(type.id, type.is_active)}
                      className={`font-mono text-sm px-2 py-1 border ${
                        type.is_active 
                          ? 'bg-green-100 text-green-900 border-green-900' 
                          : 'bg-gray-100 text-gray-600 border-gray-600'
                      }`}
                    >
                      {type.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(type)}
                        className="text-black hover:underline font-mono text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
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
        title={editingType ? 'Edit Boat Type' : 'Add New Boat Type'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingType ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Boat Type Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Coastal Skiff"
              required
            />
            <Input
              label="Model Number *"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., CS-1800"
              required
            />
          </div>
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this boat type..."
            rows={2}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Mfg Time (days) *"
              type="number"
              value={formData.default_manufacturing_time_days}
              onChange={(e) => setFormData({ ...formData, default_manufacturing_time_days: parseInt(e.target.value) || 0 })}
              required
            />
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 font-mono text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                Active
              </label>
            </div>
          </div>
          
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
          
          <div className="border-t-2 border-black pt-4 mt-6">
            <h3 className="font-mono font-bold text-lg mb-4">Manufacturing BOM (MBOM)</h3>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <Select
                  label="Add Part"
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Part --' },
                    ...parts.map(p => ({ value: p.id, label: `${p.part_number} - ${p.name}` }))
                  ]}
                />
              </div>
              <div className="w-32">
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addPartToMbom} disabled={!selectedPartId}>
                  Add
                </Button>
              </div>
            </div>
            
            {mbomParts.length > 0 ? (
              <div className="border border-gray-300">
                <table className="w-full">
                  <thead className="border-b border-gray-300 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-mono text-xs font-bold">Part</th>
                      <th className="px-3 py-2 text-right font-mono text-xs font-bold">Qty</th>
                      <th className="px-3 py-2 text-right font-mono text-xs font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mbomParts.map((part) => (
                      <tr key={part.part_id} className="border-b border-gray-200">
                        <td className="px-3 py-2 font-mono text-xs">{part.part_name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-right">
                          <input
                            type="number"
                            min="1"
                            value={part.quantity_required}
                            onChange={(e) => updatePartQuantity(part.part_id, parseInt(e.target.value) || 1)}
                            className="w-16 text-right border border-gray-300 px-1 py-0.5"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removePartFromMbom(part.part_id)}
                            className="text-red-600 hover:underline font-mono text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 font-mono text-sm border border-gray-300">
                No parts added to MBOM yet
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  )
}
