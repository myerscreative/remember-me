'use client';

import React from 'react';
import { TreeHealthStatus, ContactCategory, HEALTH_LABELS, CATEGORY_CONFIG } from '../types';

interface TreeFiltersProps {
  activeHealthFilters: TreeHealthStatus[];
  activeCategoryFilters: ContactCategory[];
  onHealthFilterChange: (filters: TreeHealthStatus[]) => void;
  onCategoryFilterChange: (filters: ContactCategory[]) => void;
  onClearAll: () => void;
}

export default function TreeFilters({
  activeHealthFilters,
  activeCategoryFilters,
  onHealthFilterChange,
  onCategoryFilterChange,
  onClearAll,
}: TreeFiltersProps) {
  const hasActiveFilters = activeHealthFilters.length > 0 || activeCategoryFilters.length > 0;

  const toggleHealthFilter = (status: TreeHealthStatus) => {
    if (activeHealthFilters.includes(status)) {
      onHealthFilterChange(activeHealthFilters.filter(f => f !== status));
    } else {
      onHealthFilterChange([...activeHealthFilters, status]);
    }
  };

  const toggleCategoryFilter = (category: ContactCategory) => {
    if (activeCategoryFilters.includes(category)) {
      onCategoryFilterChange(activeCategoryFilters.filter(f => f !== category));
    } else {
      onCategoryFilterChange([...activeCategoryFilters, category]);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Health Status Filters */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">By Health</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(HEALTH_LABELS) as TreeHealthStatus[]).map(status => (
            <FilterChip
              key={status}
              label={HEALTH_LABELS[status].emoji}
              isActive={activeHealthFilters.includes(status)}
              onClick={() => toggleHealthFilter(status)}
              title={HEALTH_LABELS[status].label}
            />
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <p className="text-xs text-gray-500 mb-2">By Category</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_CONFIG) as ContactCategory[]).map(category => (
            <FilterChip
              key={category}
              label={CATEGORY_CONFIG[category].emoji}
              isActive={activeCategoryFilters.includes(category)}
              onClick={() => toggleCategoryFilter(category)}
              title={CATEGORY_CONFIG[category].label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  title?: string;
}

function FilterChip({ label, isActive, onClick, title }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-1' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      {label}
    </button>
  );
}
