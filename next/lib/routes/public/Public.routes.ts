import type { RoutesMap } from '@/lib/routes/Route.types';
import { createRoute } from '../Route.factory';

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

export const publicRoutes: RoutesMap = {
  // ============================================
  // Public APIs (Non-Auth)
  // ============================================
  "/api/auth/login": createRoute({ method: "POST", authRequired: false, type: "api" }),
  "/api/subjects": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/subjects/filters": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/subjects/:id": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/providers": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/providers/:id": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/providers/tags": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/providers/stats": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/programs": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions/featured": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions/search": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions/:id": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/questions/by-subject": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/pages": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/pages/:slug": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/pages/rules": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/cities": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/cities/:id": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/blogs": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/blogs/:id": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/cards/search": createRoute({ method: "GET", authRequired: false, type: "api" }),
  "/api/webhooks/payments/epoint": createRoute({ method: "POST", authRequired: false, type: "api" }),
  "/api/docs": createRoute({ method: "GET", authRequired: false, type: "api" }),

  // ============================================
  // Public Pages (Non-Auth)
  // ============================================
  "/audit": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/product-audit": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/homepage": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/contact": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/not-found": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/forbidden": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/search": createRoute({ method: "GET", authRequired: false, type: "page" }),
  // Subjects
  "/subjects": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/subjects/:id": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/subjects/:id/questions": createRoute({ method: "GET", authRequired: false, type: "page" }),

  // Providers
  "/providers": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/providers/:id": createRoute({ method: "GET", authRequired: false, type: "page" }),

  // Programs
  "/programs": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/programs/:id": createRoute({ method: "GET", authRequired: false, type: "page" }),

  // Questions
  "/questions": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/questions/:id": createRoute({ method: "GET", authRequired: false, type: "page" }),

  // Static pages
  "/docs/rules": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/docs/privacy": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/docs/terms": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/docs/about": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/docs/faq": createRoute({ method: "GET", authRequired: false, type: "page" }),

  // Other public
  "/cities": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/deactivation": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/pdf-tool": createRoute({ method: "GET", authRequired: false, type: "page" }),
  "/quizzes/start": createRoute({ method: "GET", authRequired: false, type: "page" }),
};
