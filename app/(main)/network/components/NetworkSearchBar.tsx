import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface NetworkSearchBarProps {
  onSearch: (term: string) => void;
}

export default function NetworkSearchBar({ onSearch }: NetworkSearchBarProps) {
  const [term, setTerm] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(term.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [term, onSearch]);

  return (
    <div className="flex items-center mx-4 md:mx-8 my-4">
      <div className="relative flex-1">
        <input
          id="network-search-input"
          type="text"
          placeholder="Search by interest, skill, location..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          value={term}
          onChange={e => setTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}
