"use client"
import { getS3Url } from '@/lib/utils/upload/S3Util';;

import Image
  from 'next/image';
import { Link } from '@/i18n/routing';
import {
  FiMapPin
} from 'react-icons/fi';

interface ProviderLocation {
  city?: string;
  address?: string;
}

interface Provider {
  id: string;
  title: string | null;
  logo: string | null;
  location?: ProviderLocation | null;
  providerSubscriptionPrice?: number | null;
}

interface PublicProviderCardTileProps {
  Provider: Provider;
  compact?: boolean;
}

/**
 * Alternative compact card design for Provider
 * Can be used in horizontal lists or compact grids
 */
export function PublicProviderCardTile({ Provider, compact = false }: PublicProviderCardTileProps) {
  if (!Provider) return null;

  const logoUrl = Provider.logo
    ? getS3Url(`providers/${Provider.id}/${Provider.logo}`)
    : '/placeholder-Provider.png';

  if (compact) {
    return (
      <Link
        href={`/providers/${Provider.id}`}
        className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all group"
      >
        <div className="relative w-16 h-16 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden">
          <Image
            src={logoUrl}
            alt={Provider.title || 'Provider'}
            fill
            className="object-contain p-2"
            sizes="64px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-brand transition-colors">
            {Provider.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {Provider.location?.city && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FiMapPin size={12} />
                <span className="truncate">{Provider.location.city}</span>
              </p>
            )}
            {Provider.providerSubscriptionPrice !== undefined && (
              <p className="text-xs font-bold text-brand ml-auto">
                {Provider.providerSubscriptionPrice === 0 ? 'Free' : `${Provider.providerSubscriptionPrice} AZN`}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/providers/${Provider.id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all group"
    >
      <div className="relative w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-50">
        <Image
          src={logoUrl}
          alt={Provider.title || 'Provider'}
          fill
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-1 group-hover:text-brand transition-colors">
          {Provider.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          {Provider.location && (
            <p className="text-xs text-gray-500 line-clamp-1 flex items-center gap-1">
              <FiMapPin size={12} />
              <span>{Provider.location.address || Provider.location.city}</span>
            </p>
          )}
          {Provider.providerSubscriptionPrice !== undefined && (
            <p className="text-xs font-bold text-brand">
              {Provider.providerSubscriptionPrice === 0 ? 'Free' : `${Provider.providerSubscriptionPrice} AZN`}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

