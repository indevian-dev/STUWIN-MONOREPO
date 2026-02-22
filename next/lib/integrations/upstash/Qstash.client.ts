// ═══════════════════════════════════════════════════════════════
// QSTASH CLIENT - UPSTASH QUEUE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
// Initialize QStash client for task queue management
// and Receiver for signature verification
// ═══════════════════════════════════════════════════════════════

import { Client, Receiver } from '@upstash/qstash';

// Initialize QStash client
let _qstashClient: Client;
let _qstashReceiver: Receiver;

const getQstashToken = () => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error('QSTASH_TOKEN is not configured');
  }
  return token;
};

const getClient = () => {
  if (!_qstashClient) {
    _qstashClient = new Client({
      token: getQstashToken(),
    });
  }
  return _qstashClient;
};

const getReceiver = () => {
  if (!_qstashReceiver) {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (!currentSigningKey || !nextSigningKey) {
      throw new Error('QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY must be configured');
    }

    _qstashReceiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });
  }
  return _qstashReceiver;
};

export const qstashClient = new Proxy({} as Client, {
  get: (_target, prop) => {
    const instance = getClient();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const qstashReceiver = new Proxy({} as Receiver, {
  get: (_target, prop) => {
    const instance = getReceiver();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

// Export for convenience
export { Client as QStashClient, Receiver as QStashReceiver } from '@upstash/qstash';
