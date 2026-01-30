import type { EndpointsMap } from '@/types';
import { createEndpoint } from '../RouteFactory';

/**
 * Build URL from endpoint pattern by replacing :param placeholders
 */
export const buildUrl = (pattern: string, params: Record<string, any> = {}): string => {
  let url = pattern;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, String(value));
  });
  return url;
};

export const publicEndpoints: EndpointsMap = {
  // ============================================
  // Public APIs (Non-Auth)
  // ============================================
  "/api/auth/login": createEndpoint({ method: "POST", authRequired: false, type: "api" }),
  "/api/subjects": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/subjects/filters": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/subjects/:id": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/providers": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/providers/:id": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/providers/tags": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/providers/stats": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions/featured": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions/search": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions/:id": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions/by-subject": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/pages": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/pages/:slug": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/pages/rules": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/cities": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/cities/:id": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/blogs": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/blogs/:id": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/cards/search": createEndpoint({ method: "GET", authRequired: false, type: "api" }),
  "/api/webhooks/payments/epoint": createEndpoint({ method: "POST", authRequired: false, type: "api" }),

  // ============================================
  // Public Pages (Non-Auth)
  // ============================================
  "/audit": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/product-audit": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/homepage": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/not-found": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/forbidden": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/search": createEndpoint({ method: "GET", authRequired: false, type: "page" }),

  // Subjects
  "/subjects": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/subjects/:id": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/subjects/:id/questions": createEndpoint({ method: "GET", authRequired: false, type: "page" }),

  // Providers
  "/providers": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/providers/:id": createEndpoint({ method: "GET", authRequired: false, type: "page" }),

  // Questions
  "/questions": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/questions/:id": createEndpoint({ method: "GET", authRequired: false, type: "page" }),

  // Static pages
  "/pages": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/pages/:slug": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/pages/rules": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/pages/privacy": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/pages/terms": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/pages/contact": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/pages/about": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/pages/faq": createEndpoint({ method: "GET", authRequired: false, type: "page" }),

  // Other public
  "/cities": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/deactivation": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/pdf-tool": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
  "/quizzes/start": createEndpoint({ method: "GET", authRequired: false, type: "page" }),
};
