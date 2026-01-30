import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (request, { module, params, auth }) => {
  const resolvedParams = await params;
  const workspaceId = resolvedParams?.workspaceId;

  if (!workspaceId) {
    return NextResponse.json({ error: "Invalid Workspace ID" }, { status: 400 });
  }

  // Use the new WorkspaceService to fetch connected organizations
  // This replaces the old direct SQL query to ENROLLMENTS table

  // Correction: We want to LIST, not CONNECT
  const connected = await module.workspace.repository.listConnectedWorkspaces(workspaceId, "enrollment");

  // Transform the result to match expected frontend format if needed
  // or return the raw graph connection + workspace data
  const data = connected.map(c => ({
    ...c.workspace,
    enrollmentStatus: c.connection.isActive ? 'active' : 'inactive',
    enrolledAt: c.connection.createdAt,
    isPlatformEnrollment: true // Default for now
  }));

  return NextResponse.json(data, { status: 200 });
});
