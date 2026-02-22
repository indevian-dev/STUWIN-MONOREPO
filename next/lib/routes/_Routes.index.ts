// ═══════════════════════════════════════════════════════════════
// CENTRALIZED API ENDPOINT CONFIGURATION INDEX
// Organized by workspace and resource groups for better maintainability
// ═══════════════════════════════════════════════════════════════

import type { RoutesMap } from '@/lib/routes/Route.types';

import { authRoutes } from './auth/Auth.routes';
import { publicRoutes } from './public/Public.routes';
import { systemRoutes } from './system/System.routes';
import { workspacesRootRoutes } from './workspaces/WorkspaceRoot.routes';
import { providerRoutes } from './workspaces/provider/Provider.routes';
import { staffRoutes } from './workspaces/staff/Staff.routes';
import { studentRoutes } from './workspaces/student/Student.routes';

export {
  authRoutes,
  publicRoutes,
  systemRoutes,
  workspacesRootRoutes,
  providerRoutes,
  staffRoutes,
  studentRoutes
};

// ═══════════════════════════════════════════════════════════════
// SHARED ENDPOINT FACTORIES
// Universal endpoint configuration creator for all workspaces
// ═══════════════════════════════════════════════════════════════
export {
  createRouteFactory,
  createRoute,
} from './Route.factory';

// ═══════════════════════════════════════════════════════════════
// COMBINED ENDPOINT MAPS
// For applications that need all endpoints in a single map
// ═══════════════════════════════════════════════════════════════

/**
 * All API endpoints across all workspaces
 */
export const allEndpoints: RoutesMap = {
  ...authRoutes,
  ...workspacesRootRoutes,
  ...providerRoutes,
  ...studentRoutes,
  ...staffRoutes,
  ...publicRoutes,
  ...systemRoutes,
};

export const getAllApis = () => allEndpoints;
