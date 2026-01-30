import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StaffAdsPage() {
  return (
    <div className="p-4">
      <p className="text-gray-600">Ads management coming soon.</p>
    </div>
  );
}

export default withPageAuth(
  StaffAdsPage,
  {
    path: '/workspaces/staff/:workspaceId/ads',
  }
);

