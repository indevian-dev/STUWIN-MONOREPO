// lib/hooks/useChat.ts
import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { getAblyRealtimeClient } from '@/lib/integrations/ablyClient';
import type Ably from 'ably';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import type { ChatMessage, UseChatReturn } from './useChat.types';

export function useChat(
  conversationId: string | null,
  currentUserId: string | null
): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [ablyConfigured, setAblyConfigured] = useState(false);
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  ConsoleLogger.log('🔄 useChat called with:', { conversationId, currentUserId, currentUserIdType: typeof currentUserId });

  useEffect(() => {
    ConsoleLogger.log('🔍 useChat useEffect triggered:', { conversationId, currentUserId, shouldSkip: !conversationId || !currentUserId });

    if (!conversationId || !currentUserId) {
      ConsoleLogger.log('⏭️ Skipping Ably initialization due to missing data');
      return;
    }

    ConsoleLogger.log('🔐 Initializing Ably with token auth for user:', currentUserId);

    // Initialize Ably client with pure token authentication
    ablyRef.current = getAblyRealtimeClient(currentUserId);

    // If Ably client creation failed, skip real-time functionality
    if (!ablyRef.current) {
      ConsoleLogger.log('❌ Ably client creation failed - real-time features disabled');
      setAblyConfigured(false);
      return;
    }

    ConsoleLogger.log('✅ Ably client created successfully');
    setAblyConfigured(true);

    // Set initial connection state based on current connection state
    setIsConnected(ablyRef.current.connection.state === 'connected');

    ablyRef.current.connection.on('connected', () => {
      ConsoleLogger.log('✅ Ably connected successfully');
      setIsConnected(true);
    });

    ablyRef.current.connection.on('failed', (stateChange) => {
      ConsoleLogger.log('❌ Ably connection failed:', stateChange?.reason);
      setIsConnected(false);
    });

    ablyRef.current.connection.on('disconnected', (stateChange) => {
      ConsoleLogger.log('📡 Ably disconnected:', stateChange?.reason);
      setIsConnected(false);
    });

    ablyRef.current.connection.on('connecting', () => {
      ConsoleLogger.log('🔄 Ably connecting...');
    });

    ablyRef.current.connection.on('failed' as any, (error: any) => {
      ConsoleLogger.error('🔐 Ably auth error:', error);
    });

    // Subscribe to conversation channel
    channelRef.current = ablyRef.current.channels.get(`conversation-${conversationId}`);
    ConsoleLogger.log('🔊 Subscribing to channel:', `conversation-${conversationId}`);

    // Add channel state debugging
    channelRef.current.on('attached', () => {
      ConsoleLogger.log('✅ Successfully attached to channel:', `conversation-${conversationId}`);
    });

    channelRef.current.on('detached', () => {
      ConsoleLogger.log('❌ Detached from channel:', `conversation-${conversationId}`);
    });

    channelRef.current.on('failed', (stateChange: any) => {
      ConsoleLogger.log('❌ Channel failed:', `conversation-${conversationId}`, stateChange);
    });

    channelRef.current.subscribe('new-message', (message: Ably.Message) => {
      ConsoleLogger.log('📨 Received new-message event:', message);
      ConsoleLogger.log('📨 Message data:', message.data);
      const newMessage = message.data.message as ChatMessage;

      // Only add if it's not from current user (they already have it from sending)
      if (newMessage.senderId !== currentUserId) {
        ConsoleLogger.log('➕ Adding new message from other user:', newMessage);
        setMessages(prev => [...prev, {
          ...newMessage,
          isNew: true // Mark as new for animation
        }]);
      } else {
        ConsoleLogger.log('🚫 Ignoring message from current user:', newMessage.senderId, 'vs', currentUserId);
      }
    });

    ConsoleLogger.log('🎧 Subscription setup complete for channel:', `conversation-${conversationId}`);

    channelRef.current.subscribe('typing-start', (data: Ably.Message) => {
      if (data.data.userId !== currentUserId) {
        setIsTyping(true);
      }
    });

    channelRef.current.subscribe('typing-stop', (data: Ably.Message) => {
      if (data.data.userId !== currentUserId) {
        setIsTyping(false);
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (ablyRef.current) {
        ablyRef.current.close();
      }
    };
  }, [conversationId, currentUserId]);

  const sendMessage = useCallback(async (content: string, messageType: string = 'text'): Promise<ChatMessage> => {
    try {
      const response = await fetch(`/api/workspaces/dashboard/conversations/${conversationId}/messages/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, messageType }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Add message to local state immediately for better UX
      const newMessage: ChatMessage = result.data;
      setMessages(prev => [...prev, newMessage]);

      return newMessage;
    } catch (error) {
      ConsoleLogger.error('Error sending message:', error);
      throw error;
    }
  }, [conversationId]);

  const sendTypingIndicator = useCallback((isTyping: boolean): void => {
    ConsoleLogger.log('⌨️ Sending typing indicator:', isTyping, 'Channel ready:', !!channelRef.current, 'Connected:', isConnected);
    if (channelRef.current && isConnected && ablyRef.current) {
      channelRef.current.publish(isTyping ? 'typing-start' : 'typing-stop', {
        userId: currentUserId,
        timestamp: new Date().toISOString()
      }).then(() => {
        ConsoleLogger.log('✅ Typing indicator published successfully');
      }).catch((error) => {
        ConsoleLogger.error('❌ Failed to publish typing indicator:', error);
      });
    } else {
      ConsoleLogger.log('⏭️ Skipping typing indicator - channel not ready');
    }
  }, [currentUserId, isConnected]);

  const loadMessages = useCallback(async (limit: number = 50, offset: number = 0): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(
        `/api/workspaces/dashboard/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load messages');
      }

      if (offset === 0) {
        setMessages(result.data);
      } else {
        setMessages(prev => [...result.data, ...prev]);
      }

      return result.data;
    } catch (error) {
      ConsoleLogger.error('Error loading messages:', error);
      throw error;
    }
  }, [conversationId]);

  return {
    messages,
    isConnected,
    isTyping,
    ablyConfigured,
    sendMessage,
    sendTypingIndicator,
    loadMessages
  };
}


