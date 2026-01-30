import { PathNormalizerUtility } from '@/lib/utils/PathNormalizerUtility';
import type { NextRequest } from 'next/server';
import type { EndpointsMap, EndpointConfig, RouteValidation } from '@/types';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

export class RouteValidator {
  static validateEndpoint(request: NextRequest, endpoints: EndpointsMap): RouteValidation {
    const normalizedPath = PathNormalizerUtility.normalizeForRouting(request.nextUrl.pathname);
    ConsoleLogger.log(('normalizedPath:'), normalizedPath);

    // 1. Try exact match first
    let endpoint = endpoints[normalizedPath];
    let matchedPattern = normalizedPath;

    // 2. Try pattern matching if exact match fails
    if (!endpoint) {
      const patterns = Object.keys(endpoints);
      for (const pattern of patterns) {
        if (!pattern.includes(':')) continue;

        // Convert /path/:id/sub -> ^/path/([^/]+)/sub$
        const regexStr = pattern
          .replace(/:[a-zA-Z0-9_]+/g, '([^/]+)')
          .replace(/\//g, '\\/');

        const regex = new RegExp(`^${regexStr}$`);
        if (regex.test(normalizedPath)) {
          endpoint = endpoints[pattern];
          matchedPattern = pattern;
          break;
        }
      }
    }

    if (!endpoint) {
      return {
        isValid: false,
        endpoint: undefined,
        normalizedPath: undefined
      };
    }

    return {
      isValid: true,
      endpoint,
      normalizedPath: matchedPattern // Return the pattern so it's clear what was matched
    };
  }
}

