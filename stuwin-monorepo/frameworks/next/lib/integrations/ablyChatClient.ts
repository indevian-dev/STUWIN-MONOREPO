// lib/clients/ablyChatClient.ts
import Ably from 'ably';
import { ChatClient } from '@ably/chat';

// Server-side Ably REST client for API routes (regular Ably SDK)
const ablyRest = process.env.ABLY_API_KEY
  ? new Ably.Rest({ key: process.env.ABLY_API_KEY })
  : null;

// Client-side Chat client factory
const getAblyChatClient = (userId: string): ChatClient => {
  const realtimeClient = new Ably.Realtime({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY!,
    clientId: userId,
    authCallback: async (tokenParams: any, callback: any) => {
      try {
        const response = await fetch('/api/auth/ably-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenParams),
        });

        const tokenRequest = await response.json();
        callback(null, tokenRequest);
      } catch (error) {
        callback(error as Error, null);
      }
    },
  });

  return new ChatClient(realtimeClient as any);
};

export { ablyRest, getAblyChatClient };

