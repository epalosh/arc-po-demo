'use client'

import { Suspense } from 'react'
import ConfigurePOPageContent from './page-suspense'

export default function ConfigurePOPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-8 font-mono">
        Loading supplier configuration...
      </div>
    }>
      <ConfigurePOPageContent />
    </Suspense>
  )
}
