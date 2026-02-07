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

              <div className="space-y-3">
                {/* Production Schedule */}
                <Link href="/production-schedule" className="block">
                  <Card className="hover:border-black transition-all cursor-pointer">
                    <h2 className="font-mono text-lg font-bold text-black mb-1">
                      Production Schedule
                    </h2>
                    <p className="font-mono text-sm text-gray-600">
                      View and manage boat production timelines and deadlines
                    </p>
                  </Card>
                </Link>

                {/* Current Inventory */}
                <Link href="/parts" className="block">
                  <Card className="hover:border-black transition-all cursor-pointer">
                    <h2 className="font-mono text-lg font-bold text-black mb-1">
                      Current Inventory
                    </h2>
                    <p className="font-mono text-sm text-gray-600">
                      Monitor parts inventory levels and stock status
                    </p>
                  </Card>
                </Link>

                {/* Boats Management */}
                <Link href="/boats" className="block">
                  <Card className="hover:border-black transition-all cursor-pointer">
                    <h2 className="font-mono text-lg font-bold text-black mb-1">
                      Boat Types
                    </h2>
                    <p className="font-mono text-sm text-gray-600">
                      Manage boat configurations and bill of materials
                    </p>
                  </Card>
                </Link>
              </div>
            </div>
          </div>

          {/* DIVIDER WITH ARROW */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-black -translate-x-1/2 z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center justify-center w-12 h-12 bg-white border-4 border-black rounded-full">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
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

              <div className="space-y-3">
                {/* Generate POs */}
                <Link href="/generate" className="block">
                  <div className="bg-[#0a1929] border border-[#0a1929] hover:border-black transition-all cursor-pointer p-6">
                    <h2 className="font-mono text-lg font-bold text-white mb-1">
                      Generate Purchase Orders
                    </h2>
                    <p className="font-mono text-sm text-gray-300">
                      Automatically calculate requirements and create POs
                    </p>
                  </div>
                </Link>

                {/* View POs */}
                <Link href="/purchase-orders" className="block">
                  <Card className="hover:border-black transition-all cursor-pointer">
                    <h2 className="font-mono text-lg font-bold text-black mb-1">
                      Purchase Orders
                    </h2>
                    <p className="font-mono text-sm text-gray-600">
                      View and manage all purchase orders
                    </p>
                  </Card>
                </Link>

                {/* Suppliers */}
                <Link href="/suppliers" className="block">
                  <Card className="hover:border-black transition-all cursor-pointer">
                    <h2 className="font-mono text-lg font-bold text-black mb-1">
                      Suppliers
                    </h2>
                    <p className="font-mono text-sm text-gray-600">
                      Manage supplier relationships and contact information
                    </p>
                  </Card>
                </Link>

                {/* Supplier Parts */}
                <Link href="/supplier-parts" className="block">
                  <Card className="hover:border-black transition-all cursor-pointer">
                    <h2 className="font-mono text-lg font-bold text-black mb-1">
                      Supplier Parts
                    </h2>
                    <p className="font-mono text-sm text-gray-600">
                      Configure part pricing and supplier relationships
                    </p>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

