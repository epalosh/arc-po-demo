import { Suspense } from 'react'
import ReviewRequirementsPageContent from './page-content'

export default function ReviewRequirementsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 py-8 font-mono">
        Calculating requirements...
      </div>
    }>
      <ReviewRequirementsPageContent />
    </Suspense>
  )
}
