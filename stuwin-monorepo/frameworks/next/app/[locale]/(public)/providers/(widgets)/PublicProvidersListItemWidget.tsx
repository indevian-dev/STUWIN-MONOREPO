"use client";

import React from 'react';
import Image
  from 'next/image';
import { Link } from '@/i18n/routing';
import {
  FiMapPin,
  FiCheckCircle
} from 'react-icons/fi';

interface ProviderLocation {
  address?: string;
  city?: string;
}

type Provider = {
  id: string;
  title: string | null;
  logo?: string | null;
  isActive?: boolean | null;
  description?: string | null;
  location?: ProviderLocation | null;
};

type PublicProvidersListItemWidgetProps = {
  Provider: Provider;
};

export function PublicProvidersListItemWidget({ Provider }: PublicProvidersListItemWidgetProps): React.JSX.Element | null {
  if (!Provider) return null;

  const logoUrl = Provider.logo
    ? `https://s3.tebi.io/stuwin.ai/providers/${Provider.id}/${Provider.logo}`
    : '/placeholder-Provider.png';

  return (
    <Link
      href={`/providers/${Provider.id}`}
      className="block h-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group"
    >
      {/* Logo/Image Container */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
        <Image
          src={logoUrl}
          alt={Provider.title || 'Educational Organization'}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {Provider.isActive && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
            <FiCheckCircle size={12} />
            Aktiv
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-brand transition-colors">
          {Provider.title || 'Educational Organization'}
        </h3>

        {/* Description */}
        {Provider.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {Provider.description}
          </p>
        )}

        {/* Location */}
        {Provider.location && (
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <FiMapPin className="flex-shrink-0 mt-0.5" size={14} />
            <span className="line-clamp-1">
              {Provider.location.address || Provider.location.city || 'Location available'}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

