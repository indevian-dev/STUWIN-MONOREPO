import type { RoutesMap } from "@/lib/routes/Route.types";
import { createRouteFactory } from "../Route.factory";


// Create staff-specific endpoint factory
const createRoute = createRouteFactory({
  workspace: undefined,
  needEmailVerification: false,
  needPhoneVerification: false
});


export const authRoutes: RoutesMap = {
  // ============================================
  // Auth APIs
  // ============================================
  "/api/auth": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/login": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/register": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/logout": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/refresh": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/me": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  // Removed /api/auth/accounts and /api/auth/accounts/switch
  // switching is now URL-based and profile is centralized in /api/auth
  "/api/auth/oauth": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/oauth/initiate": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/oauth/callback": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/update-contact": createRoute({
    method: "PATCH",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/verify": createRoute({
    method: ["GET", "POST"],
    authRequired: true,
    type: "api",
  }),
  "/api/auth/verify/request": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/verify/check": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/2fa/generate": createRoute({
    method: "POST",
    authRequired: true,
    needEmailVerification: true,
    type: "api",
  }),
  "/api/auth/2fa/validate": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/ably-token": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/auth/reset/request": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/reset/set": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),
  "/api/auth/avatar": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Auth Pages
  // ============================================
  "/auth/login": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/register": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/reset": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/oauth/callback": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/verify": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
};
