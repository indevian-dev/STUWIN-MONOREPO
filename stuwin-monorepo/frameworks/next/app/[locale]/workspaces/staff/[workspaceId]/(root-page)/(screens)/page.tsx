import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile';
import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StaffRootPage() {

  return (
    <>
      <StaffPageTitleTile pageTitle="Shagguide Staff Dashboard" />
      <div className="w-full">
        <p>Welcome to the Dashboard</p>
      </div>
    </>
  );
}

export default withPageAuth(
  StaffRootPage,
  {
    path: '/workspaces/staff/:workspaceId'
  }
);
