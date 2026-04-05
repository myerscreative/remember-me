
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
              ? 'bg-canvas text-text-primary border-canvas dark:bg-indigo-600 dark:border-indigo-600'
              : 'bg-surface text-text-tertiary border-border-default hover:bg-canvas hover:border-border-strong'
            }
          `}
        >
          {filter.icon && <span>{filter.icon}</span>}
          {filter.label}
          <span className={`
            ml-1 px-1.5 py-0.5 rounded text-xs
            ${currentFilter === filter.id
              ? 'bg-white/20'
              : 'bg-subtle text-text-secondary'
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
