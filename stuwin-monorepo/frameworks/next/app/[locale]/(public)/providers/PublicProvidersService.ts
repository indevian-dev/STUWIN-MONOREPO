import { getS3Url } from '@/lib/utils/s3Utility';
/**
 * Public Providers Service
 * Utility functions for fetching and managing educational organizations data
 */

import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { ORGANIZATIONS } from '@/lib/app-infrastructure/database';
import type { Organization } from '@/types/resources/organizations/organizations';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

interface FetchProvidersServerOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
interface FetchProvidersOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

interface ProviderResponse {
  Providers: any[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProviderLocation {
  address?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

export interface Provider extends Organization {
  location?: ProviderLocation | null;
}

/**
 * Fetch Providers list with pagination and filters (Client-side)
 */
export async function fetchProvidersClient(options: FetchProvidersOptions = {}): Promise<ProviderResponse> {
  const {
    page = 1,
    pageSize = 24,
    sort = 'created_at',
    order = 'desc',
    search = ''
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sort,
    order
  });

  if (search) {
    params.append('search', search);
  }

  try {
    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/providers?${params.toString()}`
    });

    if (response.status === 200) {
      return response.data;
    } else {
      ConsoleLogger.error('Error fetching Providers:', response);
      return {
        Providers: [],
        total: 0,
        page,
        pageSize
      };
    }
  } catch (error) {
    ConsoleLogger.error('Error fetching Providers:', error);
    return {
      Providers: [],
      total: 0,
      page,
      pageSize
    };
  }
}

/**
 * Fetch single Provider by ID (Client-side)
 */
export async function fetchProviderByIdClient(id: string): Promise<Provider | null> {
  try {
    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/providers/${id}`
    });

    if (response.status === 200) {
      return response.data.Provider || null;
    } else {
      ConsoleLogger.error('Error fetching Provider:', response);
      return null;
    }
  } catch (error) {
    ConsoleLogger.error('Error fetching Provider:', error);
    return null;
  }
}

/**
 * Fetch Providers list (Server-side)
 * @deprecated Legacy SurrealDB implementation removed. Use Drizzle-based service.
 */
export async function fetchProvidersServer(options: FetchProvidersServerOptions = {}): Promise<ProviderResponse> {
  ConsoleLogger.warn('fetchProvidersServer (Legacy) called but implementation was removed.');
  const { page = 1, pageSize = 24 } = options;
  return {
    Providers: [],
    total: 0,
    page,
    pageSize
  };
}

/**
 * Fetch single Provider by ID (Server-side)
 * @deprecated Legacy SurrealDB implementation removed. Use Drizzle-based service.
 */
export async function fetchProviderByIdServer(id: string): Promise<Provider | null> {
  ConsoleLogger.warn('fetchProviderByIdServer (Legacy) called but implementation was removed.');
  return null;
}

interface SubmitProviderApplicationResponse {
  status: number;
  data?: any;
  error?: string;
}

/**
 * Submit Provider application
 */
export async function submitProviderApplication(applicationData: any): Promise<SubmitProviderApplicationResponse> {
  try {
    const response = await apiCallForSpaHelper({
      method: 'POST',
      url: '/api/providers/applications/create',
      body: applicationData
    });

    return response;
  } catch (error) {
    ConsoleLogger.error('Error submitting Provider application:', error);
    return {
      status: 500,
      data: {
        error: 'Failed to submit application'
      }
    };
  }
}

/**
 * Format Provider location for display
 */
export function formatProviderLocation(location?: ProviderLocation): string {
  if (!location) return '';

  const parts: string[] = [];

  if (location.address) parts.push(location.address);
  if (location.city) parts.push(location.city);
  if (location.region) parts.push(location.region);

  return parts.join(', ');
}

/**
 * Get Provider logo URL
 */
export function getProviderLogoUrl(Provider?: Provider): string {
  if (!Provider || !Provider.logo) {
    return '/placeholder-Provider.png';
  }

  return getS3Url(`providers/${Provider.id}/${Provider.logo}`);
}

/**
 * Check if Provider has location coordinates
 */
export function hasLocationCoordinates(Provider?: Provider): boolean {
  return !!(
    Provider?.location?.latitude &&
    Provider?.location?.longitude
  );
}

