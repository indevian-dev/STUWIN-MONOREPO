import React from 'react';
import { withPageAuth } from '@/lib/middleware/handlers';

/**
 * Provider Dashboard Home Page
 */
function ProviderPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-dark mb-4">
        Provider Dashboard
      </h1>
      <p className="text-neutral-600">
        Welcome to your provider dashboard. Manage your content and analytics here.
      </p>
    </div>
  );
}

export default withPageAuth(ProviderPage, {
  path: '/workspaces/provider/:workspaceId',
});
