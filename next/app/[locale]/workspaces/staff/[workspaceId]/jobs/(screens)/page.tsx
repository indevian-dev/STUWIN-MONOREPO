// ═══════════════════════════════════════════════════════════════
// STAFF BACKGROUND JOBS PAGE
// ═══════════════════════════════════════════════════════════════
// Dashboard for managing and monitoring background jobs
// ═══════════════════════════════════════════════════════════════

import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitle.tile';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';
import { StaffJobControlWidget } from '../(widgets)/StaffJobControl.widget';
import { StaffJobStatsWidget } from '../(widgets)/StaffJobStats.widget';
import { StaffJobLogsWidget } from '../(widgets)/StaffJobLogs.widget';

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
