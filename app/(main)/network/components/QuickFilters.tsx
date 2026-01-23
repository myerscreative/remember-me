import React from 'react';

interface QuickFiltersProps {
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
}

const FILTERS = [
  { id: 'shared', label: 'Shared Interests' },
  { id: 'notConnected', label: 'Not Connected' },
  { id: 'sameLocation', label: 'Same Location' },
  { id: 'overdue', label: 'Overdue' },
];

export default function QuickFilters({ activeFilters, setActiveFilters }: QuickFiltersProps) {
  const toggleFilter = (id: string) => {
    if (activeFilters.includes(id)) {
      setActiveFilters(activeFilters.filter((f) => f !== id));
    } else {
      setActiveFilters([...activeFilters, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => toggleFilter(filter.id)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            activeFilters.includes(filter.id)
              ? 'bg-[#6366f1] text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
