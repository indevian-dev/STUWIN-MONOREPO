import React from 'react';
import { WorkspacePageTitleTile } from '@/app/[locale]/workspaces/(root)/(tiles)/WorkspacePageTitle.tile';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';
import { PiUsersBold } from 'react-icons/pi';

/**
 * Provider Dashboard Home Page
 */
function ProviderPage() {
  return (
    <div className="p-4 md:p-6">
      <WorkspacePageTitleTile
        title="Provider Dashboard"
        subtitle="Manage your content and analytics here"
        icon={<PiUsersBold />}
        action={null}
        className="mb-6"
      />
    </div>
  );
}

export default withPageAuth(ProviderPage, {
  path: '/workspaces/provider/:workspaceId',
});
