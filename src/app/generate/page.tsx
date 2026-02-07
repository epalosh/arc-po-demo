'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEntity } from '@/contexts/EntityContext'

export default function GeneratePage() {
  const router = useRouter()
  const { selectedEntity } = useEntity()

  useEffect(() => {
    if (selectedEntity) {
      // Automatically redirect to review requirements (replace history so back button works correctly)
      router.replace('/generate-pos')
    }
  }, [selectedEntity, router])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center py-12">
        {!selectedEntity ? (
          <div className="font-mono text-gray-600">
            Please select an entity to generate purchase orders
          </div>
        ) : (
          <div className="font-mono text-gray-600">
            Redirecting to requirements review...
          </div>
        )}
      </div>
    </div>
  )
}
