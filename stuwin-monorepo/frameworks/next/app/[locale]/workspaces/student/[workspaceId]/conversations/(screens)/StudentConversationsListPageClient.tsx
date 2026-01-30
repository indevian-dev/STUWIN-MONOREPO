// app/[locale]/dashboard/chats/(screens)/page.jsx
'use client';

import {
  useState,
  useEffect
} from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  FiMessageSquare,
  FiUser
} from 'react-icons/fi';
import { PiStorefront } from 'react-icons/pi';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import Link
  from 'next/link';

interface Conversation {
  id: number;
  card_images?: string[];
  card_title?: string;
  store_logo?: string;
  store_title?: string;
  card_store_id?: number;
  updated_at: string;
  unreadMessagesCount: number;
  has_new: boolean;
}

export default function StudentConversationsListPageClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workspaces/dashboard/conversations');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load conversations');
      }
      ConsoleLogger.log('conversations', result.data);
      setConversations(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      ConsoleLogger.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const truncateMessage = (message: string, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading conversations</div>
          <button
            onClick={loadConversations}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-gray-600 mt-1">Manage your conversations and messages</p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start a conversation by responding to a message or inquiry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/dashboard/conversations/${conversation.id}`}
              className="block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Avatar/Icon */}
                    <div className="flex-shrink-0">
                      {conversation.card_images && conversation.card_images.length > 0 ? (
                        <img
                          src={conversation.card_images[0]}
                          alt={conversation.card_title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : conversation.store_logo ? (
                        <img
                          src={conversation.store_logo}
                          alt={conversation.store_title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          {conversation.card_store_id ? (
                            <PiStorefront className="w-6 h-6 text-gray-500" />
                          ) : (
                            <FiUser className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Conversation details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {conversation.card_title || conversation.store_title || 'Unknown Conversation'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatLastMessageTime(conversation.updated_at)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600 truncate">
                        Conversation #{conversation.id}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {conversation.unreadMessagesCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {conversation.unreadMessagesCount} unread
                            </span>
                          )}
                          {conversation.has_new && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              New messages
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-500">
                          {conversation.card_store_id ? 'Store conversation' : 'User conversation'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


