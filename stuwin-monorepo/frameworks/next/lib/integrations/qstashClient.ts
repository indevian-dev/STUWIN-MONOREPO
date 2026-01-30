// ═══════════════════════════════════════════════════════════════
// QSTASH CLIENT - UPSTASH QUEUE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
// Initialize QStash client for task queue management
// and Receiver for signature verification
// ═══════════════════════════════════════════════════════════════

import { Client, Receiver } from '@upstash/qstash';

// Initialize QStash client
const qstashToken = process.env.QSTASH_TOKEN;

if (!qstashToken) {
  throw new Error('QSTASH_TOKEN is not configured');
}

export const qstashClient = new Client({
  token: qstashToken,
});

// Initialize Receiver for signature verification
const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

if (!currentSigningKey || !nextSigningKey) {
  throw new Error('QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY must be configured');
}

export const qstashReceiver = new Receiver({
  currentSigningKey,
  nextSigningKey,
});

// Export for convenience
export { Client as QStashClient, Receiver as QStashReceiver } from '@upstash/qstash';
