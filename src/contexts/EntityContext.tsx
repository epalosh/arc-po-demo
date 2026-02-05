'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Entity } from '@/types/database'

interface EntityContextType {
  selectedEntity: Entity | null
  entities: Entity[]
  setSelectedEntity: (entity: Entity) => void
  loading: boolean
  error: string | null
}

const EntityContext = createContext<EntityContextType | undefined>(undefined)

export function EntityProvider({ children }: { children: ReactNode }) {
  const [selectedEntity, setSelectedEntityState] = useState<Entity | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load entities on mount
  useEffect(() => {
    loadEntities()
  }, [])

  // Load selected entity from localStorage on mount
  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      const savedEntityId = localStorage.getItem('selectedEntityId')
      if (savedEntityId) {
        const entity = entities.find(e => e.id === savedEntityId)
        if (entity) {
          setSelectedEntityState(entity)
        } else {
          // If saved entity not found, select first active entity
          const firstActive = entities.find(e => e.is_active)
          if (firstActive) {
            setSelectedEntityState(firstActive)
          }
        }
      } else {
        // No saved entity, select first active entity
        const firstActive = entities.find(e => e.is_active)
        if (firstActive) {
          setSelectedEntityState(firstActive)
        }
      }
    }
  }, [entities, selectedEntity])

  const loadEntities = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('entities')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (fetchError) {
        // Check if table doesn't exist (migrations not run)
        if (fetchError.message.includes('relation "entities" does not exist')) {
          setError('Database not initialized. Please run migrations: supabase/migrations/*.sql')
          console.error('❌ SETUP REQUIRED: The entities table does not exist.')
          console.error('📋 ACTION NEEDED: Run the migration files in your Supabase SQL editor:')
          console.error('   1. supabase/migrations/20260204000000_add_entities.sql')
          console.error('   2. supabase/migrations/20260204000001_seed_additional_entities.sql')
        } else {
          throw fetchError
        }
        return
      }

      setEntities(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entities')
      console.error('Error loading entities:', err)
    } finally {
      setLoading(false)
    }
  }

  const setSelectedEntity = (entity: Entity) => {
    setSelectedEntityState(entity)
    localStorage.setItem('selectedEntityId', entity.id)
  }

  return (
    <EntityContext.Provider
      value={{
        selectedEntity,
        entities,
        setSelectedEntity,
        loading,
        error,
      }}
    >
      {children}
    </EntityContext.Provider>
  )
}

export function useEntity() {
  const context = useContext(EntityContext)
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider')
  }
  return context
}
