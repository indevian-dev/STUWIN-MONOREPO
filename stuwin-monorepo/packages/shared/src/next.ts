import { NextRequest, NextResponse } from "next/server";

export type ApiRouteHandler = (
    req: any,
    context: any
) => Promise<any> | any;

export interface ApiHandlerOptions {
    collectLogs?: boolean;
    collectActionLogs?: boolean;
    [key: string]: any;
}

export interface ApiHandlerContext {
    params: Record<string, string>;
    authData?: any; // Full AuthData including session info
    ctx?: any;      // AuthContext for Service Layer (simplified)
    log?: any;      // Logger instance
    requestId?: string;
}
