import { memo, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DayActivity {
  date: string
  count: number
  timeSpent: string
  label: string
}

interface LearningHeatmapProps {
  history: any[]
}

export const LearningHeatmap = memo(function LearningHeatmap({ history }: LearningHeatmapProps) {
  const [selectedYear, setSelectedYear] = useState(2024)
  const weeksToShow = 53 // Full year

  const formatTimeSpent = (count: number) => {
    if (count === 0) return '0 minutes'
    // Estimation: ~8 minutes per interaction/chat exchange
    const totalMinutes = count * 8
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60

    if (h > 0) return `${h}h ${m}m spent mastering subjects`
    return `${m}m spent mastering subjects`
  }
  // Process real history data
  const activities = useMemo(() => {
    const data: DayActivity[] = []

    // Start of the selected year
    const startDate = new Date(selectedYear, 0, 1)
    // Align to the first Sunday of the year or the week before to start clean
    const firstDayOfYear = startDate.getDay()
    startDate.setDate(startDate.getDate() - firstDayOfYear)

    const totalDays = weeksToShow * 7

    // Count contributions by date string
    const contributionMap: Record<string, number> = {}
    history.forEach(item => {
      const dateStr = new Date(item.created_at).toISOString().split('T')[0]
      contributionMap[dateStr] = (contributionMap[dateStr] || 0) + 1
    })

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const count = contributionMap[dateStr] || 0

      const isCorrectYear = d.getFullYear() === selectedYear
      const timeLabel = formatTimeSpent(count)

      data.push({
        date: dateStr,
        count: isCorrectYear ? count : 0,
        timeSpent: timeLabel,
        label: isCorrectYear
          ? `${timeLabel} on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : `No activity on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      })
    }
    return data
  }, [history, selectedYear])

  const totalInYear = useMemo(() => {
    return activities
      .filter(a => new Date(a.date).getFullYear() === selectedYear)
      .reduce((acc, curr) => acc + curr.count, 0)
  }, [activities, selectedYear])

  // GitHub Dark Mode Palette
  const getColor = (count: number) => {
    if (count === 0) return 'bg-[#161b22]' // Empty
    if (count === 1) return 'bg-[#0e4429]' // Level 1
    if (count === 2) return 'bg-[#006d32]' // Level 2
    if (count === 3) return 'bg-[#26a641]' // Level 3
    return 'bg-[#39d353]' // Level 4
  }

  // Get months for header
  const months = useMemo(() => {
    const result: { label: string; offset: number }[] = []
    let lastMonth = -1
    activities.forEach((day, i) => {
      if (i % 7 === 0) { // Check start of each week
        const d = new Date(day.date)
        const m = d.getMonth()
        if (m !== lastMonth) {
          result.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), offset: Math.floor(i / 7) })
          lastMonth = m
        }
      }
    })
    return result
  }, [activities])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-normal text-slate-100 italic">
          <span className="font-semibold not-italic">{totalInYear} contributions</span> in {selectedYear}
        </h3>
      </div>

      <div className="flex gap-4">
        {/* Main Graph Card */}
        <div className="flex-1 rounded-md border border-[#30363d] bg-transparent p-4 transition-all">
          <TooltipProvider delayDuration={0}>
            <div className="relative">
              {/* Months Header */}
              <div className="flex text-[10px] text-slate-400 mb-2 ml-8 relative h-3 font-medium">
                {months.map((m: { label: string; offset: number }, i: number) => (
                  <span key={i} className="absolute" style={{ left: `${m.offset * 12.5}px` }}>
                    {m.label}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                {/* Day Labels */}
                <div className="flex flex-col justify-between text-[10px] text-slate-400 py-1 h-[95px] w-6 text-left pl-1">
                  <span className="invisible">Sun</span>
                  <span>Mon</span>
                  <span className="invisible">Tue</span>
                  <span>Wed</span>
                  <span className="invisible">Thu</span>
                  <span>Fri</span>
                  <span className="invisible">Sat</span>
                </div>

                {/* Grid */}
                <div className="grid grid-flow-col grid-rows-7 gap-[3px] auto-cols-max">
                  {activities.map((day, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div
                          className={`size-[10px] rounded-sm transition-all cursor-pointer ${getColor(day.count)} border border-white/[0.02] hover:border-white/30`}
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="text-[11px] px-3 py-1.5 bg-[#161b22] border-[#30363d] text-slate-100 shadow-xl"
                      >
                        {day.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 px-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <span>Less</span>
                  <div className="flex gap-[3px]">
                    {[0, 1, 2, 3, 4].map((lvl) => (
                      <div key={lvl} className={`size-[10px] rounded-sm ${getColor(lvl)} border border-white/[0.02]`} />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Year Selector Sidebar */}
        <div className="flex flex-col gap-1 w-24">
          {[2026, 2025, 2024].map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-all text-left ${selectedYear === year
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-800'
                }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default LearningHeatmap
