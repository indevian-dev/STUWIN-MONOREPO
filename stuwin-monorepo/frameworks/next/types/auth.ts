
export interface Session {
    id: string;
    sessionsGroupId: string;
    accountId: string;
    expireAt: Date;
    ip?: string;
    device?: string;
    browser?: string;
    os?: string;
    metadata?: any;
}
