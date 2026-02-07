'use client'

import { useEntity } from '@/contexts/EntityContext'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function DashboardPage() {
  const { selectedEntity } = useEntity()

  return (
    <div className="h-[calc(100vh-4rem)]">
      {!selectedEntity ? (
        <div className="flex items-center justify-center h-full px-6">
          <Card className="max-w-md">
            <div className="text-center py-12 font-mono text-gray-600">
              Please select an entity to get started
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 h-full relative">
          {/* PLANNER SECTION - Left Half */}
          <div className="bg-white p-8 overflow-y-auto">
            <div className="max-w-xl mx-auto">
              <div className="mb-8 mt-12">
                <h1 className="font-mono text-3xl font-bold text-black mb-2">
                  Inputs [Planner]
                </h1>
                <p className="font-mono text-sm text-gray-600">
                  Manage production schedules and monitor inventory levels
                </p>
              </div>

              <div className="space-y-2">
                {/* Production Schedule */}
                <Link href="/production-schedule" className="block">
                  <div className="bg-white border border-gray-300 hover:border-black transition-all cursor-pointer py-3 px-4">
                    <h2 className="font-mono text-sm font-bold text-black mb-0.5">
                      Production Schedule
                    </h2>
                    <p className="font-mono text-xs text-gray-600">
                      View and manage boat production timelines and deadlines
                    </p>
                  </div>
                </Link>

                {/* Current Inventory */}
                <Link href="/parts" className="block">
                  <div className="bg-white border border-gray-300 hover:border-black transition-all cursor-pointer py-3 px-4">
                    <h2 className="font-mono text-sm font-bold text-black mb-0.5">
                      Current Inventory
                    </h2>
                    <p className="font-mono text-xs text-gray-600">
                      Monitor parts inventory levels and stock status
                    </p>
                  </div>
                </Link>

                {/* Boats Management */}
                <Link href="/boats" className="block">
                  <div className="bg-white border border-gray-300 hover:border-black transition-all cursor-pointer py-3 px-4">
                    <h2 className="font-mono text-sm font-bold text-black mb-0.5">
                      Boat Types
                    </h2>
                    <p className="font-mono text-xs text-gray-600">
                      Manage boat configurations and bill of materials
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="absolute left-1/2 w-px bg-black -translate-x-1/2 z-10" style={{ top: '5rem', bottom: '8rem' }}>
          </div>

          {/* BUYER SECTION - Right Half */}
          <div className="bg-white p-8 overflow-y-auto">
            <div className="max-w-xl mx-auto">
              <div className="mb-8 mt-12">
                <h1 className="font-mono text-3xl font-bold text-black mb-2">
                  POs [Buyer]
                </h1>
                <p className="font-mono text-sm text-gray-600">
                  Configure and manage purchase orders with suppliers
                </p>
              </div>

              <div className="space-y-2">
                {/* Generate POs */}
                <Link href="/generate" className="block">
                  <div className="bg-[#0a1929] border border-[#0a1929] hover:bg-white hover:text-black transition-all cursor-pointer py-3 px-4 group">
                    <h2 className="font-mono text-sm font-bold text-white group-hover:text-black mb-0.5">
                      Generate Purchase Orders
                    </h2>
                    <p className="font-mono text-xs text-gray-300 group-hover:text-gray-600">
                      Automatically calculate requirements and create POs
                    </p>
                  </div>
                </Link>

                {/* View POs */}
                <Link href="/purchase-orders" className="block">
                  <div className="bg-white border border-gray-300 hover:border-black transition-all cursor-pointer py-3 px-4">
                    <h2 className="font-mono text-sm font-bold text-black mb-0.5">
                      Purchase Orders
                    </h2>
                    <p className="font-mono text-xs text-gray-600">
                      View and manage all purchase orders
                    </p>
                  </div>
                </Link>

                {/* Suppliers */}
                <Link href="/suppliers" className="block">
                  <div className="bg-white border border-gray-300 hover:border-black transition-all cursor-pointer py-3 px-4">
                    <h2 className="font-mono text-sm font-bold text-black mb-0.5">
                      Suppliers
                    </h2>
                    <p className="font-mono text-xs text-gray-600">
                      Manage supplier relationships and contact information
                    </p>
                  </div>
                </Link>

                {/* Supplier Parts */}
                <Link href="/supplier-parts" className="block">
                  <div className="bg-white border border-gray-300 hover:border-black transition-all cursor-pointer py-3 px-4">
                    <h2 className="font-mono text-sm font-bold text-black mb-0.5">
                      Supplier Parts
                    </h2>
                    <p className="font-mono text-xs text-gray-600">
                      Configure part pricing and supplier relationships
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

