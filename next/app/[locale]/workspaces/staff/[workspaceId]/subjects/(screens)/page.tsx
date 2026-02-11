import { StaffSubjectsListWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/subjects/(widgets)/StaffSubjectsListWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function StaffSubjectsListPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-left my-4 px-4">
        Fənlər
      </h1>
      <StaffSubjectsListWidget />
    </div>
  );
}

export default withPageAuth(
  StaffSubjectsListPage,
  {
    path: '/workspaces/staff/:workspaceId/subjects',
  }
);
