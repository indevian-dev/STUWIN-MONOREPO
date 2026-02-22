import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (request, { module, params, auth }) => {
  const resolvedParams = await params;
  const workspaceId = resolvedParams?.workspaceId;

  if (!workspaceId) {
    return errorResponse("Invalid Workspace ID", 400);
  }

  // Use the new WorkspaceService to fetch connected organizations
  // This replaces the old direct SQL query to ENROLLMENTS table

  // Correction: We want to LIST, not CONNECT
  const connected = await module.workspace.repository.listConnections(workspaceId);

  // Transform the result to match expected frontend format if needed
  // or return the raw graph connection + workspace data
  const data = connected.map(c => ({
    ...c.workspace,
    enrollmentStatus: c.workspace.isActive ? 'active' : 'inactive',
    enrolledAt: c.connection.createdAt,
    isPlatformEnrollment: true // Default for now
  }));

  return okResponse(data);
});
