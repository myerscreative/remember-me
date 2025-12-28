"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
  addMonths, 
  eachDayOfInterval, 
  endOfMonth, 
  endOfWeek, 
  format, 
  isSameDay, 
  isSameMonth, 
  isToday, 
  startOfMonth, 
  startOfWeek, 
  subMonths 
} from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarProps = {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  className,
}: CalendarProps) {
  // Use a state for "today" to avoid hydration mismatches between server and client time
  const [today, setToday] = React.useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(selected || new Date())

  React.useEffect(() => {
    const now = new Date();
    setToday(now);
    console.log('Calendar initialized. Detected today:', now.toString());
  }, [])
  
  // Initialize currentMonth to selected date if provided, otherwise today (once available) or now
  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(selected)
    }
  }, [selected])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  return (
    <div className={cn("p-3 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800", className)}>
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-[0.8rem] font-medium text-slate-500 dark:text-slate-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, dayIdx) => {
          const isSelected = selected ? isSameDay(day, selected) : false
          const isCurrentMonth = isSameMonth(day, currentMonth)
          // Only check isToday if we have a client-side date to compare against
          const isCurrentDay = today ? isSameDay(day, today) : false

          return (
            <button
              key={day.toString()}
              onClick={() => onSelect?.(day)}
              className={cn(
                "h-9 w-9 p-0 text-sm rounded-md flex items-center justify-center transition-all relative",
                !isCurrentMonth && "text-slate-300 dark:text-slate-600 opacity-50",
                isSelected && "bg-blue-600 text-white hover:bg-blue-600 hover:text-white shadow-md z-10",
                !isSelected && isCurrentMonth && "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800",
                !isSelected && !isCurrentMonth && "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                isCurrentDay && !isSelected && "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500 dark:ring-blue-400"
              )}
            >
              {format(day, "d")}
              {isCurrentDay && !isSelected && (
                <span className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
