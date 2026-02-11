
import React from 'react';

export type FilterType = 'all' | 'family' | 'friends' | 'work' | 'clients' | 'networking';

interface CategoryFiltersProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: Record<FilterType, number>;
}

export default function CategoryFilters({ currentFilter, onFilterChange, counts }: CategoryFiltersProps) {
  const filters: { id: FilterType; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'clients', label: 'Clients', icon: '🤝' },
    { id: 'networking', label: 'Network', icon: '🌐' },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 gap-2 mb-2 no-scrollbar">
      <div className="flex flex-nowrap gap-2 min-w-max">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
            ${currentFilter === filter.id
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }
          `}
        >
          {filter.icon && <span>{filter.icon}</span>}
          {filter.label}
          <span className={`
            ml-1 px-1.5 py-0.5 rounded text-xs
            ${currentFilter === filter.id
              ? 'bg-white/20'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
            }
          `}>
            {counts[filter.id] || 0}
          </span>
        </button>
      ))}
      </div>
    </div>
  );
}
