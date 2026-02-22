"use client";

import {
  useState
} from 'react';
import {
  FiFilter,
  FiX
} from 'react-icons/fi';

interface Filters {
  isActive: string;
  hasLocation: string;
  sortBy: string;
  sortOrder: string;
}

interface PublicProvidersFilterWidgetProps {
  onFilterChange?: (filters: Filters) => void;
}

export function PublicProvidersFilterWidget({ onFilterChange }: PublicProvidersFilterWidgetProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    isActive: 'all',
    hasLocation: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const resetFilters = () => {
    const defaultFilters = {
      isActive: 'all',
      hasLocation: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    
    if (onFilterChange) {
      onFilterChange(defaultFilters);
    }
  };

  const hasActiveFilters = 
    filters.isActive !== 'all' || 
    filters.hasLocation !== 'all' ||
    filters.sortBy !== 'created_at' ||
    filters.sortOrder !== 'desc';

  return (
    <div className="bg-white border border-gray-200 rounded-app p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 font-medium text-gray-900 hover:text-app-bright-green transition-colors"
        >
          <FiFilter size={20} />
          <span>Filterlər</span>
          {hasActiveFilters && (
            <span className="bg-app-bright-green text-white text-xs px-2 py-1 rounded-app-full">
              Aktiv
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-app-bright-green transition-colors"
          >
            <FiX size={16} />
            Sıfırla
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isActive"
                  value="all"
                  checked={filters.isActive === 'all'}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Hamısı</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isActive"
                  value="active"
                  checked={filters.isActive === 'active'}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Yalnız aktiv</span>
              </label>
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ünvan
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasLocation"
                  value="all"
                  checked={filters.hasLocation === 'all'}
                  onChange={(e) => handleFilterChange('hasLocation', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Hamısı</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasLocation"
                  value="yes"
                  checked={filters.hasLocation === 'yes'}
                  onChange={(e) => handleFilterChange('hasLocation', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Ünvanı olanlar</span>
              </label>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sıralama
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-app focus:ring-2 focus:ring-app focus:border-transparent mb-2"
            >
              <option value="created_at">Tarix</option>
              <option value="title">Ad</option>
            </select>
            
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-app focus:ring-2 focus:ring-app focus:border-transparent"
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

