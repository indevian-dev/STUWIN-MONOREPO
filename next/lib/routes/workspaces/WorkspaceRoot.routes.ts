// ═══════════════════════════════════════════════════════════════
// WORKSPACES ROOT ENDPOINTS CONFIGURATION
// ═══════════════════════════════════════════════════════════════
// API endpoints for workspace management (create, list, etc.)
// These endpoints are authenticated and shared across all workspaces

import type { RoutesMap } from '@/lib/routes/Route.types';
import { createRouteFactory } from '../Route.factory';

const createRoute = createRouteFactory({
  workspace: undefined,
  needEmailVerification: true,
  needPhoneVerification: true
});

/**
 * Workspace Root Endpoints
 * Authenticated endpoints for managing workspaces
 */
export const workspacesRootRoutes: RoutesMap = {
  // ============================================
  // Workspace Management APIs
  // ============================================

  // List all workspaces for authenticated user
  "/api/workspaces/list": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // Create a new workspace
  "/api/workspaces/create": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // Handle workspace onboarding (Parent, Provider, Student, Tutor)
  "/api/workspaces/onboarding": createRoute({
    method: "POST", // Supports both GET and POST, registering with POST as primary
    authRequired: true,
    type: "api",
  }),

  // Search for child student workspaces (FIN-based)
  "/api/workspaces/onboarding/search-child": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // Discover workspaces (Educational Organizations, etc.)
  "/api/workspaces/discover": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Dashboard & Shared APIs
  // ============================================

  // Get notifications for dashboard
  "/api/workspaces/dashboard/notifications": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // Update notification status
  "/api/workspaces/dashboard/notifications/update/:id": createRoute({
    method: "PATCH",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Workspace Root Pages
  // ============================================

  // Workspaces list page (root)
  "/workspaces": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  // ============================================
  // Onboarding Pages
  // ============================================
  "/workspaces/onboarding/welcome": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/onboarding/parent": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/onboarding/provider": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/onboarding/student": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  "/workspaces/enroll/:providerId": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/profile": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  // ============================================
  // Billing & Subscriptions (Global)
  // ============================================
  "/workspaces/billing": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/billing/verify": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/billing/checkout": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/billing/error": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  // New Billing Endpoints (Transactions, Subscriptions, Payments)
  "/api/workspaces/billing/subscriptions": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/transactions": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/tiers": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/coupon": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/initiate": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/verify/:transactionId": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Invitations
  // ============================================
  "/workspaces/invitations": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/api/workspaces/invitations": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/invitations/:id/respond": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
};
