'use client'

import { useEntity } from '@/contexts/EntityContext'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function DashboardPage() {
  const { selectedEntity } = useEntity()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-mono text-4xl font-bold text-black mb-2">Dashboard</h1>
        <p className="font-mono text-gray-600">
          Follow these steps to generate purchase orders
        </p>
      </div>

      {!selectedEntity ? (
        <Card>
          <div className="text-center py-12 font-mono text-gray-600">
            Please select an entity to get started
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-6">
            <div className="font-mono text-3xl font-bold text-gray-400 pt-6">
              1
            </div>
            <Link href="/production-schedule" className="block flex-1">
              <Card className="hover:border-black transition-colors cursor-pointer">
                <h2 className="font-mono text-xl font-bold text-black mb-2">
                  View the Production Schedule
                </h2>
                <p className="font-mono text-sm text-gray-600">
                  See which boats are scheduled to be produced and when they need to be completed.
                </p>
              </Card>
            </Link>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-6">
            <div className="font-mono text-3xl font-bold text-gray-400 pt-6">
              2
            </div>
            <Link href="/parts" className="block flex-1">
              <Card className="hover:border-black transition-colors cursor-pointer">
                <h2 className="font-mono text-xl font-bold text-black mb-2">
                  View Current Inventory
                </h2>
                <p className="font-mono text-sm text-gray-600">
                  Check your current parts inventory levels to understand what's in stock.
                </p>
              </Card>
            </Link>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-6">
            <div className="font-mono text-3xl font-bold text-gray-400 pt-6">
              3
            </div>
            <Link href="/generate" className="block flex-1">
              <Card className="hover:border-black transition-colors cursor-pointer">
                <h2 className="font-mono text-xl font-bold text-black mb-2">
                  Generate Purchase Orders
                </h2>
                <p className="font-mono text-sm text-gray-600">
                  Automatically calculate requirements and generate POs to satisfy manufacturing demand.
                </p>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

