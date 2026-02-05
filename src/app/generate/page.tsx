'use client'

import { useRouter } from 'next/navigation'
import { useEntity } from '@/contexts/EntityContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function GeneratePage() {
  const router = useRouter()
  const { selectedEntity } = useEntity()

  const handleCalculateRequirements = () => {
    if (!selectedEntity) {
      alert('Please select an entity first')
      return
    }
    
    // Navigate to the review requirements page
    router.push('/review-requirements')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="font-mono text-3xl font-bold text-black mb-2">Generate Purchase Orders</h1>
      <p className="font-mono text-sm text-gray-600 mb-8">
        Interactive PO generation - analyze requirements, configure by supplier, and generate optimized purchase orders
      </p>
      
      {!selectedEntity ? (
        <Card>
          <div className="text-center py-12 font-mono text-gray-600">
            Please select an entity to generate purchase orders
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Main Action Panel */}
          <Card title="Start PO Generation">
            <div className="p-6 bg-blue-50 border-2 border-blue-600 mb-6">
              <div className="font-mono text-lg font-bold text-blue-900 mb-3">
                🚀 New Interactive Workflow
              </div>
              <div className="font-mono text-sm text-blue-800 space-y-2">
                <p>1. <strong>Calculate Requirements</strong> - Analyze your production schedule and determine what parts are needed</p>
                <p>2. <strong>Review by Supplier</strong> - See all parts grouped by supplier with costs and timing</p>
                <p>3. <strong>Configure Each Supplier</strong> - Spread POs across weeks/months as needed</p>
                <p>4. <strong>Generate POs</strong> - Create finalized purchase orders with your custom settings</p>
              </div>
            </div>
            
            <Button 
              onClick={handleCalculateRequirements}
              className="w-full text-lg py-4"
            >
              Calculate Requirements →
            </Button>
          </Card>

          {/* Information Panel */}
          <Card title="How It Works">
            <div className="space-y-4">
              <p className="font-mono text-sm text-gray-700">
                The new PO generation system gives you full control over how purchase orders are created.
                Review requirements, configure spreading strategies per supplier, and generate exactly the POs you need.
              </p>
              
              <div className="border border-gray-300 bg-gray-50 p-4">
                <div className="font-mono text-xs font-bold text-black mb-3">Calculation Steps:</div>
                <ol className="font-mono text-xs text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Analyzes all scheduled boats and their MBOMs</li>
                  <li>Calculates when parts are needed based on production schedule</li>
                  <li>Accounts for current inventory (cumulative consumption model)</li>
                  <li>Applies 10% safety stock buffer</li>
                  <li>Matches parts with best suppliers (preferred first, then cheapest)</li>
                  <li>Shows all data for your review and configuration</li>
                </ol>
              </div>
              
              <div className="border-l-4 border-green-600 bg-green-50 pl-4 py-3">
                <div className="font-mono text-xs font-bold text-green-900 mb-1">✨ New Features</div>
                <div className="font-mono text-xs text-green-800 space-y-1">
                  <div>• <strong>Visual Review:</strong> See all requirements before generating any POs</div>
                  <div>• <strong>Supplier-by-Supplier:</strong> Configure POs individually for each supplier</div>
                  <div>• <strong>Flexible Spreading:</strong> Choose single PO, weekly, bi-weekly, or monthly batches</div>
                  <div>• <strong>Batch Slider:</strong> Easily adjust number of batches with visual feedback</div>
                  <div>• <strong>Live Preview:</strong> See exactly what POs will be created before generating</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
