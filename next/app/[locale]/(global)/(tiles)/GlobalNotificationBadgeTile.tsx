
"use client";

import {
  useState,
  useEffect
} from 'react';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import {
  PiBell,
  PiBellRinging
} from 'react-icons/pi';
import { Link } from '@/i18n/routing';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';

interface Notification {
  id: number;
  name: string;
  body: string;
  created_at: string;
  mark_as_read: boolean;
}

interface GlobalNotificationBadgeTileProps {
  className?: string;
}

export function GlobalNotificationBadgeTile({ className = "" }: GlobalNotificationBadgeTileProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady, isAuthenticated } = useGlobalAuthProfileContext();

  useEffect(() => {
    // Only fetch notifications when context is ready and user is authenticated
    if (isReady && isAuthenticated) {
      fetchNotificationSummary();

      // Poll for new notifications every 5 minutes
      const interval = setInterval(fetchNotificationSummary, 300000);
      return () => clearInterval(interval);
    }
  }, [isReady, isAuthenticated]);

  const fetchNotificationSummary = async () => {
    try {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: '/api/workspaces/dashboard/notifications?page=1&limit=5',
      });

      if (response.status === 200) {
        const payload = response.data?.data;
        setUnreadCount(payload?.unread_count ?? 0);
        setRecentNotifications((payload?.notifications ?? []).slice(0, 3));
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching notification summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="flex gap-2 items-center relative hover:cursor-pointer justify-end">
        <span className="hidden sm:block text-brand-secondary font-bold text-xs">
          Notifications
        </span>
        <div className="relative inline-flex">
          {unreadCount > 0 ? (
            <PiBellRinging className="text-brand-secondary text-2xl" style={{ display: 'block' }} />
          ) : (
            <PiBell className="text-brand-secondary text-2xl" style={{ display: 'block' }} />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-0 bg-white shadow-lg rounded-md p-4 hidden group-hover:block w-80 z-50">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-gray-800 font-bold whitespace-nowrap">
            Recent Notifications
          </h5>
          {unreadCount > 0 && (
            <span className="bg-brand text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : recentNotifications.length > 0 ? (
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {recentNotifications.map((notification) => (
              <li key={notification.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                <div className="flex items-start gap-2">
                  {!notification.mark_as_read && (
                    <span className="w-2 h-2 bg-brand rounded-full mt-2 shrink-0"></span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.mark_as_read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                      {notification.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No notifications yet</p>
        )}

        <Link
          href="/dashboard/notifications"
          className="block w-full bg-brand text-white px-4 py-2 rounded-md text-center text-sm font-medium hover:bg-red-600 transition-colors mt-4"
        >
          View All Notifications
        </Link>
      </div>
    </div>
  );
}
