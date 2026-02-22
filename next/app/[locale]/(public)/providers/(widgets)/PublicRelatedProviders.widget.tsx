"use client";

import {
  useState,
  useEffect
} from 'react';
import { PublicProviderCardTile } from '@/app/[locale]/(public)/providers/(tiles)/PublicProviderCard.tile';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
interface ProviderLocation {
  city?: string;
  address?: string;
}

interface Provider {
  id: string;
  title: string | null;
  logo: string | null;
  location?: ProviderLocation | null;
}

interface PublicRelatedProvidersWidgetProps {
  currentProviderId?: string;
  limit?: number;
}

/**
 * Shows related/similar educational organizations
 * Can be used on single Provider page to show other nearby or similar organizations
 */
export function PublicRelatedProvidersWidget({ currentProviderId, limit = 6 }: PublicRelatedProvidersWidgetProps) {
  const [relatedProviders, setRelatedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await fetchApiUtil<any>({
          method: 'GET',
          url: `/api/Providers?pageSize=${limit + 1}`
        });

        if (true) { // apiCall ensures success
          // Filter out current Provider and limit results
          const filtered = (response.Providers || response || [])
            .filter((Provider: Provider) => Provider.id !== currentProviderId)
            .slice(0, limit);

          setRelatedProviders(filtered);
        }
      } catch (error) {
        ConsoleLogger.error('Error fetching related Providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentProviderId, limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-app border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedProviders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-app border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Digər Təhsil Təşkilatları
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedProviders.map((Provider) => (
          <PublicProviderCardTile
            key={Provider.id}
            Provider={Provider}
          />
        ))}
      </div>
    </div>
  );
}

