import axios, { AxiosResponse } from 'axios';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
// Function to dynamically build the base URL based on request
const getBaseUrl = async (request?: NextRequest): Promise<string> => {
  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const host = headersList.get('host');

  return `${protocol}://${host}`;
};

interface FetchOptions {
  url: string;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  request?: NextRequest;
}

export async function fetch({
  url,
  params,
  headers: customHeaders,
  request
}: FetchOptions): Promise<AxiosResponse> {
  let fullUrl = `${await getBaseUrl(request)}${url}`;
  ConsoleLogger.log("API CALL fullUrl **************", fullUrl);
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    fullUrl = `${fullUrl}?${searchParams.toString()}`;
  }

  const headersToUse = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  try {
    const response = await axios.get(fullUrl, {
      headers: headersToUse,
      withCredentials: true
    });

    ConsoleLogger.log("API CALL response data **************", response.data);
    
    // Return only serializable parts of the response
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    } as AxiosResponse;

  } catch (error: any) {
    ConsoleLogger.error('API Request failed:', error);
    
    // Handle axios errors properly
    if (error.response) {
      return {
        data: error.response.data,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers
      } as AxiosResponse;
    }
    
    throw error;
  }
}

