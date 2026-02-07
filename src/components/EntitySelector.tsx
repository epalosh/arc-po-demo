'use client'

import { useEntity } from '@/contexts/EntityContext'

interface EntitySelectorProps {
  disabled?: boolean
}

export function EntitySelector({ disabled = false }: EntitySelectorProps) {
  const { selectedEntity, entities, setSelectedEntity, loading, error } = useEntity()

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-red-600">⚠ Setup Required</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-gray-600">Loading entities...</span>
      </div>
    )
  }

  if (entities.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-gray-600">No entities found</span>
      </div>
    )
  }

  if (entities.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-black">
          {selectedEntity?.name || entities[0].name}
        </span>
      </div>
    )
  }

  // If disabled, show as text only
  if (disabled) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-gray-600">
          Entity:
        </span>
        <span className="font-mono text-sm font-bold text-black">
          {selectedEntity?.name || entities[0]?.name || 'None'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="entity-selector" className="font-mono text-sm text-gray-600">
        Entity:
      </label>
      <select
        id="entity-selector"
        value={selectedEntity?.id || ''}
        onChange={(e) => {
          const entity = entities.find(ent => ent.id === e.target.value)
          if (entity) {
            setSelectedEntity(entity)
          }
        }}
        className="font-mono text-sm bg-white border border-black px-3 py-1 focus:outline-none focus:ring-2 focus:ring-black"
      >
        {entities.map((entity) => (
          <option key={entity.id} value={entity.id}>
            {entity.name}
          </option>
        ))}
      </select>
    </div>
  )
}
