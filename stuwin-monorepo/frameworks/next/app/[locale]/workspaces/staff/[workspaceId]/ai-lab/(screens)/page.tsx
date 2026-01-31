// ═══════════════════════════════════════════════════════════════
// STAFF AI LAB PAGE
// ═══════════════════════════════════════════════════════════════
// Dashboard for managing System Prompts and AI configurations
// ═══════════════════════════════════════════════════════════════

import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile';
import { withPageAuth } from '@/lib/app-access-control/interceptors';
import { SystemPromptsManager } from '../(widgets)/SystemPromptsManager';

function StaffAiLabPage() {
    return (
        <div className="space-y-6">
            <StaffPageTitleTile pageTitle="AI Laboratory" />

            <div className="space-y-8">
                {/* System Prompts Manager */}
                <SystemPromptsManager />
            </div>
        </div>
    );
}

export default withPageAuth(
    StaffAiLabPage,
    {
        path: '/workspaces/staff/:workspaceId/ai-lab',
    }
);
