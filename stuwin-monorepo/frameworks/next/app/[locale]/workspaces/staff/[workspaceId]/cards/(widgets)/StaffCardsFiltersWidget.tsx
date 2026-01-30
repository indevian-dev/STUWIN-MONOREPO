"use client";

import {
  useState,
  useEffect
} from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useTranslations } from 'next-intl';
import { GlobalSelectWidget } from '@/app/[locale]/(global)/(widgets)/GlobalSelectWidget';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface Filters {
  cardId: string;
  title: string;
  storeName: string;
  categoryId: string;
  isApproved: string;
  isActive: string;
}

interface Category {
  id: number;
  title: string;
}

interface StaffCardsFiltersWidgetProps {
  onFiltersChange: (filters: Filters) => void;
}

declare global {
  interface Window {
    filterTimeout?: NodeJS.Timeout;
  }
}

export function StaffCardsFiltersWidget({ onFiltersChange }: StaffCardsFiltersWidgetProps) {
  const t = useTranslations('Console Cards Filters');
  const [filters, setFilters] = useState<Filters>({
    cardId: '',
    title: '',
    storeName: '',
    categoryId: '',
    isApproved: '',
    isActive: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: '/api/workspaces/staff/categories',
        params: {},
        body: {}
      });

      if (response.status === 200) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Debounce the filter changes to avoid too many API calls
    if (window.filterTimeout) {
      clearTimeout(window.filterTimeout);
    }

    window.filterTimeout = setTimeout(() => {
      onFiltersChange(newFilters);
    }, 300);
  };

  const clearFilters = () => {
    const clearedFilters = {
      cardId: '',
      title: '',
      storeName: '',
      categoryId: '',
      isApproved: '',
      isActive: ''
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // Transform categories data for SelectComponent
  const categoryOptions = [
    { value: '', label: t('all-categories') },
    ...categories.map(category => ({
      value: String(category.id),
      label: category.title
    }))
  ];

  // Approval status options
  const approvalStatusOptions = [
    { value: '', label: t('all-statuses') },
    { value: 'true', label: t('approved') },
    { value: 'false', label: t('pending') }
  ];

  // Active status options
  const activeStatusOptions = [
    { value: '', label: t('all-statuses') },
    { value: 'true', label: t('active') },
    { value: 'false', label: t('inactive') }
  ];

  return (
    <div className="bg-light p-4 rounded shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{t('filters')}</h3>
        <button
          onClick={clearFilters}
          className="text-sm bg-dark text-white hover:bg-brand/80 font-bold py-2 px-3 rounded-full"
        >
          {t('clear-filters')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card ID Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('card-id')}
          </label>
          <input
            type="number"
            value={filters.cardId}
            onChange={(e) => handleFilterChange('cardId', e.target.value)}
            placeholder={t('search-by-card-id')}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand text-sm"
          />
        </div>

        {/* Title Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('title')}
          </label>
          <input
            type="text"
            value={filters.title}
            onChange={(e) => handleFilterChange('title', e.target.value)}
            placeholder={t('search-by-title')}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand text-sm"
          />
        </div>

        {/* Store Name Filter - Changed to input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('store-name')}
          </label>
          <input
            type="text"
            value={filters.storeName}
            onChange={(e) => handleFilterChange('storeName', e.target.value)}
            placeholder={t('search-by-store-name')}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand focus:border-brand text-sm"
          />
        </div>

        {/* Category Filter - Using SelectComponent */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('category')}
          </label>
          <GlobalSelectWidget
            options={categoryOptions}
            value={filters.categoryId}
            onChange={(value: string | string[]) => handleFilterChange('categoryId', Array.isArray(value) ? value[0] || '' : value)}
            placeholder={t('all-categories')}
          />
        </div>

        {/* Approval Status Filter - Using SelectComponent */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('approval-status')}
          </label>
          <GlobalSelectWidget
            options={approvalStatusOptions}
            value={filters.isApproved}
            onChange={(value: string | string[]) => handleFilterChange('isApproved', Array.isArray(value) ? value[0] || '' : value)}
            placeholder={t('all-statuses')}
          />
        </div>

        {/* Active Status Filter - Using SelectComponent */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('active-status')}
          </label>
          <GlobalSelectWidget
            options={activeStatusOptions}
            value={filters.isActive}
            onChange={(value: string | string[]) => handleFilterChange('isActive', Array.isArray(value) ? value[0] || '' : value)}
            placeholder={t('all-statuses')}
          />
        </div>
      </div>
    </div>
  );
}
