// app/[locale]/dashboard/chats/(screens)/[id]/page.jsx
'use client';

import {
  useState,
  useEffect,
  useRef
} from 'react';
import {
  useParams,
  useRouter
} from 'next/navigation';
import {
  FiArrowLeft,
  FiUser,
  FiMessageSquare
} from 'react-icons/fi';
import { PiStorefront } from 'react-icons/pi';
import Link
  from 'next/link';
import { useChat } from '@/hooks/useChat';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { StudentMessageBubbleWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/conversations/(widgets)/StudentMessageBubbleWidget';
import { StudentConversationChatInputWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/conversations/(widgets)/StudentConversationChatInputWidget';
import { StudentTypingIndicatorWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/conversations/(widgets)/StudentTypingIndicatorWidget';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
interface Conversation {
  id: number;
  card_images?: string[];
  card_title?: string;
  store_logo?: string;
  store_title?: string;
  card_store_id?: number;
  other_participant_role?: string;
}

export default function StudentConversationPageClient() {
  const params = useParams();
  const conversationId = typeof params.id === 'string' ? params.id : null;
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { userId } = useGlobalAuthProfileContext();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the chat hook for real-time functionality
  const {
    messages,
    isConnected,
    isTyping,
    ablyConfigured,
    sendMessage,
    sendTypingIndicator,
    loadMessages
  } = useChat(conversationId, userId);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);


  const loadConversation = async () => {
    try {
      setLoading(true);
      // Load conversation details and messages
      const [convResponse, messagesResponse] = await Promise.all([
        fetch(`/api/workspaces/dashboard/conversations/${conversationId}`),
        loadMessages()
      ]);

      if (!convResponse.ok) {
        const convResult = await convResponse.json();
        throw new Error(convResult.error || 'Failed to load conversation');
      }

      const convResult = await convResponse.json();
      setConversation(convResult.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      ConsoleLogger.error('Error loading conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      ConsoleLogger.error('Error sending message:', error);
      // You might want to show a toast notification here
    }
  };

  const handleTyping = (isTyping: boolean) => {
    sendTypingIndicator(isTyping);
  };

  if (loading) return <GlobalLoaderTile />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-2">Conversation not found</div>
          <Link
            href="/dashboard/chats"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Conversations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 flex-1">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {conversation.card_images && conversation.card_images.length > 0 ? (
              <img
                src={conversation.card_images[0]}
                alt={conversation.card_title}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : conversation.store_logo ? (
              <img
                src={conversation.store_logo}
                alt={conversation.store_title}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                {conversation.card_store_id ? (
                  <PiStorefront className="w-5 h-5 text-gray-500" />
                ) : (
                  <FiUser className="w-5 h-5 text-gray-500" />
                )}
              </div>
            )}
          </div>

          {/* Conversation info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {conversation.card_title || conversation.store_title || 'Conversation'}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{conversation.card_store_id ? 'Store' : 'User'}</span>
              {!ablyConfigured && (
                <span className="text-yellow-500">• Offline Mode</span>
              )}
              {ablyConfigured && !isConnected && (
                <span className="text-red-500">• Disconnected</span>
              )}
              {isConnected && (
                <span className="text-green-500">• Connected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start a conversation by sending a message.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const currentAccountIdStr = userId;
            const isOwnMessage = message.senderId === currentAccountIdStr;

            return (
              <StudentMessageBubbleWidget
                key={message.id}
                message={{
                  ...message,
                  senderId: message.senderId || undefined
                }}
                isOwnMessage={isOwnMessage}
                senderName={!isOwnMessage ? conversation.other_participant_role : null}
              />
            );
          })
        )}
        <StudentTypingIndicatorWidget isTyping={isTyping} userName={conversation.other_participant_role} />
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <StudentConversationChatInputWidget
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={ablyConfigured && !isConnected}
      />
    </div>
  );
}


