import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DomainError } from '@/server/errors/domain.error';
import { getRequestContext } from '@/server/context/request-context';

export function apiSuccess<T>(data: T, status = 200, headers?: Record<string, string>) {
  const correlationId = getRequestContext()?.correlationId;
  return NextResponse.json(
    { ok: true, data },
    {
      status,
      headers: {
        ...(correlationId ? { 'X-Correlation-Id': correlationId } : {}),
        ...headers,
      },
    },
  );
}

export function handleApiError(error: unknown) {
  const correlationId = getRequestContext()?.correlationId;
  const baseHeaders = correlationId ? { 'X-Correlation-Id': correlationId } : undefined;

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: firstIssue?.message ?? 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
          issues: error.issues,
        },
        correlationId,
      },
      { status: 400, headers: baseHeaders },
    );
  }

  if (error instanceof DomainError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
        correlationId,
      },
      { status: error.statusCode, headers: baseHeaders },
    );
  }

  const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดภายในระบบ';
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
      correlationId,
    },
    { status: 500, headers: baseHeaders },
  );
}
