export interface Session {
  id: string;
  userId: string;
  accountId: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    location?: string;
    deviceId?: string;
  };
  isActive: boolean;
}

export interface SessionStore {
  [sessionId: string]: Session;
}
