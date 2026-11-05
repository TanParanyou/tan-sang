import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export type UserRole = 'ADMIN' | 'HOST' | 'MEMBER' | 'ANONYMOUS';

export interface RequestContext {
  correlationId: string;
  userId: string | null;
  lineGroupId: string | null;
  role: UserRole;
  clientIp: string | null;
  timestamp: string;
}

const contextStorage = new AsyncLocalStorage<RequestContext>();

export function createRequestContext(reqOrHeaders?: Request | Headers): RequestContext {
  const headers =
    reqOrHeaders instanceof Request
      ? reqOrHeaders.headers
      : reqOrHeaders instanceof Headers
        ? reqOrHeaders
        : null;

  const correlationId =
    headers?.get('x-correlation-id') ||
    headers?.get('x-request-id') ||
    randomUUID();

  const userId = headers?.get('x-line-userid') || headers?.get('x-user-id') || null;
  const lineGroupId = headers?.get('x-line-groupid') || null;

  // Determine user role based on headers
  const isAdmin = headers?.get('x-admin-role') === 'true' || headers?.get('authorization')?.startsWith('Bearer admin-');
  const role: UserRole = isAdmin ? 'ADMIN' : userId ? 'MEMBER' : 'ANONYMOUS';

  const clientIp =
    headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers?.get('x-real-ip') ||
    null;

  return {
    correlationId,
    userId,
    lineGroupId,
    role,
    clientIp,
    timestamp: new Date().toISOString(),
  };
}

export function runWithRequestContext<R>(context: RequestContext, fn: () => R): R {
  return contextStorage.run(context, fn);
}

export function withRequestContext<R>(req: Request, fn: () => R): R {
  const context = createRequestContext(req);
  return runWithRequestContext(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return contextStorage.getStore();
}
