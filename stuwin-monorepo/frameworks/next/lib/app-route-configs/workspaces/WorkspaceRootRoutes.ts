// ═══════════════════════════════════════════════════════════════
// WORKSPACES ROOT ENDPOINTS CONFIGURATION
// ═══════════════════════════════════════════════════════════════
// API endpoints for workspace management (create, list, etc.)
// These endpoints are authenticated and shared across all workspaces

import type { EndpointsMap } from '@/types';
import { createEndpoint, createRouteFactory } from '../RouteFactory';

const createRootEndpoint = createRouteFactory({
  workspace: undefined,
  needEmailVerification: true,
  needPhoneVerification: true
});

/**
 * Workspace Root Endpoints
 * Authenticated endpoints for managing workspaces
 */
export const workspacesRootEndpoints: EndpointsMap = {
  // ============================================
  // Workspace Management APIs
  // ============================================

  // List all workspaces for authenticated user
  "/api/workspaces/list": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // Create a new workspace
  "/api/workspaces/create": createRootEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // Handle workspace onboarding (Parent, Provider, Student, Tutor)
  "/api/workspaces/onboarding": createEndpoint({
    method: "POST", // Supports both GET and POST, registering with POST as primary
    authRequired: true,
    type: "api",
  }),

  // Search for child student workspaces (FIN-based)
  "/api/workspaces/onboarding/search-child": createEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // Discover workspaces (Educational Organizations, etc.)
  "/api/workspaces/discover": createEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Dashboard & Shared APIs
  // ============================================

  // Get notifications for dashboard
  "/api/workspaces/dashboard/notifications": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // Update notification status
  "/api/workspaces/dashboard/notifications/update/:id": createRootEndpoint({
    method: "PATCH",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Workspace Root Pages
  // ============================================

  // Workspaces list page (root)
  "/workspaces": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  // ============================================
  // Onboarding Pages
  // ============================================
  "/workspaces/onboarding/welcome": createEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/onboarding/parent": createEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/onboarding/provider": createEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/onboarding/student": createEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  "/workspaces/enroll/:providerId": createEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/profile": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  // ============================================
  // Billing & Subscriptions (Global)
  // ============================================
  "/workspaces/billing": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  "/api/workspaces/root/billing": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  "/api/workspaces/root/billing/tiers": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  "/api/workspaces/root/billing/pay": createRootEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  "/api/workspaces/root/billing/coupon": createRootEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // New Billing Endpoints (Transactions & Subscriptions)
  "/api/workspaces/billing/subscriptions": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/transactions": createRootEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/initiate": createRootEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
};
