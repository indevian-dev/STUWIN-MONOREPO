"use client";

import {
  useState,
  useEffect
} from 'react';
import { PublicProvidersListItemWidget } from './PublicProvidersListItemWidget';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface ProviderLocation {
  address?: string;
  city?: string;
}

interface Provider {
  id: string;
  createdAt: Date | string;
  title: string | null;
  description: string | null;
  logo: string | null;
  isActive: boolean | null;
  isApproved: boolean | null;
  location?: ProviderLocation | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  accountId: string | null;
}

interface PublicProvidersListWidgetProps {
  initialProviders?: Provider[];
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function PublicProvidersListWidget({
  initialProviders = [],
  page = 1,
  pageSize = 24,
  onPageChange
}: PublicProvidersListWidgetProps) {
  const [Providers, setProviders] = useState<Provider[]>(initialProviders);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  useEffect(() => {
    if (initialProviders.length > 0) {
      setProviders(initialProviders);
    }
  }, [initialProviders]);

  const fetchProviders = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/Providers?page=${pageNum}&pageSize=${pageSize}`
      });

      if (response.status === 200) {
        setProviders(response.data.Providers || []);
        setTotal(response.data.total || 0);
        setCurrentPage(pageNum);
        if (onPageChange) {
          onPageChange(pageNum);
        }
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching Providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (!Providers || Providers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Təhsil təşkilatı tapılmadı</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Providers.map((Provider) => (
          <PublicProvidersListItemWidget
            key={Provider.id}
            Provider={Provider}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => fetchProviders(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Əvvəlki
          </button>

          <span className="px-4 py-2 text-sm text-gray-600">
            Səhifə {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => fetchProviders(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Növbəti
          </button>
        </div>
      )}
    </div>
  );
}

