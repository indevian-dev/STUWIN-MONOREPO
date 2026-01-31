import axios, { AxiosError, AxiosResponse } from 'axios';
import type { ApiError } from '@/types';
import type { AuthContextPayload } from '@/types/auth/authContext';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

// Get base URL from window origin
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

// Extract locale from pathname
const getLocaleFromPath = (): string => {
  if (typeof window !== 'undefined') {
    const validLocales = ['az', 'ru', 'en'];
    const pathSegments = window.location.pathname.split('/');
    const firstSegment = pathSegments[1];

    if (validLocales.includes(firstSegment)) {
      return firstSegment;
    }
  }
  return 'az';
};

// Helper to create ApiError objects
function createApiError(message: string, status?: number, code?: string): ApiError {
  const error = Object.assign(new Error(message), {
    name: 'ApiError',
    status,
    code
  }) as unknown as ApiError;
  return error;
}

// Auth redirect helper
const redirectToAuth = (): void => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const locale = getLocaleFromPath();
    window.location.href = `/${locale}/auth/login?redirect=${encodeURIComponent(currentPath)}`;
  }
};

// Request queue for sequential processing
interface QueueItem {
  requestFn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const requestQueue = {
  queue: [] as QueueItem[],
  isProcessing: false,

  enqueue(requestFn: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  },

  async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const item = this.queue.shift();
    if (!item) {
      this.isProcessing = false;
      return;
    }

    const { requestFn, resolve, reject } = item;

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processQueue();
    }
  }
};

interface FetchOptions {
  method: string;
  url: string;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * SPA API Call Helper
 */
export async function apiCallForSpaHelper({
  method,
  url,
  params,
  body,
  headers
}: FetchOptions): Promise<AxiosResponse> {
  if (!method || !url) {
    throw new Error('Method and URL are required');
  }

  return requestQueue.enqueue(() => executeRequest({ method, url, params, body, headers }));
}

/**
 * Execute the actual HTTP request
 */
async function executeRequest({
  method,
  url,
  params,
  body,
  headers
}: FetchOptions): Promise<AxiosResponse> {
  let fullUrl = `${getBaseUrl()}${url}`;

  if (method.toLowerCase() === 'get' && params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl = `${fullUrl}?${queryString}`;
    }
  }

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    },
    withCredentials: true
  };

  try {
    let response: AxiosResponse;

    switch (method.toLowerCase()) {
      case 'get':
        response = await axios.get(fullUrl, axiosConfig);
        break;
      case 'post':
        response = await axios.post(fullUrl, body, axiosConfig);
        break;
      case 'put':
        response = await axios.put(fullUrl, body, axiosConfig);
        break;
      case 'patch':
        response = await axios.patch(fullUrl, body, axiosConfig);
        break;
      case 'delete':
        response = await axios.delete(fullUrl, { ...axiosConfig, data: body });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    // Check for authContextPayload in response and update global auth context
    if (response.data?.authContextPayload && typeof window !== 'undefined' && window.__updateAuthContext) {
      ConsoleLogger.log('🔐 Auth context payload detected, updating global context...');
      try {
        window.__updateAuthContext(response.data.authContextPayload as AuthContextPayload);
        await new Promise(resolve => setTimeout(resolve, 0));
        ConsoleLogger.log('✅ Global auth context updated successfully');
      } catch (updateError) {
        ConsoleLogger.error('❌ Failed to update global auth context:', updateError);
      }
    }

    return response;

  } catch (error) {
    const axiosErr = error as AxiosError;
    let status: number | undefined = axiosErr.response?.status;
    const errorData = (axiosErr.response?.data as any) || {};
    const errorCode = errorData?.code || errorData?.type;

    if (status === 401) {
      const isAuthCheck = url.includes('/api/auth');

      ConsoleLogger.log(`🔐 401 Unauthorized [${errorCode}]: ${errorData?.error || errorData?.message}`);

      if (!isAuthCheck) {
        ConsoleLogger.log('🚪 Redirecting to login...');
        redirectToAuth();
      } else {
        ConsoleLogger.log('⚠️ Auth check failed (expected behavior for unauthenticated users), skipping redirect.');
      }

      throw createApiError(errorData?.error || errorData?.message || 'Authentication required', 401, errorCode || 'UNAUTHORIZED');
    }

    if (status === 403) {
      if (errorCode === 'SUBSCRIPTION_REQUIRED') {
        ConsoleLogger.log('💳 Subscription required');
        // Custom event for UI to handle (show upgrade modal)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('subscription-required', {
            detail: { originalRequest: { method, url, params, body, headers } }
          }));
        }
        throw createApiError('Subscription required', 403, 'SUBSCRIPTION_REQUIRED');
      }
      ConsoleLogger.log(`⛔ 403 Forbidden: ${errorData?.message}`);
      throw createApiError(errorData?.message || 'Access denied', 403, 'FORBIDDEN');
    }

    // Handle 428 (2FA Required)
    if (status === 428) {
      const twoFactorType = errorData?.type || 'email';
      ConsoleLogger.log(`🔐 2FA Required (${twoFactorType})`);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('2fa-required', {
          detail: {
            requiredMethod: twoFactorType,
            originalRequest: { method, url, params, body, headers }
          }
        }));
      }

      const twoFactorError = createApiError('Two-factor authentication required', 428, '2FA_REQUIRED') as ApiError & { method?: string; originalRequest?: FetchOptions };
      twoFactorError.method = twoFactorType;
      twoFactorError.originalRequest = { method, url, params, body, headers };
      throw twoFactorError;
    }

    // Handle 203/204 (Verifications)
    if (status === 203) {
      if (typeof window !== 'undefined') window.location.href = '/auth/verify/email';
      throw createApiError('Email verification required', 203, 'EMAIL_VERIFICATION_REQUIRED');
    }
    if (status === 204) {
      if (typeof window !== 'undefined') window.location.href = '/auth/verify/phone';
      throw createApiError('Phone verification required', 204, 'PHONE_VERIFICATION_REQUIRED');
    }

    const errMessage = (error as Error).message;
    ConsoleLogger.error(`❌ API Error [${status}]:`, errorData?.message || errMessage);
    throw error;
  }
}

/**
 * Retry a request after 2FA completion
 */
export async function retryAfter2FA(originalRequest: FetchOptions): Promise<AxiosResponse> {
  const { method, url, params, body, headers } = originalRequest;
  return apiCallForSpaHelper({ method, url, params, body, headers });
}


