import type { EndpointsMap } from "@/types";
import { createRouteFactory } from "../RouteFactory";


// Create staff-specific endpoint factory
const createStaffEndpoint = createRouteFactory({
  workspace: undefined,
  needEmailVerification: false,
  needPhoneVerification: false
});


export const authEndpoints: EndpointsMap = {
  // ============================================
  // Auth APIs
  // ============================================
  "/api/auth": createStaffEndpoint({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/login": createStaffEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/register": createStaffEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/logout": createStaffEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/refresh": createStaffEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/me": createStaffEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  // Removed /api/auth/accounts and /api/auth/accounts/switch
  // switching is now URL-based and profile is centralized in /api/auth
  "/api/auth/oauth": createStaffEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/oauth/initiate": createStaffEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/oauth/callback": createStaffEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/update-contact": createStaffEndpoint({
    method: "PATCH",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/verify": createStaffEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/verify/request": createStaffEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/verify/check": createStaffEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/2fa/generate": createStaffEndpoint({
    method: "POST",
    authRequired: true,
    needEmailVerification: true,
    type: "api",
  }),
  "/api/auth/2fa/validate": createStaffEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/ably-token": createStaffEndpoint({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/reset/request": createStaffEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/reset/set": createStaffEndpoint({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/avatar": createStaffEndpoint({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Auth Pages
  // ============================================
  "/auth/login": createStaffEndpoint({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/register": createStaffEndpoint({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/reset": createStaffEndpoint({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/oauth/callback": createStaffEndpoint({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/verify": createStaffEndpoint({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
};
