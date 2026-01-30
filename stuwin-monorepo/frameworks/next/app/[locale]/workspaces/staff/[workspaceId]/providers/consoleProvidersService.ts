'use client';

import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { isValidSlimId } from '@/lib/utilities/slimUlidUtility';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
/**
 * Console Providers Service
 * Provides client-side functions for managing educational providers in the console interface
 */

interface GetProvidersOptions {
  workspaceId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  searchType?: 'title' | 'description' | 'all';
  sort?: string;
  order?: 'asc' | 'desc';
}

interface ProvidersResponse {
  providers: any[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
}

interface ProviderResponse {
  provider: any | null;
  error: string | null;
}

interface ApplicationsResponse {
  applications: any[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
}

interface ApproveApplicationResponse {
  application: any | null;
  provider: any | null;
  error: string | null;
}

interface RejectApplicationResponse {
  application: any | null;
  error: string | null;
}

interface GenericResponse {
  success: boolean;
  error: string | null;
}

/**
 * Fetch Providers with search, pagination and filters
 */
export async function getProviders(options: GetProvidersOptions): Promise<ProvidersResponse> {
  try {
    const {
      workspaceId,
      page = 1,
      pageSize = 10,
      search,
      searchType = 'title',
      sort = 'created_at',
      order = 'desc'
    } = options;

    if (!workspaceId) throw new Error("Workspace ID is required");

    const params: Record<string, any> = {
      page,
      pageSize,
      sort,
      order
    };

    // Add search parameters if provided
    if (search && search.trim()) {
      params.search = search.trim();
      params.searchType = searchType;
    }

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/staff/${workspaceId}/providers`,
      params,
      body: {}
    });

    if (response.status !== 200) {
      throw new Error(response.data?.error || 'Failed to fetch Providers');
    }

    return {
      providers: response.data.data || [],
      total: response.data.total || 0,
      page: response.data.page || page,
      pageSize: response.data.pageSize || pageSize,
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching Providers:', error);
    return {
      providers: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: error.message || 'Failed to fetch Providers'
    };
  }
}

/**
 * Fetch a specific Provider by ID
 */
export async function getProviderById(workspaceId: string, providerId: string): Promise<ProviderResponse> {
  try {
    if (!workspaceId) throw new Error('Workspace ID is required');
    if (!providerId || !isValidSlimId(providerId)) {
      throw new Error('Valid Provider ID is required');
    }

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/staff/${workspaceId}/providers/${providerId}`,
      params: {},
      body: {}
    });

    if (response.status === 404) {
      throw new Error('Provider not found');
    }

    if (response.status !== 200) {
      throw new Error(response.data?.error || 'Failed to fetch Provider');
    }

    return {
      provider: response.data,
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching Provider by ID:', error);
    return {
      provider: null,
      error: error.message || 'Failed to fetch Provider'
    };
  }
}

/**
 * Search Providers by title
 */
export async function searchProvidersByTitle(
  workspaceId: string,
  title: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ProvidersResponse> {
  try {
    if (!title || title.trim() === '') {
      throw new Error('Provider title is required for search');
    }

    return await getProviders({
      workspaceId,
      page,
      pageSize,
      search: title.trim(),
      searchType: 'title'
    });
  } catch (error: any) {
    ConsoleLogger.error('Error searching Providers by title:', error);
    return {
      providers: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: error.message || 'Failed to search Providers by title'
    };
  }
}

/**
 * Search Providers by description
 */
export async function searchProvidersByDescription(
  workspaceId: string,
  description: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ProvidersResponse> {
  try {
    if (!description || description.trim() === '') {
      throw new Error('Provider description is required for search');
    }

    return await getProviders({
      workspaceId,
      page,
      pageSize,
      search: description.trim(),
      searchType: 'description'
    });
  } catch (error: any) {
    ConsoleLogger.error('Error searching Providers by description:', error);
    return {
      providers: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: error.message || 'Failed to search Providers by description'
    };
  }
}

/**
 * Search Providers across all fields
 */
export async function searchProvidersGlobal(
  workspaceId: string,
  searchText: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ProvidersResponse> {
  try {
    if (!searchText || searchText.trim() === '') {
      throw new Error('Search text is required');
    }

    return await getProviders({
      workspaceId,
      page,
      pageSize,
      search: searchText.trim(),
      searchType: 'all'
    });
  } catch (error: any) {
    ConsoleLogger.error('Error searching Providers globally:', error);
    return {
      providers: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: error.message || 'Failed to search Providers'
    };
  }
}

interface GetProvidersSortedOptions {
  workspaceId: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Get Providers with sorting options
 */
export async function getProvidersSorted(options: GetProvidersSortedOptions): Promise<ProvidersResponse> {
  try {
    const {
      workspaceId,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 10
    } = options;

    if (!workspaceId) throw new Error("Workspace ID is required");

    const allowedSortColumns = ['id', 'created_at', 'title', 'is_active'];

    if (!allowedSortColumns.includes(sortBy)) {
      throw new Error(`Invalid sort column. Allowed columns: ${allowedSortColumns.join(', ')}`);
    }

    const allowedSortOrders = ['asc', 'desc'];
    if (!allowedSortOrders.includes(sortOrder.toLowerCase())) {
      throw new Error('Invalid sort order. Use "asc" or "desc"');
    }

    return await getProviders({
      workspaceId,
      page,
      pageSize,
      sort: sortBy,
      order: sortOrder.toLowerCase() as 'asc' | 'desc'
    });
  } catch (error: any) {
    ConsoleLogger.error('Error fetching sorted Providers:', error);
    return {
      providers: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: error.message || 'Failed to fetch sorted Providers'
    };
  }
}

/**
 * Create a new Provider (placeholder)
 */
export async function createProvider(workspaceId: string, providerData: any): Promise<ProviderResponse> {
  try {
    throw new Error('Create Provider functionality not yet implemented');
  } catch (error: any) {
    ConsoleLogger.error('Error creating Provider:', error);
    return {
      provider: null,
      error: error.message || 'Failed to create Provider'
    };
  }
}

/**
 * Update an existing Provider (placeholder)
 */
export async function updateProvider(workspaceId: string, providerId: number | string, providerData: any): Promise<ProviderResponse> {
  try {
    throw new Error('Update Provider functionality not yet implemented');
  } catch (error: any) {
    ConsoleLogger.error('Error updating Provider:', error);
    return {
      provider: null,
      error: error.message || 'Failed to update Provider'
    };
  }
}

/**
 * Delete an Provider (placeholder)
 */
export async function deleteProvider(workspaceId: string, providerId: number | string): Promise<GenericResponse> {
  try {
    throw new Error('Delete Provider functionality not yet implemented');
  } catch (error: any) {
    ConsoleLogger.error('Error deleting Provider:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete Provider'
    };
  }
}

/**
 * Approve an Provider (placeholder)
 */
export async function approveProvider(workspaceId: string, providerId: number | string): Promise<ProviderResponse> {
  try {
    throw new Error('Approve Provider functionality not yet implemented');
  } catch (error: any) {
    ConsoleLogger.error('Error approving Provider:', error);
    return {
      provider: null,
      error: error.message || 'Failed to approve Provider'
    };
  }
}

/**
 * Toggle active status of an Provider (placeholder)
 */
export async function toggleProviderActive(workspaceId: string, providerId: number | string, active: boolean = true): Promise<ProviderResponse> {
  try {
    throw new Error('Toggle Provider active status functionality not yet implemented');
  } catch (error: any) {
    ConsoleLogger.error('Error toggling Provider active status:', error);
    return {
      provider: null,
      error: error.message || 'Failed to toggle Provider active status'
    };
  }
}

interface GetProviderApplicationsOptions {
  workspaceId: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Fetch Provider applications with search and pagination
 */
export async function getProviderApplications(options: GetProviderApplicationsOptions): Promise<ApplicationsResponse> {
  try {
    const {
      workspaceId,
      page = 1,
      pageSize = 10,
      search = ''
    } = options;

    if (!workspaceId) throw new Error("Workspace ID is required");

    const params: Record<string, any> = {
      page,
      pageSize
    };

    // Add search parameter if provided
    if (search && search.trim()) {
      params.search = search.trim();
    }

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/staff/${workspaceId}/providers/applications`,
      params,
      body: {}
    });

    if (response.status !== 200) {
      throw new Error(response.data?.error || 'Failed to fetch Provider applications');
    }

    return {
      applications: response.data.applications || [],
      total: response.data.total || 0,
      page: response.data.page || page,
      pageSize: response.data.pageSize || pageSize,
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error fetching Provider applications:', error);
    return {
      applications: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: error.message || 'Failed to fetch Provider applications'
    };
  }
}

/**
 * Approve an Provider application
 */
export async function approveProviderApplication(workspaceId: string, applicationId: string): Promise<ApproveApplicationResponse> {
  try {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!applicationId || !isValidSlimId(applicationId)) {
      throw new Error('Valid application ID is required');
    }

    const response = await apiCallForSpaHelper({
      method: 'PUT',
      url: `/api/workspaces/staff/${workspaceId}/providers/applications/update/${applicationId}`,
      params: {},
      body: { approved: true }
    });

    if (response.status !== 200) {
      throw new Error(response.data?.error || 'Failed to approve Provider application');
    }

    return {
      application: response.data.data.application,
      provider: response.data.data.provider,
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error approving Provider application:', error);
    return {
      application: null,
      provider: null,
      error: error.message || 'Failed to approve Provider application'
    };
  }
}

/**
 * Reject an Provider application
 */
export async function rejectProviderApplication(
  workspaceId: string,
  applicationId: string,
  reason: string
): Promise<RejectApplicationResponse> {
  try {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!applicationId || !isValidSlimId(applicationId)) {
      throw new Error('Valid application ID is required');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    const response = await apiCallForSpaHelper({
      method: 'PUT',
      url: `/api/workspaces/staff/${workspaceId}/providers/applications/update/${applicationId}`,
      params: {},
      body: {
        approved: false,
        reason: reason.trim()
      }
    });

    if (response.status !== 200) {
      throw new Error(response.data?.error || 'Failed to reject Provider application');
    }

    return {
      application: response.data.data.application,
      error: null
    };
  } catch (error: any) {
    ConsoleLogger.error('Error rejecting Provider application:', error);
    return {
      application: null,
      error: error.message || 'Failed to reject Provider application'
    };
  }
}
