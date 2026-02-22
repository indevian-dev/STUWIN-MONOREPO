import { Suspense } from 'react';
import NotificationsList from '../(widgets)/StudentNotificationsList.widget';
import { withPageAuth } from "@/lib/middleware/_Middleware.index";

function NotificationsLoadingSkeleton() {
  return (
    <div className="bg-white rounded-app shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-app-full animate-pulse"></div>
          <div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-app-full animate-pulse"></div>
              <div className="flex-1">
                <div className="w-48 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentNotificationsPage() {
  return (
    <div className="p-6">
      <Suspense fallback={<NotificationsLoadingSkeleton />}>
        <NotificationsList />
      </Suspense>
    </div>
  );
}

export default withPageAuth(StudentNotificationsPage, {
  path: "/workspaces/student/:workspaceId/notifications",
});
