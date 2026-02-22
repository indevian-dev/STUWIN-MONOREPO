import type { RoutesMap } from '@/lib/routes/Route.types';
import { createRoute } from '../Route.factory';

/**
 * System APIs - Webhooks and Background Jobs
 * These endpoints are typically called by external services (QStash, Coconut, etc.)
 * and don't require user authentication
 */
export const systemRoutes: RoutesMap = {
  // ============================================
  // Webhook APIs (External Services)
  // ============================================
  "/api/workspaces/webhooks/coconut": createRoute({
    method: "POST",
    authRequired: false,
    type: "api"
  }),
  "/api/workspaces/webhooks/questions-generator": createRoute({
    method: "POST",
    authRequired: false,
    type: "api"
  }),

  // ============================================
  // Background Job APIs (QStash Scheduler)
  // ============================================
  // Student Report Generation Jobs
  "/api/workspaces/jobs/mass-report-scanner": createRoute({
    method: "POST",
    authRequired: false,
    type: "api"
  }),
  "/api/workspaces/jobs/generate-report": createRoute({
    method: "POST",
    authRequired: false,
    type: "api"
  }),

  // Topic Question Generation Jobs
  "/api/workspaces/jobs/topic-question-scanner": createRoute({
    method: "POST",
    authRequired: false,
    type: "api"
  }),
  "/api/workspaces/jobs/generate-topic-questions": createRoute({
    method: "POST",
    authRequired: false,
    type: "api"
  }),
};
