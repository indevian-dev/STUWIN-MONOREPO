"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { toast } from 'react-toastify';
import {
  PiBell,
  PiBellRinging,
  PiCheck,
  PiX,
  PiCaretLeft,
  PiCaretRight
} from 'react-icons/pi';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
// Type definitions
interface Notification {
  id: number;
  name: string;
  body: string;
  mark_as_read: boolean;
  created_at: string;
  [key: string]: any;
}

interface Pagination {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const t = useTranslations('Dashboard');
  const limit = 10;
  const { isReady } = useGlobalAuthProfileContext();

  useEffect(() => {
    // Only fetch when context is ready
    if (isReady) {
      fetchNotifications();
    }
  }, [page, isReady]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/dashboard/notifications?page=${page}&limit=${limit}`,
      });

      if (response.status === 200) {
        setNotifications(response.data.notifications);
        setPagination(response.data.pagination);
        setUnreadCount(response.data.unread_count);
      } else {
        toast.error('Error fetching notifications');
      }
    } catch (error) {
      ConsoleLogger.error('Error:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number, currentStatus: boolean) => {
    try {
      const response = await apiCallForSpaHelper({
        method: 'PATCH',
        url: `/api/workspaces/dashboard/notifications/update/${notificationId}`,
        body: { mark_as_read: !currentStatus }
      });

      if (response.status === 200) {
        // Update local state
        setNotifications(notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, mark_as_read: !currentStatus }
            : notification
        ));

        // Update unread count
        if (currentStatus) {
          setUnreadCount(unreadCount + 1);
        } else {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }

        toast.success(!currentStatus ? 'Marked as read' : 'Marked as unread');
      } else {
        toast.error('Failed to update notification');
      }
    } catch (error) {
      ConsoleLogger.error('Error:', error);
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.mark_as_read);

      for (const notification of unreadNotifications) {
        await apiCallForSpaHelper({
          method: 'PATCH',
          url: `/api/workspaces/dashboard/notifications/update/${notification.id}`,
          body: { mark_as_read: true }
        });
      }

      // Update local state
      setNotifications(notifications.map(notification =>
        ({ ...notification, mark_as_read: true })
      ));
      setUnreadCount(0);

      toast.success('All notifications marked as read');
    } catch (error) {
      ConsoleLogger.error('Error:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.mark_as_read;
    if (filter === 'read') return notification.mark_as_read;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) return <GlobalLoaderTile />;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PiBell className="text-2xl text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <PiCheck className="text-lg" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-4">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: notifications.length - unreadCount }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === key
                ? 'bg-brand text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <PiBell className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : filter === 'read'
                  ? "No read notifications yet."
                  : "You don't have any notifications yet."
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${!notification.mark_as_read ? 'bg-blue-50 border-l-4 border-l-brand' : ''
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-2 rounded-full ${!notification.mark_as_read ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {!notification.mark_as_read ? (
                      <PiBellRinging className="text-lg" />
                    ) : (
                      <PiBell className="text-lg" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${!notification.mark_as_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                        {notification.name}
                      </h3>
                      {!notification.mark_as_read && (
                        <span className="w-2 h-2 bg-brand rounded-full"></span>
                      )}
                    </div>

                    <p className={`text-sm mb-2 ${!notification.mark_as_read ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                      {notification.body}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => markAsRead(notification.id, notification.mark_as_read)}
                  className={`p-2 rounded-md transition-colors ${!notification.mark_as_read
                    ? 'text-brand hover:bg-brand hover:text-white'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  title={notification.mark_as_read ? 'Mark as unread' : 'Mark as read'}
                >
                  {!notification.mark_as_read ? (
                    <PiCheck className="text-lg" />
                  ) : (
                    <PiX className="text-lg" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {(pagination.totalPages ?? 0) > 1 && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total ?? 0)} of {pagination.total ?? 0} notifications
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev}
                className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PiCaretLeft className="text-lg" />
              </button>

              <span className="px-3 py-1 text-sm font-medium">
                Page {page} of {pagination.totalPages ?? 0}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
                className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PiCaretRight className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsList;
