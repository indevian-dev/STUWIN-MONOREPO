import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitle.tile';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

function StaffRootPage() {

  return (
    <>
      <StaffPageTitleTile pageTitle="stuwin.ai Staff Dashboard" />
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
