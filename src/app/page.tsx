'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEntity } from '@/contexts/EntityContext'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function DashboardPage() {
  const { selectedEntity } = useEntity()
  const [stats, setStats] = useState({
    totalParts: 0,
    lowStockParts: 0,
    totalSuppliers: 0,
    totalBoats: 0,
    scheduledBoats: 0,
    totalPOs: 0,
    totalPOValue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedEntity) {
      loadStats()
    }
  }, [selectedEntity])

  async function loadStats() {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      
      const [partsRes, suppliersRes, boatsRes, posRes] = await Promise.all([
        supabase.from('parts').select('id, current_stock, reorder_point').eq('entity_id', selectedEntity.id),
        supabase.from('suppliers').select('id').eq('entity_id', selectedEntity.id),
        supabase.from('boats').select('id, status').eq('entity_id', selectedEntity.id),
        supabase.from('purchase_orders').select('id, total_amount').eq('entity_id', selectedEntity.id)
      ])
      
      const parts = partsRes.data || []
      const lowStock = parts.filter(p => p.current_stock <= p.reorder_point).length
      const suppliers = suppliersRes.data || []
      const boats = boatsRes.data || []
      const scheduledBoats = boats.filter(b => b.status === 'scheduled').length
      const pos = posRes.data || []
      const totalPOValue = pos.reduce((sum, po) => sum + po.total_amount, 0)
      
      setStats({
        totalParts: parts.length,
        lowStockParts: lowStock,
        totalSuppliers: suppliers.length,
        totalBoats: boats.length,
        scheduledBoats,
        totalPOs: pos.length,
        totalPOValue
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-mono text-4xl font-bold text-black mb-2">Arc PO Demo</h1>
        <p className="font-mono text-gray-600">
          Intelligent Purchase Order Automation for Boat Manufacturing
        </p>
      </div>

      {!selectedEntity ? (
        <Card>
          <div className="text-center py-12 font-mono text-gray-600">
            Please select an entity to view dashboard
          </div>
        </Card>
      ) : loading ? (
        <div className="text-center py-12 font-mono">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/parts" className="block">
              <Card className="hover:border-black transition-colors cursor-pointer">
                <div className="font-mono text-sm text-gray-600 mb-1">Parts Inventory</div>
                <div className="font-mono text-3xl font-bold text-black mb-2">
                  {stats.totalParts}
                </div>
                {stats.lowStockParts > 0 && (
                  <div className="font-mono text-xs text-red-600">
                    {stats.lowStockParts} below reorder point
                  </div>
                )}
              </Card>
            </Link>

            <Link href="/suppliers" className="block">
              <Card className="hover:border-black transition-colors cursor-pointer">
                <div className="font-mono text-sm text-gray-600 mb-1">Suppliers</div>
                <div className="font-mono text-3xl font-bold text-black">
                  {stats.totalSuppliers}
                </div>
              </Card>
            </Link>

            <Link href="/boats" className="block">
              <Card className="hover:border-black transition-colors cursor-pointer">
                <div className="font-mono text-sm text-gray-600 mb-1">Boats Scheduled</div>
                <div className="font-mono text-3xl font-bold text-black mb-2">
                  {stats.totalBoats}
                </div>
                <div className="font-mono text-xs text-gray-600">
                  {stats.scheduledBoats} pending production
                </div>
              </Card>
            </Link>

            <Link href="/purchase-orders" className="block">
              <Card className="hover:border-black transition-colors cursor-pointer">
                <div className="font-mono text-sm text-gray-600 mb-1">Purchase Orders</div>
                <div className="font-mono text-3xl font-bold text-black mb-2">
                  {stats.totalPOs}
                </div>
                <div className="font-mono text-xs text-gray-600">
                  ${stats.totalPOValue.toFixed(2)} total value
                </div>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Quick Actions">
              <div className="space-y-3">
                <Link
                  href="/parts"
                  className="block p-4 border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
                >
                  <div className="font-mono font-bold text-black mb-1">Manage Parts</div>
                  <div className="font-mono text-xs text-gray-600">
                    Add, edit, or view parts inventory
                  </div>
                </Link>
                <Link
                  href="/boats"
                  className="block p-4 border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
                >
                  <div className="font-mono font-bold text-black mb-1">Schedule Boats</div>
                  <div className="font-mono text-xs text-gray-600">
                    Add boats to production schedule with MBOMs
                  </div>
                </Link>
                <Link
                  href="/supplier-parts"
                  className="block p-4 border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
                >
                  <div className="font-mono font-bold text-black mb-1">Configure Suppliers</div>
                  <div className="font-mono text-xs text-gray-600">
                    Set up supplier parts, pricing, and lead times
                  </div>
                </Link>
                <Link
                  href="/generate"
                  className="block p-4 border-2 border-black hover:bg-black hover:text-white transition-colors"
                >
                  <div className="font-mono font-bold mb-1">Generate Purchase Orders</div>
                  <div className="font-mono text-xs opacity-75">
                    Run the PO generation algorithm
                  </div>
                </Link>
              </div>
            </Card>

            <Card title="System Overview">
              <div className="space-y-4">
                <div>
                  <div className="font-mono text-sm font-bold text-black mb-2">
                    What This System Does
                  </div>
                  <div className="font-mono text-xs text-gray-600 space-y-2">
                    <p>
                      This demo showcases an intelligent PO automation system that analyzes
                      production schedules, inventory levels, and supplier information to
                      automatically generate optimized purchase orders.
                    </p>
                    <p>
                      The system ensures parts arrive just-in-time for production while
                      respecting supplier constraints, batch sizes, and lead times.
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-300">
                  <div className="font-mono text-sm font-bold text-black mb-2">
                    Getting Started
                  </div>
                  <ol className="font-mono text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Review and manage your parts inventory</li>
                    <li>Set up suppliers and supplier-part relationships</li>
                    <li>Add boats to the production schedule</li>
                    <li>Generate purchase orders automatically</li>
                  </ol>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

