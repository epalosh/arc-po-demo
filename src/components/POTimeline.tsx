import { useMemo, useState, useRef } from 'react'

interface POTimelineProps {
  poBatches: Array<{
    order_date: string
    total_cost: number
    parts: Array<{
      part_id: string
      part_name: string
      part_number: string
      quantity: number
      unit_cost: number
      total_cost: number
    }>
  }>
  boatsNeeding: Array<{
    boat_name: string
    need_by_date: string
    due_date: string
    boat_id?: string
    quantity?: number
  }>
  maxLeadTime: number
  initialStock?: Record<string, number>
  boatConsumption?: Array<{
    boat_id: string
    boat_name: string
    need_by_date: string
    parts: Record<string, number>
  }>
}

export function POTimeline({ 
  poBatches, 
  boatsNeeding, 
  maxLeadTime,
  initialStock = {},
  boatConsumption = []
}: POTimelineProps) {
  const [hoverX, setHoverX] = useState<number | null>(null)
  const [hoveredMarkerIdx, setHoveredMarkerIdx] = useState<number | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Timeline configuration - SINGLE SOURCE OF TRUTH
  const PIXELS_PER_DAY = 24 // Increased from 8 to 24 for better spacing
  const LEFT_MARGIN = 140 // Space for labels
  const RIGHT_MARGIN = 40

  // Calculate date range
  const { startDate, endDate, totalDays } = useMemo(() => {
    const allDates: Date[] = []
    
    poBatches.forEach(batch => {
      allDates.push(new Date(batch.order_date))
      const deliveryDate = new Date(batch.order_date)
      deliveryDate.setDate(deliveryDate.getDate() + maxLeadTime)
      allDates.push(deliveryDate)
    })
    
    boatsNeeding.forEach(boat => {
      allDates.push(new Date(boat.need_by_date))
      allDates.push(new Date(boat.due_date))
    })
    
    if (allDates.length === 0) {
      const now = new Date()
      return { startDate: now, endDate: now, totalDays: 1 }
    }
    
    const earliest = new Date(Math.min(...allDates.map(d => d.getTime())))
    const latest = new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // Add 5% padding
    const range = latest.getTime() - earliest.getTime()
    const padding = range * 0.05
    const start = new Date(earliest.getTime() - padding)
    const end = new Date(latest.getTime() + padding)
    
    // Reset to start of day for clean calculations
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    return { startDate: start, endDate: end, totalDays: Math.max(days, 1) }
  }, [poBatches, boatsNeeding, maxLeadTime])

  // UNIFIED COORDINATE SYSTEM: Convert date to X pixel position
  // Places position at the CENTER of the day
  const dateToPixels = (date: Date | string): number => {
    const d = typeof date === 'string' ? new Date(date) : date
    d.setHours(0, 0, 0, 0)
    const daysSinceStart = (d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    // Add half a day's worth of pixels to center on the day
    return LEFT_MARGIN + (daysSinceStart * PIXELS_PER_DAY) + (PIXELS_PER_DAY / 2)
  }

  // Convert X pixel position to date
  const pixelsToDate = (pixels: number): Date => {
    // Subtract half day offset
    const daysSinceStart = (pixels - LEFT_MARGIN - (PIXELS_PER_DAY / 2)) / PIXELS_PER_DAY
    const date = new Date(startDate.getTime() + (daysSinceStart * 1000 * 60 * 60 * 24))
    date.setHours(0, 0, 0, 0)
    return date
  }

  // Total timeline width
  const timelineWidth = LEFT_MARGIN + (totalDays * PIXELS_PER_DAY) + RIGHT_MARGIN

  // Format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  // Generate day grid markers - one per day with labels
  const dayMarkers = useMemo(() => {
    const markers = []
    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + day)
      // Grid lines at START of day
      const gridX = LEFT_MARGIN + (day * PIXELS_PER_DAY)
      // Center point of day for labels
      const centerX = LEFT_MARGIN + (day * PIXELS_PER_DAY) + (PIXELS_PER_DAY / 2)
      markers.push({
        date: new Date(date),
        gridX,
        centerX,
        dayOfMonth: date.getDate(),
        isFirstOfMonth: date.getDate() === 1,
        isMonday: date.getDay() === 1
      })
    }
    return markers
  }, [startDate, totalDays])

  // Generate month markers
  const monthMarkers = useMemo(() => {
    const markers = []
    const current = new Date(startDate)
    current.setDate(1)
    
    while (current <= endDate) {
      const markerDate = new Date(current)
      // Calculate grid position (start of day)
      const daysSinceStart = (markerDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      const gridX = LEFT_MARGIN + (daysSinceStart * PIXELS_PER_DAY)
      
      markers.push({
        date: markerDate,
        x: gridX,
        label: markerDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })
      current.setMonth(current.getMonth() + 1)
    }
    
    return markers
  }, [startDate, endDate])

  // Calculate PO bars with exact pixel positions and check for stock shortages
  const poBars = useMemo(() => {
    // We'll mark bars as "late" if they contribute to stock shortages
    // This requires checking cumulative stock at each consumption point
    
    return poBatches.map((batch, idx) => {
      const orderDate = new Date(batch.order_date)
      orderDate.setHours(0, 0, 0, 0)
      
      const deliveryDate = new Date(orderDate)
      deliveryDate.setDate(deliveryDate.getDate() + maxLeadTime)
      
      const startX = dateToPixels(orderDate)
      const endX = dateToPixels(deliveryDate)
      
      return {
        poNumber: idx + 1,
        orderDate,
        deliveryDate,
        cost: batch.total_cost,
        parts: batch.parts || [],
        x: startX,
        width: endX - startX,
        isLate: false, // Will be calculated globally below
        daysLate: 0
      }
    })
  }, [poBatches, maxLeadTime, dateToPixels])

  // Check if the current configuration will cause stock shortages
  const stockShortageInfo = useMemo((): { hasShortage: boolean, shortageDate: Date | null } => {
    if (poBatches.length === 0 || boatConsumption.length === 0) {
      return { hasShortage: false, shortageDate: null }
    }

    // Build timeline of events
    const events: Array<{ date: Date, type: 'delivery' | 'consumption', parts: Record<string, number> }> = []
    
    // Add deliveries
    poBars.forEach(bar => {
      const partsInBatch: Record<string, number> = {}
      bar.parts.forEach(part => {
        partsInBatch[part.part_id] = part.quantity
      })
      
      events.push({
        date: new Date(bar.deliveryDate),
        type: 'delivery',
        parts: partsInBatch
      })
    })
    
    // Add consumption
    boatConsumption.forEach(boat => {
      const needDate = new Date(boat.need_by_date)
      needDate.setHours(0, 0, 0, 0)
      
      let event = events.find(e => e.date.getTime() === needDate.getTime() && e.type === 'consumption')
      if (!event) {
        event = {
          date: needDate,
          type: 'consumption',
          parts: {}
        }
        events.push(event)
      }
      
      Object.entries(boat.parts).forEach(([partId, quantity]) => {
        event!.parts[partId] = (event!.parts[partId] || 0) + quantity
      })
    })
    
    // Sort by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    // Initialize stock with ALL parts that will be involved
    const stockByPart: Record<string, number> = {}
    
    // Start with initial stock
    Object.entries(initialStock).forEach(([partId, quantity]) => {
      stockByPart[partId] = quantity
    })
    
    // Ensure all parts from POs are initialized
    poBars.forEach(bar => {
      bar.parts.forEach(part => {
        if (!(part.part_id in stockByPart)) {
          stockByPart[part.part_id] = 0
        }
      })
    })
    
    // Ensure all parts from consumption are initialized
    boatConsumption.forEach(boat => {
      Object.keys(boat.parts).forEach(partId => {
        if (!(partId in stockByPart)) {
          stockByPart[partId] = 0
        }
      })
    })
    
    // Process events and check for negative stock
    let shortageFound = false
    let shortageDate: Date | null = null
    
    for (const event of events) {
      for (const [partId, quantity] of Object.entries(event.parts)) {
        if (event.type === 'delivery') {
          stockByPart[partId] = (stockByPart[partId] || 0) + quantity
        } else {
          stockByPart[partId] = (stockByPart[partId] || 0) - quantity
          
          if (stockByPart[partId] < 0 && !shortageFound) {
            shortageFound = true
            shortageDate = event.date
            console.log('SHORTAGE DETECTED:', {
              date: event.date.toISOString(),
              partId,
              stock: stockByPart[partId],
              event
            })
          }
        }
      }
    }
    
    return { hasShortage: shortageFound, shortageDate }
  }, [poBars, boatConsumption, initialStock])

  // Calculate parts needed markers with required stock levels
  const partsNeededMarkers = useMemo(() => {
    const uniqueDates = Array.from(new Set(boatsNeeding.map(b => b.need_by_date)))
    
    return uniqueDates.map(needDate => {
      const date = new Date(needDate)
      date.setHours(0, 0, 0, 0)
      const boatsOnDate = boatsNeeding.filter(b => b.need_by_date === needDate)
      
      // Calculate the total stock required for this date
      // This is the cumulative quantity of parts needed by all boats on this date
      const requiredStock = boatConsumption
        .filter(boat => boat.need_by_date === needDate)
        .reduce((total, boat) => {
          const boatTotal = Object.values(boat.parts).reduce((sum, qty) => sum + qty, 0)
          return total + boatTotal
        }, 0)
      
      return {
        date,
        x: dateToPixels(date),
        boats: boatsOnDate,
        requiredStock
      }
    })
  }, [boatsNeeding, boatConsumption, dateToPixels])

  // Calculate cumulative stock at a given date
  const getStockAtDate = (targetDate: Date): Record<string, { 
    current: number
    partNumber: string
    partName: string 
  }> => {
    const stockByPart: Record<string, { 
      current: number
      partNumber: string
      partName: string 
    }> = {}
    
    // Initialize with current stock
    Object.entries(initialStock).forEach(([partId, quantity]) => {
      const part = poBatches.flatMap(b => b.parts || []).find(p => p.part_id === partId)
      stockByPart[partId] = { 
        current: quantity,
        partNumber: part?.part_number || partId,
        partName: part?.part_name || 'Unknown'
      }
    })
    
    // Add parts that might not have initial stock
    poBatches.forEach(batch => {
      (batch.parts || []).forEach(part => {
        if (!stockByPart[part.part_id]) {
          stockByPart[part.part_id] = {
            current: 0,
            partNumber: part.part_number,
            partName: part.part_name
          }
        }
      })
    })
    
    // Add deliveries that have arrived by target date
    poBars.forEach(bar => {
      if (bar.deliveryDate <= targetDate) {
        bar.parts.forEach(part => {
          if (stockByPart[part.part_id]) {
            stockByPart[part.part_id].current += part.quantity
          }
        })
      }
    })
    
    // Subtract consumption from boats needed by target date
    boatConsumption.forEach(boat => {
      const needDate = new Date(boat.need_by_date)
      needDate.setHours(0, 0, 0, 0)
      if (needDate <= targetDate) {
        Object.entries(boat.parts).forEach(([partId, quantity]) => {
          if (stockByPart[partId]) {
            stockByPart[partId].current -= quantity
          }
        })
      }
    })
    
    return stockByPart
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    setHoverX(x)
  }

  const handleMouseLeave = () => {
    setHoverX(null)
  }

  // Get hover date from hover X position
  const hoverDate = hoverX !== null ? pixelsToDate(hoverX) : null
  const hoverStock = hoverDate ? getStockAtDate(hoverDate) : {}

  // Calculate stock levels over time for graph
  const stockGraphData = useMemo(() => {
    if (poBatches.length === 0) return { dataPoints: [], minStock: 0, maxStock: 100 }

    // Build timeline of all events sorted by date
    const events: Array<{ date: Date, type: 'delivery' | 'consumption', parts: Record<string, number> }> = []
    
    // Add deliveries
    poBars.forEach(bar => {
      const partsInBatch: Record<string, number> = {}
      bar.parts.forEach(part => {
        partsInBatch[part.part_id] = part.quantity
      })
      events.push({
        date: new Date(bar.deliveryDate),
        type: 'delivery',
        parts: partsInBatch
      })
    })
    
    // Add consumption
    boatConsumption.forEach(boat => {
      const needDate = new Date(boat.need_by_date)
      needDate.setHours(0, 0, 0, 0)
      let event = events.find(e => e.date.getTime() === needDate.getTime() && e.type === 'consumption')
      if (!event) {
        event = { date: needDate, type: 'consumption', parts: {} }
        events.push(event)
      }
      Object.entries(boat.parts).forEach(([partId, quantity]) => {
        event!.parts[partId] = (event!.parts[partId] || 0) + quantity
      })
    })
    
    events.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    // Initialize stock by part
    const stockByPart: Record<string, number> = {}
    Object.entries(initialStock).forEach(([partId, quantity]) => {
      stockByPart[partId] = quantity
    })
    poBars.forEach(bar => {
      bar.parts.forEach(part => {
        if (!(part.part_id in stockByPart)) {
          stockByPart[part.part_id] = 0
        }
      })
    })
    
    // Calculate total stock at each point in time
    const dataPoints: Array<{ date: Date, x: number, totalStock: number }> = []
    
    // Starting point
    const initialTotal = Object.values(stockByPart).reduce((sum, qty) => sum + qty, 0)
    dataPoints.push({
      date: new Date(startDate),
      x: dateToPixels(startDate),
      totalStock: initialTotal
    })
    
    // Process each event
    events.forEach(event => {
      // Before this event (carry forward previous stock)
      const prevTotal = Object.values(stockByPart).reduce((sum, qty) => sum + qty, 0)
      
      // Apply the event
      Object.entries(event.parts).forEach(([partId, quantity]) => {
        if (event.type === 'delivery') {
          stockByPart[partId] = (stockByPart[partId] || 0) + quantity
        } else {
          stockByPart[partId] = (stockByPart[partId] || 0) - quantity
        }
      })
      
      // After this event
      const newTotal = Object.values(stockByPart).reduce((sum, qty) => sum + qty, 0)
      
      dataPoints.push({
        date: event.date,
        x: dateToPixels(event.date),
        totalStock: newTotal
      })
    })
    
    // Ending point
    const finalTotal = Object.values(stockByPart).reduce((sum, qty) => sum + qty, 0)
    dataPoints.push({
      date: new Date(endDate),
      x: dateToPixels(endDate),
      totalStock: finalTotal
    })
    
    // Find min/max for scaling - use actual data range
    const stockValues = dataPoints.map(d => d.totalStock)
    const minStock = Math.min(...stockValues)
    const maxStock = Math.max(...stockValues)
    
    return { dataPoints, minStock, maxStock }
  }, [poBars, boatConsumption, initialStock, startDate, endDate, dateToPixels])

  return (
    <div className="bg-white">
      <div className="font-mono text-sm font-bold mb-3">Timeline View</div>
      
      {/* Validation Warning */}
      {stockShortageInfo.hasShortage && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-600 rounded">
          <div className="font-mono text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
            <span>STOCK SHORTAGE DETECTED</span>
          </div>
          <div className="font-mono text-sm text-red-800">
            Parts will run out before all boats can be completed. 
            {stockShortageInfo.shortageDate && (
              <span> Stock will go negative on {stockShortageInfo.shortageDate.toLocaleDateString()}.</span>
            )}
          </div>
          <div className="font-mono text-xs text-red-700 mt-2">
            Adjust your spreading strategy: reduce number of batches or order earlier to ensure parts arrive before they're needed.
          </div>
        </div>
      )}
      
      {/* Date Range Info */}
      <div className="flex justify-between items-center font-mono text-xs text-gray-600 mb-4 pb-2 border-b border-gray-300">
        <div>
          <span className="font-bold">Start:</span> {formatDate(startDate)}
        </div>
        <div>
          <span className="font-bold">Duration:</span> {totalDays} days ({PIXELS_PER_DAY}px/day)
        </div>
        <div>
          <span className="font-bold">End:</span> {formatDate(endDate)}
        </div>
      </div>
      
      {/* Scrollable Timeline Container */}
      <div 
        className="overflow-x-auto overflow-y-visible border-2 border-gray-300 bg-gray-50 relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ paddingTop: '50px' }}
      >
        <div 
          ref={timelineRef}
          className="relative bg-white" 
          style={{ width: `${timelineWidth}px`, height: '220px', minHeight: '220px' }}
        >
          
          {/* Day Grid - Light vertical lines with day labels */}
          {dayMarkers.map((marker, idx) => (
            <div
              key={`day-${idx}`}
              className="absolute top-0 bottom-0"
              style={{ left: `${marker.gridX}px` }}
            >
              {/* Vertical line */}
              <div className={`h-full ${
                marker.isFirstOfMonth ? 'border-l-2 border-gray-400' : 'border-l border-gray-200'
              }`}></div>
              
              {/* Day number label - centered in the day cell */}
              <div 
                className="absolute font-mono text-[10px] font-semibold text-gray-600"
                style={{ 
                  top: '-20px',
                  left: `${PIXELS_PER_DAY / 2}px`,
                  transform: 'translateX(-50%)',
                  width: '24px',
                  textAlign: 'center'
                }}
              >
                {marker.dayOfMonth}
              </div>
            </div>
          ))}
          
          {/* Month Markers - Labels only (lines already from day grid) */}
          {monthMarkers.map((marker, idx) => (
            <div
              key={`month-${idx}`}
              className="absolute"
              style={{ 
                left: `${marker.x}px`,
                top: '-40px'
              }}
            >
              <div 
                className="font-mono text-sm font-bold text-gray-700 whitespace-nowrap bg-white px-2"
                style={{ 
                  position: 'absolute',
                  left: '4px'
                }}
              >
                {marker.label}
              </div>
            </div>
          ))}

          {/* Hover Tracking Line */}
          {hoverX !== null && hoverX >= LEFT_MARGIN && hoverDate && (
            <>
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-black pointer-events-none z-30"
                style={{ left: `${hoverX}px` }}
              />
              
              {/* Hover Info Card */}
              <div
                className="absolute top-0 bg-black text-white font-mono text-xs p-3 rounded shadow-2xl pointer-events-none z-20 border-2 border-gray-700"
                style={{ 
                  left: `${Math.min(hoverX + 10, timelineWidth - 320)}px`,
                  maxWidth: '300px',
                  minWidth: '200px'
                }}
              >
                <div className="font-bold mb-2 text-gray-300 border-b border-gray-600 pb-1">
                  {hoverDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric' 
                  })}
                </div>
                
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  <div className="font-bold text-gray-300 mb-1">Cumulative Stock:</div>
                  {(() => {
                    const parts = Object.entries(hoverStock)
                    
                    if (parts.length === 0) {
                      return <div className="text-gray-400 text-xs">No parts tracked</div>
                    }
                    
                    return parts.map(([partId, data]) => (
                      <div key={partId} className="flex justify-between items-start gap-2 text-xs">
                        <span className="text-gray-300 truncate flex-1">
                          {data.partNumber}
                        </span>
                        <span className={`font-bold ${
                          data.current < 0 
                            ? 'text-red-400' 
                            : data.current === 0 
                            ? 'text-yellow-400' 
                            : 'text-green-400'
                        }`}>
                          {data.current}
                        </span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </>
          )}
          
          {/* BACKGROUND: Stock Level Graph - Integrated behind all elements */}
          <div className="absolute inset-0" style={{ left: `${LEFT_MARGIN}px`, right: `${RIGHT_MARGIN}px` }}>
            {/* Subtle horizontal grid lines for stock reference */}
            <div className="absolute inset-0">
              {[0.25, 0.5, 0.75].map((ratio) => (
                <div
                  key={ratio}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ bottom: `${ratio * 100}%` }}
                />
              ))}
            </div>
            
            {/* Stock area graph with gradient fill */}
            {stockGraphData.dataPoints.length > 1 && (
              <svg
                className="absolute inset-0 w-full h-full"
                style={{ overflow: 'visible' }}
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Gradient for positive stock - green */}
                  <linearGradient id="stockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.03" />
                  </linearGradient>
                  {/* Gradient for negative stock - red */}
                  <linearGradient id="stockGradientNegative" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {/* Create area fill path */}
                {(() => {
                  const graphHeight = 220 // Match container height
                  const verticalPadding = 20 // Padding in pixels from top and bottom
                  const usableHeight = graphHeight - (verticalPadding * 2)
                  
                  const range = stockGraphData.maxStock - stockGraphData.minStock || 1
                  
                  // Calculate Y position - map stock values to fill the FULL usable height
                  // maxStock maps to verticalPadding (top)
                  // minStock maps to graphHeight - verticalPadding (bottom)
                  const getProportionalY = (stockValue: number) => {
                    // Normalize stock value from minStock to maxStock -> 0 to 1
                    const normalizedValue = (stockGraphData.maxStock - stockValue) / range
                    // Map to full usable height with padding
                    return verticalPadding + (normalizedValue * usableHeight)
                  }
                  
                  const hasNegative = stockGraphData.dataPoints.some(p => p.totalStock < 0)
                  const zeroY = getProportionalY(0)
                  
                  // Helper function to build segments split by positive/negative
                  const buildSegments = () => {
                    const segments: Array<{
                      pathData: string
                      isNegative: boolean
                    }> = []
                    
                    let currentPath = ''
                    let currentIsNegative: boolean = false
                    let segmentStartPoint: { x: number, y: number } = { x: 0, y: 0 }
                    let hasStarted = false
                    
                    stockGraphData.dataPoints.forEach((point, idx) => {
                      const x = point.x - LEFT_MARGIN
                      const y = getProportionalY(point.totalStock)
                      const isNegative = point.totalStock < 0
                      
                      if (idx === 0) {
                        // Start first segment
                        currentPath = `M ${x} ${y}`
                        currentIsNegative = isNegative
                        segmentStartPoint = { x, y }
                        hasStarted = true
                      } else {
                        const prevPoint = stockGraphData.dataPoints[idx - 1]
                        const prevX = prevPoint.x - LEFT_MARGIN
                        const prevY = getProportionalY(prevPoint.totalStock)
                        const prevIsNegative = prevPoint.totalStock < 0
                        
                        // Check if we're crossing zero
                        if (isNegative !== prevIsNegative) {
                          // Calculate intersection point with zero line
                          // Linear interpolation to find where line crosses zero
                          const t = (0 - prevPoint.totalStock) / (point.totalStock - prevPoint.totalStock)
                          const crossX = prevX + t * (x - prevX)
                          
                          // Complete current segment up to zero crossing
                          currentPath += ` L ${crossX} ${zeroY}`
                          
                          // Close and save current segment
                          if (hasStarted) {
                            const closePath = currentPath + ` L ${crossX} ${zeroY} L ${segmentStartPoint.x} ${zeroY} Z`
                            segments.push({
                              pathData: closePath,
                              isNegative: currentIsNegative
                            })
                          }
                          
                          // Start new segment from zero crossing
                          currentPath = `M ${crossX} ${zeroY} L ${x} ${getProportionalY(prevPoint.totalStock)} L ${x} ${y}`
                          currentIsNegative = isNegative
                          segmentStartPoint = { x: crossX, y: zeroY }
                        } else {
                          // Continue current segment with step pattern
                          currentPath += ` L ${x} ${getProportionalY(prevPoint.totalStock)} L ${x} ${y}`
                        }
                      }
                    })
                    
                    // Close final segment
                    if (hasStarted) {
                      const lastPoint = stockGraphData.dataPoints[stockGraphData.dataPoints.length - 1]
                      const lastX = lastPoint.x - LEFT_MARGIN
                      const closeY = zeroY
                      currentPath += ` L ${lastX} ${closeY} L ${segmentStartPoint.x} ${closeY} Z`
                      segments.push({
                        pathData: currentPath,
                        isNegative: currentIsNegative
                      })
                    }
                    
                    return segments
                  }
                  
                  const segments = buildSegments()
                  
                  return (
                    <>
                      {/* Area fills - separate for positive and negative */}
                      {segments.map((segment, idx) => (
                        <path
                          key={`area-${idx}`}
                          d={segment.pathData}
                          fill={segment.isNegative ? "url(#stockGradientNegative)" : "url(#stockGradient)"}
                          opacity="0.8"
                        />
                      ))}
                      
                      {/* Stock line - STEP PATTERN with color changes */}
                      {stockGraphData.dataPoints.map((point, idx) => {
                        if (idx === 0) return null
                        
                        const prevPoint = stockGraphData.dataPoints[idx - 1]
                        const x = point.x - LEFT_MARGIN
                        const prevX = prevPoint.x - LEFT_MARGIN
                        const y = getProportionalY(point.totalStock)
                        const prevY = getProportionalY(prevPoint.totalStock)
                        
                        const isNegative = point.totalStock < 0
                        const prevIsNegative = prevPoint.totalStock < 0
                        
                        // Determine color for this segment
                        const segmentColor = (isNegative || prevIsNegative) ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'
                        
                        return (
                          <g key={`line-${idx}`}>
                            {/* Horizontal line */}
                            <line
                              x1={prevX}
                              y1={prevY}
                              x2={x}
                              y2={prevY}
                              stroke={segmentColor}
                              strokeWidth="1.5"
                              strokeOpacity="0.5"
                            />
                            {/* Vertical line */}
                            <line
                              x1={x}
                              y1={prevY}
                              x2={x}
                              y2={y}
                              stroke={segmentColor}
                              strokeWidth="1.5"
                              strokeOpacity="0.5"
                            />
                          </g>
                        )
                      })}
                      
                      {/* Old path removed - replaced with segment-based rendering */}
                      
                      {/* Data points */}
                      {stockGraphData.dataPoints.map((point, idx) => {
                        const x = point.x - LEFT_MARGIN
                        const y = getProportionalY(point.totalStock)
                        const isNegative = point.totalStock < 0
                        
                        return (
                          <circle
                            key={`point-${idx}`}
                            cx={x}
                            cy={y}
                            r="2"
                            fill={isNegative ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'}
                            fillOpacity="0.6"
                          />
                        )
                      })}
                      
                      {/* Zero line if there's negative stock */}
                      {hasNegative && (
                        <line
                          x1={0}
                          y1={zeroY}
                          x2={timelineWidth - LEFT_MARGIN - RIGHT_MARGIN}
                          y2={zeroY}
                          stroke="rgb(239, 68, 68)"
                          strokeWidth="1"
                          strokeDasharray="4 2"
                          strokeOpacity="0.4"
                        />
                      )}
                    </>
                  )
                })()}
              </svg>
            )}
          </div>
          
          {/* Track Labels */}
          <div className="absolute left-2 top-4 font-mono text-xs font-bold text-blue-600 bg-white/90 px-2 py-1 z-10 rounded shadow-sm border border-blue-200">
            Purchase Orders
          </div>
          
          {/* PO Bars Track */}
          <div className="absolute top-4 left-0 right-0" style={{ height: '80px' }}>
            {poBars.map((bar) => (
              <div
                key={bar.poNumber}
                className="absolute group cursor-pointer"
                style={{
                  left: `${bar.x}px`,
                  width: `${bar.width}px`,
                  top: `${(bar.poNumber - 1) * 24}px`,
                  height: '20px'
                }}
              >
                {/* Bar */}
                <div className={`relative h-full rounded transition-colors shadow-md ${
                  bar.isLate 
                    ? 'bg-red-500 hover:bg-red-600 border-2 border-red-800' 
                    : 'bg-blue-500 hover:bg-blue-600 border-2 border-blue-700'
                }`}>
                  {/* Label inside bar */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-white whitespace-nowrap px-1">
                      PO #{bar.poNumber}
                    </span>
                  </div>
                  
                  {/* Order marker (left edge) */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    bar.isLate ? 'bg-red-900' : 'bg-blue-900'
                  }`}></div>
                  
                  {/* Delivery marker (right edge) */}
                  <div className={`absolute right-0 top-0 bottom-0 w-1 ${
                    bar.isLate ? 'bg-red-900' : 'bg-green-600'
                  }`}></div>
                </div>
                
                {/* Hover Tooltip */}
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 font-mono text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg ${
                  bar.isLate ? 'bg-red-900 text-white' : 'bg-black text-white'
                }`}>
                  <div className="font-bold mb-1">
                    Purchase Order #{bar.poNumber}
                    {bar.isLate && <span className="ml-2 text-yellow-300">TOO LATE</span>}
                  </div>
                  <div>Order: {formatShortDate(bar.orderDate)}</div>
                  <div>Delivery: {formatShortDate(bar.deliveryDate)}</div>
                  {bar.isLate && (
                    <div className="text-yellow-300 font-bold mt-1">
                      Arrives {bar.daysLate} day(s) too late!
                    </div>
                  )}
                  <div className={`font-bold mt-1 ${bar.isLate ? 'text-yellow-300' : 'text-green-400'}`}>
                    ${bar.cost.toLocaleString()}
                  </div>
                  <div className={`text-xs mt-1 ${bar.isLate ? 'text-red-200' : 'text-gray-300'}`}>
                    Lead time: {maxLeadTime} days
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Parts Needed Indicators - Now positioned on the stock graph */}
          <div className="absolute inset-0 pointer-events-none" style={{ left: `${LEFT_MARGIN}px`, right: `${RIGHT_MARGIN}px`, zIndex: 10 }}>
            {partsNeededMarkers.map((marker, idx) => {
              // Calculate Y position based on required stock level
              const graphHeight = 220
              const verticalPadding = 20
              const usableHeight = graphHeight - (verticalPadding * 2)
              const range = stockGraphData.maxStock - stockGraphData.minStock || 1
              
              // Map required stock to Y position (same logic as graph)
              const normalizedValue = (stockGraphData.maxStock - marker.requiredStock) / range
              const yPosition = verticalPadding + (normalizedValue * usableHeight)
              
              return (
                <div
                  key={idx}
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: `${marker.x - LEFT_MARGIN}px`,
                    top: `${yPosition}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                  }}
                  onMouseEnter={() => setHoveredMarkerIdx(idx)}
                  onMouseLeave={() => setHoveredMarkerIdx(null)}
                >
                  {/* Diamond Marker - smaller size */}
                  <div className="relative pointer-events-auto">
                    {/* Outer glow ring - only on hover */}
                    <div 
                      className={`absolute inset-0 w-4 h-4 bg-purple-400 border-2 border-purple-500 rotate-45 blur-sm transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 transition-opacity ${
                        hoveredMarkerIdx === idx ? 'opacity-20' : 'opacity-0'
                      }`}
                    ></div>
                    
                    {/* Main diamond */}
                    <div className={`w-3 h-3 bg-purple-500 border-2 border-purple-700 rotate-45 transition-transform shadow-lg relative ${
                      hoveredMarkerIdx === idx ? 'scale-125' : ''
                    }`}>
                      {/* Inner highlight */}
                      <div className="absolute inset-0.5 bg-purple-300 opacity-40"></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Purple Tooltips - Rendered separately at higher z-index */}
          {partsNeededMarkers.map((marker, idx) => {
            if (hoveredMarkerIdx !== idx) return null
            
            const graphHeight = 220
            const verticalPadding = 20
            const usableHeight = graphHeight - (verticalPadding * 2)
            const range = stockGraphData.maxStock - stockGraphData.minStock || 1
            const normalizedValue = (stockGraphData.maxStock - marker.requiredStock) / range
            const yPosition = verticalPadding + (normalizedValue * usableHeight)
            
            return (
              <div
                key={`tooltip-${idx}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${marker.x}px`,
                  top: `${yPosition}px`,
                  zIndex: 50,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-purple-900 text-white font-mono text-xs rounded whitespace-nowrap shadow-xl border-2 border-purple-600">
                  <div className="font-bold mb-1 text-purple-200">Parts Required</div>
                  <div className="mb-1">{formatShortDate(marker.date)}</div>
                  <div className="font-bold text-purple-300 mb-1">
                    Total Required: {marker.requiredStock} units
                  </div>
                  <div className="border-t border-purple-700 pt-1 mt-1">
                    {marker.boats.map((boat, bidx) => (
                      <div key={bidx} className="text-purple-200">• {boat.boat_name}</div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-4 bg-blue-500 border-2 border-blue-700 rounded"></div>
          <span><strong>PO Bar:</strong> Order → Delivery ({maxLeadTime}d)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 border-2 border-purple-700 rotate-45"></div>
          <span><strong>Diamond:</strong> Required Stock Level at Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-green-600 opacity-50"></div>
          <span><strong>Background Graph:</strong> Total Stock Level (All Parts)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-black"></div>
          <span><strong>Hover Line:</strong> View stock at any date (cumulative)</span>
        </div>
      </div>
    </div>
  )
}
