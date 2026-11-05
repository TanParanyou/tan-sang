import { describe, expect, it } from 'vitest';
import {
  createRequestContext,
  getRequestContext,
  withRequestContext,
} from '@/server/context/request-context';

describe('RequestContext (Lightweight Tracing & Session Context)', () => {
  it('creates request context with correlation ID and client info', () => {
    const headers = new Headers({
      'x-correlation-id': 'corr-12345',
      'x-line-userid': 'U_USER_001',
      'x-line-groupid': 'C_GROUP_ABC',
    });

    const ctx = createRequestContext(headers);
    expect(ctx.correlationId).toBe('corr-12345');
    expect(ctx.userId).toBe('U_USER_001');
    expect(ctx.lineGroupId).toBe('C_GROUP_ABC');
    expect(ctx.role).toBe('MEMBER');
  });

  it('runs within scoped context via withRequestContext', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: {
        'x-correlation-id': 'scoped-trace-999',
        'x-line-userid': 'U_HOST_999',
      },
    });

    await withRequestContext(request, async () => {
      const current = getRequestContext();
      expect(current).toBeDefined();
      expect(current?.correlationId).toBe('scoped-trace-999');
      expect(current?.userId).toBe('U_HOST_999');
    });

    // Outside the scope it should be undefined
    expect(getRequestContext()).toBeUndefined();
  });
});
