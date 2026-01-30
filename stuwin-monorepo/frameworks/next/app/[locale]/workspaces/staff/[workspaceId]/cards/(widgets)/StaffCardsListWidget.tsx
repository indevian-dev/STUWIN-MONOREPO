"use client";

import {
  useState,
  useEffect
} from 'react';
import { StaffCardsFiltersWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/cards/(widgets)/StaffCardsFiltersWidget';
import { StaffCardListItemWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/cards/(widgets)/StaffCardListItemWidget';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useTranslations } from 'next-intl';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface Card {
  id: number;
  is_approved: boolean;
  created_at: string;
  [key: string]: any;
}

interface Filters {
  cardId: string;
  title: string;
  storeName: string;
  categoryId: string;
  isApproved: string;
  isActive: string;
}

interface Pagination {
  total: number;
  totalPages: number;
  pageSize: number;
}

export function StaffCardsListWidget() {
  const t = useTranslations('Cards');
  const [cards, setCards] = useState<Card[]>([]);


  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    cardId: '',
    title: '',
    storeName: '',
    categoryId: '',
    isApproved: '',
    isActive: ''
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    pageSize: 20
  });

  useEffect(() => {
    fetchCards();
  }, [page, filters]);

  const fetchCards = async () => {
    setLoading(true);

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pagination.pageSize.toString()
    });

    // Add filter parameters
    (Object.keys(filters) as (keyof Filters)[]).forEach(key => {
      if (filters[key] && filters[key].toString().trim() !== '') {
        params.append(key, filters[key]);
      }
    });

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/staff/cards?${params.toString()}`,
      params: {},
      body: {}
    });

    if (response.status === 200) {
      setCards(response.data.cards);
      setPagination({
        total: response.data.total,
        totalPages: response.data.totalPages,
        pageSize: response.data.pageSize
      });
    } else {
      ConsoleLogger.error('Error fetching cards:', response.data);
      toast.error('Error fetching cards');
    }
    setLoading(false);
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  return (
    <div className="container mx-auto">
      {/* Filters Component */}
      <StaffCardsFiltersWidget onFiltersChange={handleFiltersChange} />

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-slate-600">
          {loading ? 'Loading...' : `Showing ${cards.length} of ${pagination.total} cards`}
        </p>
      </div>

      {/* Cards List */}
      <div className="flex flex-wrap gap-3">
        {loading ? (
          <p className="text-center w-full">Loading...</p>
        ) : cards.length === 0 ? (
          <p className="text-center w-full text-slate-500">No cards found matching your filters.</p>
        ) : (
          cards.map((card) => (
            <StaffCardListItemWidget
              key={card.id}
              card={card}
              t={t}
              onRefreshList={fetchCards}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
          className="px-4 py-2 mr-2 border rounded text-slate-900 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-slate-900">
          Page {page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= pagination.totalPages || loading}
          className="px-4 py-2 border rounded text-slate-900 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}

