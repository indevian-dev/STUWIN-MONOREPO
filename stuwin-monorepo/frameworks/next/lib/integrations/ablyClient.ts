// lib/clients/ablyClient.ts
import Ably from 'ably';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
// REST client for server-side operations
const ablyRest = process.env.ABLY_API_KEY
  ? new Ably.Rest({ key: process.env.ABLY_API_KEY })
  : null;

// Realtime client for client-side real-time functionality
const getAblyRealtimeClient = (userId: string): Ably.Realtime | null => {
  ConsoleLogger.log('🔧 Initializing Ably client for user:', userId);

  // Validate userId
  if (!userId || typeof userId !== 'string') {
    ConsoleLogger.error('❌ Invalid userId for Ably client:', userId, typeof userId);
    return null;
  }

  ConsoleLogger.log('🔐 Using pure token authentication (no client-side API key needed)');

  // Pure token authentication - no API key needed on client side
  return new Ably.Realtime({
    authCallback: async (tokenParams, callback) => {
      try {
        ConsoleLogger.log('🔐 Requesting Ably token...');
        const response = await fetch('/api/auth/ably-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenParams),
        });

        if (!response.ok) {
          ConsoleLogger.error('❌ Token request failed:', response.status, await response.text());
          throw new Error(`Token request failed: ${response.status}`);
        }

        const tokenRequest = await response.json();
        ConsoleLogger.log('✅ Token received successfully');
        callback(null, tokenRequest);
      } catch (error) {
        ConsoleLogger.error('❌ Token request error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Token request failed';
        callback(errorMessage, null);
      }
    },
    clientId: userId,
  });
};

export { ablyRest as default, getAblyRealtimeClient };

