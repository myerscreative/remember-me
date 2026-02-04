"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CommunicationActivity {
  date: string;
  interactions: number;
}

interface CommunicationActivityChartProps {
  data: CommunicationActivity[];
  className?: string;
}

export function CommunicationActivityChart({
  data,
  className
}: CommunicationActivityChartProps) {
  // Aggregate data for longer time ranges
  const { chartData, maxValue, totalInteractions } = useMemo(() => {
    if (data.length === 0) {
      return { chartData: [], maxValue: 0, totalInteractions: 0 };
    }

    const total = data.reduce((sum, d) => sum + d.interactions, 0);

    // For 7 days or less, show daily data
    if (data.length <= 7) {
      const max = Math.max(...data.map(d => d.interactions), 1);
      return {
        chartData: data.map(d => ({
          label: formatDate(d.date, 'short'),
          value: d.interactions,
          fullDate: d.date
        })),
        maxValue: max,
        totalInteractions: total
      };
    }

    // For 8-35 days, show weekly aggregates
    if (data.length <= 35) {
      const weeks = aggregateByWeek(data);
      const max = Math.max(...weeks.map(w => w.value), 1);
      return { chartData: weeks, maxValue: max, totalInteractions: total };
    }

    // For longer periods, show monthly aggregates
    const months = aggregateByMonth(data);
    const max = Math.max(...months.map(m => m.value), 1);
    return { chartData: months, maxValue: max, totalInteractions: total };
  }, [data]);

  if (data.length === 0 || totalInteractions === 0) {
    return (
      <div className={cn("h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg", className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No interaction data available for this period
        </p>
      </div>
    );
  }

  const barWidth = Math.min(40, Math.max(8, Math.floor(600 / chartData.length) - 4));
  const chartHeight = 220;
  const chartPadding = { top: 20, right: 20, bottom: 40, left: 40 };

  return (
    <div className={cn("relative", className)}>
      {/* Stats summary */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{totalInteractions}</span> total interactions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">
              {(totalInteractions / data.length).toFixed(1)}
            </span> avg/day
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[300px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartData.length * (barWidth + 4) + chartPadding.left + chartPadding.right} ${chartHeight + chartPadding.top + chartPadding.bottom}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartPadding.top + chartHeight * (1 - ratio);
            return (
              <g key={i}>
                <line
                  x1={chartPadding.left}
                  y1={y}
                  x2={chartData.length * (barWidth + 4) + chartPadding.left}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  className="text-gray-400 dark:text-gray-600"
                />
                <text
                  x={chartPadding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 dark:fill-gray-500 text-[10px]"
                >
                  {Math.round(maxValue * ratio)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = chartPadding.left + index * (barWidth + 4);
            const y = chartPadding.top + chartHeight - barHeight;

            return (
              <g key={index} className="group">
                {/* Bar background for hover */}
                <rect
                  x={x}
                  y={chartPadding.top}
                  width={barWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                />

                {/* Actual bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx={Math.min(4, barWidth / 4)}
                  className="fill-blue-500 dark:fill-blue-400 transition-all duration-200 group-hover:fill-blue-600 dark:group-hover:fill-blue-300"
                />

                {/* Hover tooltip */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <rect
                    x={x + barWidth / 2 - 30}
                    y={y - 35}
                    width={60}
                    height={28}
                    rx={4}
                    className="fill-gray-900 dark:fill-gray-100"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 17}
                    textAnchor="middle"
                    className="fill-white dark:fill-gray-900 text-[11px] font-medium"
                  >
                    {item.value} interaction{item.value !== 1 ? 's' : ''}
                  </text>
                </g>

                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={chartPadding.top + chartHeight + 20}
                  textAnchor="middle"
                  className="fill-gray-500 dark:fill-gray-400 text-[10px]"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// Helper functions
function formatDate(dateStr: string, format: 'short' | 'long'): string {
  const date = new Date(dateStr);
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function aggregateByWeek(data: CommunicationActivity[]): { label: string; value: number; fullDate: string }[] {
  const weeks: { label: string; value: number; fullDate: string }[] = [];
  let currentWeekStart = '';
  let currentWeekTotal = 0;

  data.forEach((item, index) => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);

    if (weekStart !== currentWeekStart) {
      if (currentWeekStart) {
        weeks.push({
          label: formatWeekLabel(currentWeekStart),
          value: currentWeekTotal,
          fullDate: currentWeekStart
        });
      }
      currentWeekStart = weekStart;
      currentWeekTotal = item.interactions;
    } else {
      currentWeekTotal += item.interactions;
    }

    // Push the last week
    if (index === data.length - 1) {
      weeks.push({
        label: formatWeekLabel(currentWeekStart),
        value: currentWeekTotal,
        fullDate: currentWeekStart
      });
    }
  });

  return weeks;
}

function aggregateByMonth(data: CommunicationActivity[]): { label: string; value: number; fullDate: string }[] {
  const months = new Map<string, number>();

  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.set(monthKey, (months.get(monthKey) || 0) + item.interactions);
  });

  return Array.from(months.entries()).map(([key, value]) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      value,
      fullDate: key
    };
  });
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string): string {
  const date = new Date(weekStart);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
