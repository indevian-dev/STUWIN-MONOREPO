// ═══════════════════════════════════════════════════════════════
// CENTRALIZED API ENDPOINT CONFIGURATION INDEX
// Organized by workspace and resource groups for better maintainability
// ═══════════════════════════════════════════════════════════════

import type { EndpointsMap } from '@/types';

import { authEndpoints } from './auth/AuthRoutes';
import { publicEndpoints } from './public/PublicRoutes';
import { systemApis } from './system/SystemRoutes';
import { workspacesRootEndpoints } from './workspaces/WorkspaceRootRoutes';
// Provider Routes (Consolidated)
import { providerEndpoints } from './workspaces/provider/ProviderRoutes';

import { staffEndpoints } from './workspaces/staff/StaffRoutes';
import { studentEndpoints } from './workspaces/student/StudentRoutes';

export {
  authEndpoints,
  publicEndpoints,
  systemApis,
  workspacesRootEndpoints,
  providerEndpoints,
  staffEndpoints,
  studentEndpoints
};

// ═══════════════════════════════════════════════════════════════
// SHARED ENDPOINT FACTORIES
// Universal endpoint configuration creator for all workspaces
// ═══════════════════════════════════════════════════════════════
export {
  createRouteFactory,
  createEndpoint,
  type EndpointConfigOptions,
} from './RouteFactory';

// ═══════════════════════════════════════════════════════════════
// COMBINED ENDPOINT MAPS
// For applications that need all endpoints in a single map
// ═══════════════════════════════════════════════════════════════

/**
 * All API endpoints across all workspaces
 */
export const allEndpoints: EndpointsMap = {
  ...authEndpoints,
  ...workspacesRootEndpoints,
  ...providerEndpoints,
  ...studentEndpoints,
  ...staffEndpoints,
  ...publicEndpoints,
  ...systemApis,
};

export const getAllApis = () => allEndpoints;
