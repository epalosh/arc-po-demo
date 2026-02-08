import { Suspense } from 'react'
import GeneratePOSPageContent from './page-content'

export default function GeneratePOSPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-8 font-mono text-gray-600">
        Loading requirements...
      </div>
    }>
      <GeneratePOSPageContent />
    </Suspense>
  )
}
