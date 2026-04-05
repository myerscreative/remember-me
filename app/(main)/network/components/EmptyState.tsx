import React from 'react';
import { UserPlus } from 'lucide-react';

export default function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-subtle p-4 rounded-full mb-4">
        <UserPlus className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">No contacts found</h3>
      <p className="text-text-tertiary mb-6 max-w-sm">
        We couldn&apos;t find any contacts matching your search or filters.
      </p>
      <button
        onClick={onClearFilters}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}
