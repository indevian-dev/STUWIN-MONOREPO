// ═══════════════════════════════════════════════════════════════
// STAFF BACKGROUND JOBS PAGE
// ═══════════════════════════════════════════════════════════════
// Dashboard for managing and monitoring background jobs
// ═══════════════════════════════════════════════════════════════

import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile';
import { withPageAuth } from '@/lib/app-access-control/interceptors';
import { StaffJobControlWidget } from '../(widgets)/StaffJobControlWidget';
import { StaffJobStatsWidget } from '../(widgets)/StaffJobStatsWidget';
import { StaffJobLogsWidget } from '../(widgets)/StaffJobLogsWidget';

function StaffBackgroundJobsPage() {
  return (
    <div className="space-y-6">
      <StaffPageTitleTile pageTitle="Background Jobs Management" />

      <div className="space-y-8">
        {/* Job Control Panel */}
        <StaffJobControlWidget />

        {/* Statistics Dashboard */}
        <StaffJobStatsWidget />

        {/* Job Logs */}
        <StaffJobLogsWidget />
      </div>
    </div>
  );
}

export default withPageAuth(
  StaffBackgroundJobsPage,
  {
    path: '/workspaces/staff/:workspaceId/jobs',
  }
);
