"use client";

import {
  useState,
  useEffect
} from 'react';
import {
  FiSearch,
  FiX
} from 'react-icons/fi';

interface PublicProvidersSearchWidgetProps {
  onSearch?: (searchTerm: string) => void;
  initialValue?: string;
}

export function PublicProvidersSearchWidget({ onSearch, initialValue = '' }: PublicProvidersSearchWidgetProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedTerm, setDebouncedTerm] = useState(initialValue);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Call onSearch when debounced term changes
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedTerm);
    }
  }, [debouncedTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    setDebouncedTerm('');
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FiSearch className="text-gray-400" size={20} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Təhsil təşkilatı axtar..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-brand transition-colors"
          >
            <FiX className="text-gray-400" size={20} />
          </button>
        )}
      </div>
      {searchTerm && (
        <p className="mt-2 text-sm text-gray-600">
          "{searchTerm}" üçün axtarış...
        </p>
      )}
    </div>
  );
}

