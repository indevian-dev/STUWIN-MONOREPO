"use client";

import {
  useState,
  useEffect
} from 'react';
import {
  FiUsers,
  FiMapPin,
  FiCheckCircle
} from 'react-icons/fi';
import { apiCall } from '@/lib/utils/http/SpaApiClient';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
interface ProvidersStats {
  total: number;
  active: number;
  withLocation: number;
}

export function PublicProvidersStatsWidget() {
  const [stats, setStats] = useState<ProvidersStats>({
    total: 0,
    active: 0,
    withLocation: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiCall<any>({
          method: 'GET',
          url: '/api/providers/stats'
        });

        if (true) { // apiCall ensures success
          setStats(response);
        }
      } catch (error) {
        ConsoleLogger.error('Error fetching Providers stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      icon: FiUsers,
      label: 'Təhsil Təşkilatları',
      value: stats.total,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: FiCheckCircle,
      label: 'Aktiv Təşkilatlar',
      value: stats.active,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: FiMapPin,
      label: 'Ünvan məlumatı ilə',
      value: stats.withLocation,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className={`${item.bgColor} p-3 rounded-lg`}>
              <item.icon className={item.color} size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

