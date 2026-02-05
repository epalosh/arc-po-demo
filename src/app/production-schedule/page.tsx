'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Boat, BoatType } from '@/types/database'
import { useEntity } from '@/contexts/EntityContext'
import { Card } from '@/components/ui/Card'

interface ScheduleItem extends Boat {
  startDate: Date
  endDate: Date
  daysUntilDue: number
  boat_type: BoatType | null
}

export default function ProductionSchedulePage() {
  const { selectedEntity } = useEntity()
  const [boats, setBoats] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'list'>('calendar')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (selectedEntity) {
      loadSchedule()
    }
  }, [selectedEntity])

  async function loadSchedule() {
    if (!selectedEntity) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('boats')
        .select(`
          *,
          boat_type:boat_types(*)
        `)
        .eq('entity_id', selectedEntity.id)
        .order('due_date', { ascending: true })
      
      if (error) throw error
      
      const scheduleItems: ScheduleItem[] = (data || []).map(boat => {
        const dueDate = new Date(boat.due_date)
        const startDate = new Date(dueDate)
        startDate.setDate(startDate.getDate() - boat.manufacturing_time_days)
        
        const today = new Date()
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          ...boat,
          startDate,
          endDate: dueDate,
          daysUntilDue,
          boat_type: Array.isArray(boat.boat_type) ? boat.boat_type[0] : boat.boat_type
        }
      })
      
      setBoats(scheduleItems)
    } catch (error) {
      console.error('Error loading schedule:', error)
      alert('Error loading production schedule')
    } finally {
      setLoading(false)
    }
  }

  function getFilteredBoats() {
    if (filterStatus === 'all') return boats
    return boats.filter(boat => boat.status === filterStatus)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-900 border-blue-900'
      case 'in_progress': return 'bg-yellow-100 text-yellow-900 border-yellow-900'
      case 'completed': return 'bg-green-100 text-green-900 border-green-900'
      default: return 'bg-gray-100 text-gray-900 border-gray-900'
    }
  }

  function getUrgencyColor(daysUntilDue: number) {
    if (daysUntilDue < 0) return 'text-red-600 font-bold'
    if (daysUntilDue <= 7) return 'text-red-600'
    if (daysUntilDue <= 14) return 'text-yellow-600'
    return 'text-black'
  }

  function getMonthYearGroups(items: ScheduleItem[]) {
    const groups = new Map<string, ScheduleItem[]>()
    
    items.forEach(item => {
      const monthYear = item.endDate.toLocaleString('default', { month: 'long', year: 'numeric' })
      if (!groups.has(monthYear)) {
        groups.set(monthYear, [])
      }
      groups.get(monthYear)!.push(item)
    })
    
    return Array.from(groups.entries()).sort((a, b) => {
      const dateA = new Date(a[1][0].endDate)
      const dateB = new Date(b[1][0].endDate)
      return dateA.getTime() - dateB.getTime()
    })
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  function getBoatsForDate(date: Date, items: ScheduleItem[]) {
    const dateStr = date.toDateString()
    return items.filter(boat => boat.endDate.toDateString() === dateStr)
  }

  function changeMonth(offset: number) {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + offset)
    setCurrentMonth(newDate)
  }

  function getCalendarDays() {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
    const days: (Date | null)[] = []
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  function getBoatsForCalendar(items: ScheduleItem[]) {
    const { year, month } = getDaysInMonth(currentMonth)
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    
    // Return boats that have any overlap with the current month
    return items.filter(boat => {
      return boat.startDate <= monthEnd && boat.endDate >= monthStart
    })
  }

  function getBoatPosition(boat: ScheduleItem, calendarDays: (Date | null)[]) {
    const { startingDayOfWeek } = getDaysInMonth(currentMonth)
    
    // Find the first non-null day in the calendar
    const firstDayOfMonth = calendarDays.find(d => d !== null)
    if (!firstDayOfMonth) return null
    
    // Calculate which day of the month the boat starts and ends
    const monthStart = new Date(firstDayOfMonth)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    
    // Clamp boat dates to the current month
    const displayStart = boat.startDate < monthStart ? monthStart : boat.startDate
    const displayEnd = boat.endDate > monthEnd ? monthEnd : boat.endDate
    
    // Calculate grid positions (accounting for the empty cells at the start)
    const startDay = displayStart.getDate()
    const endDay = displayEnd.getDate()
    
    // Grid position starts at 0, plus the offset for the starting day of week
    const startPosition = startingDayOfWeek + startDay - 1
    const endPosition = startingDayOfWeek + endDay - 1
    
    // Calculate which row this falls on
    const startRow = Math.floor(startPosition / 7)
    const endRow = Math.floor(endPosition / 7)
    
    // Calculate column positions within the week
    const startCol = startPosition % 7
    const endCol = endPosition % 7
    
    return {
      startDay,
      endDay,
      startPosition,
      endPosition,
      startRow,
      endRow,
      startCol,
      endCol,
      spansSingleRow: startRow === endRow,
      isContinuedFromPrevMonth: boat.startDate < monthStart,
      isContinuedToNextMonth: boat.endDate > monthEnd
    }
  }

  function organizeBoatsIntoLayers(boats: ScheduleItem[], calendarDays: (Date | null)[]) {
    const boatsWithPositions = boats
      .map(boat => ({
        boat,
        position: getBoatPosition(boat, calendarDays)
      }))
      .filter(item => item.position !== null)
    
    // Group boats by row and organize into layers to avoid overlaps
    const rowLayers: Map<number, ScheduleItem[][]> = new Map()
    
    boatsWithPositions.forEach(({ boat, position }) => {
      if (!position) return
      
      const { startRow, endRow } = position
      
      // For boats spanning multiple rows, we'll handle them separately
      for (let row = startRow; row <= endRow; row++) {
        if (!rowLayers.has(row)) {
          rowLayers.set(row, [])
        }
        
        const layers = rowLayers.get(row)!
        let placed = false
        
        // Try to place in an existing layer
        for (const layer of layers) {
          const hasOverlap = layer.some(existingBoat => {
            const existingPos = getBoatPosition(existingBoat, calendarDays)
            if (!existingPos) return false
            
            // Check for column overlap in this specific row
            if (row === startRow && row === position.startRow) {
              // Both boats start in this row
              return !(position.startCol > existingPos.endCol || position.endCol < existingPos.startCol)
            }
            return true // Assume overlap for multi-row boats for simplicity
          })
          
          if (!hasOverlap) {
            layer.push(boat)
            placed = true
            break
          }
        }
        
        // Create new layer if needed
        if (!placed) {
          layers.push([boat])
        }
      }
    })
    
    return { boatsWithPositions, rowLayers }
  }

  const filteredBoats = getFilteredBoats()
  const monthGroups = getMonthYearGroups(filteredBoats)
  
  const stats = {
    total: boats.length,
    scheduled: boats.filter(b => b.status === 'scheduled').length,
    inProgress: boats.filter(b => b.status === 'in_progress').length,
    completed: boats.filter(b => b.status === 'completed').length,
    overdue: boats.filter(b => b.daysUntilDue < 0 && b.status !== 'completed').length
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-black mb-2">Production Schedule</h1>
        <p className="font-mono text-sm text-gray-600">
          Individual production units scheduled for manufacturing
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-black">{stats.total}</div>
            <div className="font-mono text-xs text-gray-600 mt-1">Total Boats</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-blue-600">{stats.scheduled}</div>
            <div className="font-mono text-xs text-gray-600 mt-1">Scheduled</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="font-mono text-xs text-gray-600 mt-1">In Progress</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="font-mono text-xs text-gray-600 mt-1">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-red-600">{stats.overdue}</div>
            <div className="font-mono text-xs text-gray-600 mt-1">Overdue</div>
          </div>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 font-mono text-sm border border-black transition-colors ${
              filterStatus === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('scheduled')}
            className={`px-4 py-2 font-mono text-sm border border-black transition-colors ${
              filterStatus === 'scheduled' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-4 py-2 font-mono text-sm border border-black transition-colors ${
              filterStatus === 'in_progress' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 font-mono text-sm border border-black transition-colors ${
              filterStatus === 'completed' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Completed
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 font-mono text-sm border border-black transition-colors ${
              viewMode === 'calendar' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 font-mono text-sm border border-black transition-colors ${
              viewMode === 'timeline' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 font-mono text-sm border border-black transition-colors ${
              viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 font-mono">Loading schedule...</div>
      ) : filteredBoats.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500 font-mono">
            No boats found for selected filter
          </div>
        </Card>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <Card>
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-black">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 font-mono text-sm border border-black bg-white text-black hover:bg-gray-100"
            >
              ← Previous
            </button>
            <h2 className="font-mono text-2xl font-bold text-black">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 font-mono text-sm border border-black bg-white text-black hover:bg-gray-100"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="relative bg-gray-300" style={{ padding: '1px' }}>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-[1px] bg-gray-300">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <div
                  key={day}
                  className="bg-black text-white font-mono text-xs font-bold text-center py-3"
                >
                  {day.substring(0, 3).toUpperCase()}
                </div>
              ))}
            </div>

            {/* Calendar Body with Boat Overlays */}
            <div className="relative">
              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-[1px] bg-gray-300">
                {(() => {
                  const calendarDays = getCalendarDays()
                  
                  return calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="bg-gray-50 h-[120px]" />
                    }

                    const isToday = date.toDateString() === new Date().toDateString()
                    const isPast = date < new Date() && !isToday

                    return (
                      <div
                        key={date.toISOString()}
                        className={`bg-white h-[120px] p-2 relative ${
                          isToday ? 'ring-2 ring-black ring-inset z-10' : ''
                        } ${isPast ? 'bg-gray-50' : ''}`}
                      >
                        <div
                          className={`font-mono text-sm font-bold ${
                            isToday ? 'text-black' : isPast ? 'text-gray-400' : 'text-black'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Boat Blocks Overlay */}
              <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                {(() => {
                  const calendarDays = getCalendarDays()
                  const boatsInMonth = getBoatsForCalendar(filteredBoats)
                  const { boatsWithPositions } = organizeBoatsIntoLayers(boatsInMonth, calendarDays)
                  
                  // Cell dimensions - matches the grid
                  const cellWidth = 100 / 7 // percentage
                  const cellHeight = 120 // pixels
                  const gap = 1 // pixels
                  
                  // Organize boats by row for layered display
                  const boatsByRow = new Map<number, Array<{ boat: ScheduleItem; position: any; layer: number }>>()
                  
                  boatsWithPositions.forEach(({ boat, position }) => {
                    if (!position) return
                    
                    const { startRow } = position
                    if (!boatsByRow.has(startRow)) {
                      boatsByRow.set(startRow, [])
                    }
                    
                    // Simple layering: stack boats that start in the same row
                    const layer = boatsByRow.get(startRow)!.length
                    boatsByRow.get(startRow)!.push({ boat, position, layer })
                  })
                  
                  // Render boat blocks
                  return Array.from(boatsByRow.values()).flat().map(({ boat, position, layer }) => {
                    const { startPosition, endPosition, startCol, endCol, spansSingleRow, startRow, endRow, isContinuedFromPrevMonth, isContinuedToNextMonth } = position
                    
                    if (spansSingleRow) {
                      // Single row boat block
                      const width = endCol - startCol + 1
                      const leftPercent = startCol * cellWidth
                      const widthPercent = width * cellWidth
                      const topPx = startRow * (cellHeight + gap) + 30 + (layer * 26)
                      
                      return (
                        <div
                          key={`${boat.id}-${layer}`}
                          className={`absolute pointer-events-auto ${getStatusColor(boat.status)} border-2 px-2 py-1 overflow-hidden cursor-pointer hover:z-50 hover:shadow-lg transition-shadow`}
                          style={{
                            left: `calc(${leftPercent}% + ${startCol * gap}px)`,
                            width: `calc(${widthPercent}% - ${gap}px)`,
                            top: `${topPx}px`,
                            height: '22px',
                            zIndex: 10 + layer
                          }}
                          title={`${boat.name} - ${boat.model}\nStatus: ${boat.status}\n${boat.startDate.toLocaleDateString()} - ${boat.endDate.toLocaleDateString()}\nMfg Time: ${boat.manufacturing_time_days} days`}
                        >
                          <div className="font-mono text-xs font-bold truncate leading-tight">
                            {isContinuedFromPrevMonth && '← '}
                            {boat.name}
                            {isContinuedToNextMonth && ' →'}
                          </div>
                        </div>
                      )
                    } else {
                      // Multi-row boat - render segments for each row
                      const segments = []
                      const totalRows = endRow - startRow + 1
                      
                      for (let i = 0; i < totalRows; i++) {
                        const currentRow = startRow + i
                        const isFirstSegment = i === 0
                        const isLastSegment = i === totalRows - 1
                        
                        let segmentStartCol = isFirstSegment ? startCol : 0
                        let segmentEndCol = isLastSegment ? endCol : 6
                        let segmentWidth = segmentEndCol - segmentStartCol + 1
                        
                        const leftPercent = segmentStartCol * cellWidth
                        const widthPercent = segmentWidth * cellWidth
                        const topPx = currentRow * (cellHeight + gap) + 30 + (layer * 26)
                        
                        segments.push(
                          <div
                            key={`${boat.id}-${layer}-row${i}`}
                            className={`absolute pointer-events-auto ${getStatusColor(boat.status)} border-2 px-2 py-1 overflow-hidden cursor-pointer hover:z-50 hover:shadow-lg transition-shadow`}
                            style={{
                              left: `calc(${leftPercent}% + ${segmentStartCol * gap}px)`,
                              width: `calc(${widthPercent}% - ${gap}px)`,
                              top: `${topPx}px`,
                              height: '22px',
                              zIndex: 10 + layer
                            }}
                            title={`${boat.name} - ${boat.model}\nStatus: ${boat.status}\n${boat.startDate.toLocaleDateString()} - ${boat.endDate.toLocaleDateString()}\nMfg Time: ${boat.manufacturing_time_days} days`}
                          >
                            <div className="font-mono text-xs font-bold truncate leading-tight">
                              {isFirstSegment && isContinuedFromPrevMonth && '← '}
                              {isFirstSegment ? boat.name : ''}
                              {isLastSegment && isContinuedToNextMonth && ' →'}
                            </div>
                          </div>
                        )
                      }
                      
                      return segments
                    }
                  })
                })()}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-6 pt-4 border-t border-gray-300 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-blue-900 bg-blue-100" />
              <span className="font-mono text-xs text-black">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-yellow-900 bg-yellow-100" />
              <span className="font-mono text-xs text-black">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-green-900 bg-green-100" />
              <span className="font-mono text-xs text-black">Completed</span>
            </div>
          </div>
        </Card>
      ) : viewMode === 'timeline' ? (
        /* Timeline View - Grouped by Month */
        <div className="space-y-6">
          {monthGroups.map(([monthYear, items]) => (
            <Card key={monthYear} title={monthYear}>
              <div className="space-y-3">
                {items.map((boat) => (
                  <div
                    key={boat.id}
                    className="border border-gray-300 p-4 hover:border-black transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-mono text-lg font-bold text-black">
                            {boat.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-mono border ${getStatusColor(boat.status)}`}>
                            {boat.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="font-mono text-sm text-gray-600">
                          Model: {boat.model}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold ${getUrgencyColor(boat.daysUntilDue)}`}>
                          {boat.daysUntilDue < 0 ? (
                            `${Math.abs(boat.daysUntilDue)} days overdue`
                          ) : boat.daysUntilDue === 0 ? (
                            'Due today'
                          ) : (
                            `${boat.daysUntilDue} days until due`
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <div className="font-mono text-xs text-gray-500 mb-1">Start Date</div>
                        <div className="font-mono text-sm text-black font-bold">
                          {boat.startDate.toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-gray-500 mb-1">Due Date</div>
                        <div className="font-mono text-sm text-black font-bold">
                          {boat.endDate.toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-gray-500 mb-1">Manufacturing Time</div>
                        <div className="font-mono text-sm text-black">
                          {boat.manufacturing_time_days} days
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-gray-500 mb-1">Parts Required</div>
                        <div className="font-mono text-sm text-black">
                          {boat.boat_type?.mbom?.parts?.length || 0} parts
                        </div>
                      </div>
                    </div>

                    {boat.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="font-mono text-xs text-gray-500 mb-1">Notes</div>
                        <div className="font-mono text-sm text-gray-700">{boat.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List View - Compact Table */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b-2 border-black">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-sm font-bold text-black">
                    Unit Name
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-sm font-bold text-black">
                    Boat Type
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-sm font-bold text-black">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-sm font-bold text-black">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-sm font-bold text-black">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-sm font-bold text-black">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-sm font-bold text-black">
                    Mfg Time
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-sm font-bold text-black">
                    Days Until Due
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBoats.map((boat) => (
                  <tr key={boat.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-black font-bold">
                      {boat.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">
                      {boat.boat_type?.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-black">
                      {boat.model}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-mono border ${getStatusColor(boat.status)}`}>
                        {boat.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-black">
                      {boat.startDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-black">
                      {boat.endDate.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-black">
                      {boat.manufacturing_time_days} days
                    </td>
                    <td className={`px-4 py-3 font-mono text-sm ${getUrgencyColor(boat.daysUntilDue)}`}>
                      {boat.daysUntilDue < 0 ? (
                        `${Math.abs(boat.daysUntilDue)}d overdue`
                      ) : boat.daysUntilDue === 0 ? (
                        'Today'
                      ) : (
                        `${boat.daysUntilDue}d`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
