"use client";

import {
  useState,
  useEffect
} from 'react';
import Image
  from 'next/image';
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiCheckCircle
} from 'react-icons/fi';
import { PublicSingleMarkerMapWidget } from '@/app/[locale]/(public)/(widgets)/PublicSingleMarkerMapWidget';

interface ProviderLocation {
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface Provider {
  id: string;
  title: string | null;
  logo: string | null;
  description?: string | null;
  is_active?: boolean | null;
  location?: ProviderLocation | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

interface PublicSingleProviderWidgetProps {
  Provider?: Provider | null;
}

export function PublicSingleProviderWidget({ Provider }: PublicSingleProviderWidgetProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'location'>('about');

  if (!Provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Təhsil təşkilatı tapılmadı</p>
      </div>
    );
  }

  const logoUrl = Provider.logo 
    ? `https://s3.tebi.io/shagguide/Providers/${Provider.id}/${Provider.logo}`
    : '/placeholder-Provider.png';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Logo */}
          <div className="md:col-span-1">
            <div className="relative w-full aspect-square bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden">
              <Image
                src={logoUrl}
                alt={Provider.title || 'Educational Organization'}
                fill
                className="object-contain p-4"
                priority
              />
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-2 flex flex-col justify-center">
            <div className="flex items-start gap-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {Provider.title}
              </h1>
              {Provider.is_active && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <FiCheckCircle size={16} />
                  Aktiv
                </span>
              )}
            </div>

            {Provider.description && (
              <p className="text-gray-600 text-lg mb-4">
                {Provider.description}
              </p>
            )}

            {/* Quick Info */}
            <div className="space-y-2">
              {Provider.location && (
                <div className="flex items-start gap-2 text-gray-700">
                  <FiMapPin className="flex-shrink-0 mt-1" size={18} />
                  <span>
                    {Provider.location.address || Provider.location.city || 'Ünvan mövcuddur'}
                  </span>
                </div>
              )}
              
              {Provider.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <FiPhone size={18} />
                  <a href={`tel:${Provider.phone}`} className="hover:text-brand">
                    {Provider.phone}
                  </a>
                </div>
              )}
              
              {Provider.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <FiMail size={18} />
                  <a href={`mailto:${Provider.email}`} className="hover:text-brand">
                    {Provider.email}
                  </a>
                </div>
              )}
              
              {Provider.website && (
                <div className="flex items-center gap-2 text-gray-700">
                  <FiGlobe size={18} />
                  <a 
                    href={Provider.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-brand"
                  >
                    {Provider.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'about'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Haqqında
            </button>
            {Provider.location && (
              <button
                onClick={() => setActiveTab('location')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'location'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Ünvan
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'about' && (
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold mb-4">
                {Provider.title} haqqında
              </h2>
              <div className="text-gray-700 leading-relaxed">
                {Provider.description || 'Ətraflı məlumat yoxdur'}
              </div>
              
              {/* Additional Info Section */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Əlaqə məlumatları</h3>
                  <div className="space-y-2 text-sm">
                    {Provider.phone && (
                      <p className="flex items-center gap-2">
                        <FiPhone size={14} />
                        <a href={`tel:${Provider.phone}`} className="hover:text-brand">
                          {Provider.phone}
                        </a>
                      </p>
                    )}
                    {Provider.email && (
                      <p className="flex items-center gap-2">
                        <FiMail size={14} />
                        <a href={`mailto:${Provider.email}`} className="hover:text-brand">
                          {Provider.email}
                        </a>
                      </p>
                    )}
                    {Provider.website && (
                      <p className="flex items-center gap-2">
                        <FiGlobe size={14} />
                        <a 
                          href={Provider.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-brand"
                        >
                          Veb sayt
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'location' && Provider.location && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Ünvan</h2>
              {Provider.location.address && (
                <p className="text-gray-700 mb-4 flex items-start gap-2">
                  <FiMapPin className="flex-shrink-0 mt-1" size={18} />
                  <span>{Provider.location.address}</span>
                </p>
              )}
              
              {Provider.location.latitude && Provider.location.longitude && (
                <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                  <PublicSingleMarkerMapWidget
                    location={{
                      lat: Provider.location.latitude,
                      lng: Provider.location.longitude
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

