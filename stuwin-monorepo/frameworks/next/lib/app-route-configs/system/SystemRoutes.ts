import type { EndpointConfig, EndpointsMap } from '@/types';
import { createEndpoint } from '../RouteFactory';

/**
 * System APIs - Webhooks and Background Jobs
 * These endpoints are typically called by external services (QStash, Coconut, etc.)
 * and don't require user authentication
 */
export const systemApis: EndpointsMap = {
  // ============================================
  // Webhook APIs (External Services)
  // ============================================
  "/api/workspaces/webhooks/coconut": createEndpoint({
    method: "POST",
    authRequired: false,
    type: "api"
  }),
  "/api/workspaces/webhooks/questions-generator": createEndpoint({
    method: "POST",
    authRequired: false,
    type: "api"
  }),

  // ============================================
  // Background Job APIs (QStash Scheduler)
  // ============================================
  // Student Report Generation Jobs
  "/api/workspaces/jobs/mass-report-scanner": createEndpoint({
    method: "POST",
    authRequired: false,
    type: "api"
  }),
  "/api/workspaces/jobs/generate-report": createEndpoint({
    method: "POST",
    authRequired: false,
    type: "api"
  }),

  // Topic Question Generation Jobs
  "/api/workspaces/jobs/topic-question-scanner": createEndpoint({
    method: "POST",
    authRequired: false,
    type: "api"
  }),
  "/api/workspaces/jobs/generate-topic-questions": createEndpoint({
    method: "POST",
    authRequired: false,
    type: "api"
  }),
};
