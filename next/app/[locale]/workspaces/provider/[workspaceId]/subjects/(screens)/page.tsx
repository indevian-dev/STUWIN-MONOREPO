import { ProviderSubjectsListWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/subjects/(widgets)/ProviderSubjectsList.widget';
import { WorkspacePageTitleTile } from '@/app/[locale]/workspaces/(root)/(tiles)/WorkspacePageTitle.tile';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';
import { PiBrain } from 'react-icons/pi';

function ProviderSubjectsListPage() {
  return (
    <div className="p-4 md:p-6">
      <WorkspacePageTitleTile
        title="Subjects"
        subtitle="Manage your curriculum subjects"
        icon={<PiBrain />}
        action={null}
        className="mb-4"
      />
      <ProviderSubjectsListWidget />
    </div>
  );
}

export default withPageAuth(
  ProviderSubjectsListPage,
  {
    path: '/workspaces/provider/:workspaceId/subjects',
  }
);
