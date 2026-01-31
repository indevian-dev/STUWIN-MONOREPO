import axiomClient, { AXIOM_ACTION_LOG_DATASET } from '@/lib/integrations/axiomClient';
import type { AuthData } from '@/types';
import type { NextRequest } from 'next/server';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { isValidSlimId } from '@/lib/utils/slimUlidUtility';
// ═══════════════════════════════════════════════════════════════
// ACCOUNT ACTION LOGS SERVICE
// Automated Axiom-based action logging for audit trails
// ═══════════════════════════════════════════════════════════════

/**
 * Sensitive field names to sanitize from request body
 */
const SENSITIVE_FIELDS = [
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'privateKey',
  'creditCard',
  'cvv',
  'ssn',
];

/**
 * Sanitizes sensitive data from objects (request/response data)
 * Recursively removes password, token, and other sensitive fields
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  if (Array.isArray(body)) {
    return body.map(sanitizeRequestBody);
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(
      field => lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeRequestBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Derives action name from request URL and method
 * Examples:
 * - POST /api/workspaces/provider/questions -> "create_question"
 * - PATCH /api/workspaces/provider/questions/update/123 -> "update_question"
 * - DELETE /api/workspaces/provider/topics/delete/456 -> "delete_topic"
 * - POST /api/workspaces/provider/questions/publish/789 -> "publish_question"
 */
function deriveActionName(url: string, method: string): string {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);

  // Remove locale if present (first segment like 'en', 'az')
  if (pathParts[0]?.length === 2) {
    pathParts.shift();
  }

  // Extract resource and action
  // Path format: /api/workspaces/{domain}/{resource}/{action?}/{id?}
  const domain = pathParts[1]; // staff, student, provider, etc.
  const resource = pathParts[2]; // questions, topics, accounts, etc.
  const action = pathParts[3]; // create, update, delete, publish, etc.

  // If action is explicitly in URL (e.g., /questions/publish/123)
  if (action && !isIdSegment(action)) {
    return `${action}_${resource?.slice(0, -1) || 'resource'}`;
  }

  // Derive from HTTP method
  const methodActionMap: Record<string, string> = {
    'POST': 'create',
    'PATCH': 'update',
    'PUT': 'update',
    'DELETE': 'delete',
    'GET': 'read',
  };

  const actionVerb = methodActionMap[method] || method.toLowerCase();
  const resourceSingular = resource?.endsWith('s')
    ? resource.slice(0, -1)
    : resource || 'resource';

  return `${actionVerb}_${resourceSingular}`;
}

/**
 * Checks if a string is numeric
 */
function isIdSegment(str: string): boolean {
  return /^\d+$/.test(str) || isValidSlimId(str) || str.includes(':');
}

/**
 * Extracts user name from authData
 * Prefers full name (name + lastName), falls back to email username
 */
function getUserName(user: AuthData['user']): string {
  // For AuthData user, we only have id and email
  // Return email username as fallback
  return user.email.split('@')[0];
}

/**
 * Action log entry structure
 */
export interface ActionLogEntry {
  action: string;
  accountId: string;
  userId: string;
  userName: string;
  userEmail: string;
  accessScopeKey: string;
  accessScopeType: string;
  requestUrl: string;
  requestMethod: string;
  responseData: string;
  resourceType?: string;
  resourceId?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}

/**
 * Logs an account action to Axiom for audit trail and analytics
 * 
 * @param request - The NextRequest object
 * @param authData - Authenticated user data
 * @param options - Additional logging options
 */
export async function logAccountAction(
  request: NextRequest,
  authData: AuthData,
  options: {
    action?: string;
    resourceType?: string;
    resourceId?: string;
    statusCode?: number;
    responseData?: any;
    metadata?: Record<string, any>;
  } = {}
) {
  try {
    // Skip if logging is disabled
    if (process.env.ENABLE_ACTION_LOGS === 'false') {
      ConsoleLogger.log('[ACTION LOG - SKIPPED]:', {
        url: request.url,
        method: request.method,
        accountId: authData.account.id,
      });
      return;
    }

    // Sanitize and stringify response data if provided
    let responseData: string = '';
    if (options.responseData !== undefined) {
      const sanitized = sanitizeRequestBody(options.responseData);
      responseData = JSON.stringify(sanitized);
    }

    // Derive action name if not provided
    const action = options.action || deriveActionName(
      request.url,
      request.method
    );

    // Build log entry
    const logEntry: ActionLogEntry = {
      action,
      accountId: authData.account.id,
      userId: authData.user.id,
      userName: getUserName(authData.user),
      userEmail: authData.user.email,
      accessScopeKey: authData.workspace.id || '',
      accessScopeType: authData.workspace.type || '',
      requestUrl: request.url,
      requestMethod: request.method,
      responseData,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      statusCode: options.statusCode,
      ...options.metadata,
    };

    // Send to Axiom
    await axiomClient.ingest(AXIOM_ACTION_LOG_DATASET, [{
      _time: new Date().toISOString(),
      ...logEntry,
    }]);

    // Auto-flush to ensure logs are sent
    await axiomClient.flush();

    ConsoleLogger.log('[ACTION LOG]:', {
      action,
      accountId: authData.account.id,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
    });

  } catch (error) {
    // Don't fail the request if logging fails
    ConsoleLogger.error('[ACTION LOG - ERROR]:', error);
  }
}

/**
 * Batch log multiple actions at once (more efficient)
 * 
 * @param entries - Array of action log entries
 */
export async function logAccountActionBatch(
  entries: Array<{
    request: NextRequest;
    authData: AuthData;
    options?: {
      action?: string;
      resourceType?: string;
      resourceId?: number;
      statusCode?: number;
      responseData?: any;
      metadata?: Record<string, any>;
    };
  }>
) {
  try {
    if (process.env.ENABLE_ACTION_LOGS === 'false') {
      ConsoleLogger.log('[ACTION LOG BATCH - SKIPPED]:', entries.length, 'entries');
      return;
    }

    const logEntries = await Promise.all(
      entries.map(async ({ request, authData, options = {} }) => {
        let responseData: string = '';
        if (options.responseData !== undefined) {
          const sanitized = sanitizeRequestBody(options.responseData);
          responseData = JSON.stringify(sanitized);
        }

        const action = options.action || deriveActionName(
          request.url,
          request.method
        );

        return {
          _time: new Date().toISOString(),
          action,
          accountId: authData.account.id,
          userId: authData.user.id,
          userName: getUserName(authData.user),
          userEmail: authData.user.email,
          accessScopeKey: authData.workspace.id || '',
          accessScopeType: authData.workspace.type || '',
          requestUrl: request.url,
          requestMethod: request.method,
          responseData,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          statusCode: options.statusCode,
          ...options.metadata,
        };
      })
    );

    await axiomClient.ingest(AXIOM_ACTION_LOG_DATASET, logEntries);
    await axiomClient.flush();

    ConsoleLogger.log('[ACTION LOG BATCH]:', logEntries.length, 'entries logged');

  } catch (error) {
    ConsoleLogger.error('[ACTION LOG BATCH - ERROR]:', error);
  }
}

