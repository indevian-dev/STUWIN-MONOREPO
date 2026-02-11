import { ProviderSubjectsListWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/subjects/(widgets)/ProviderSubjectsListWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function ProviderSubjectsListPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-left my-4 px-4">
        Fənlər (Subjects)
      </h1>
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
