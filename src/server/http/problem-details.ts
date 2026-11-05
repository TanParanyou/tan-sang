import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DomainError } from '@/server/errors/domain.error';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export function createProblemDetails(params: {
  status: number;
  title: string;
  detail: string;
  code?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
}): ProblemDetails {
  const code = params.code || 'UNKNOWN_ERROR';
  return {
    type: `https://tan-sang.app/errors/${code.toLowerCase().replace(/_/g, '-')}`,
    title: params.title,
    status: params.status,
    detail: params.detail,
    code,
    instance: params.instance,
    errors: params.errors,
    correlationId: params.correlationId,
    timestamp: new Date().toISOString(),
  };
}

export function toProblemDetails(
  error: unknown,
  options?: { instance?: string; correlationId?: string },
): ProblemDetails {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || 'root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    return createProblemDetails({
      status: 400,
      title: 'Validation Error',
      detail: error.issues[0]?.message ?? 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
      code: 'VALIDATION_ERROR',
      instance: options?.instance,
      errors: fieldErrors,
      correlationId: options?.correlationId,
    });
  }

  if (error instanceof DomainError) {
    return createProblemDetails({
      status: error.statusCode,
      title: error.code.replace(/_/g, ' '),
      detail: error.message,
      code: error.code,
      instance: options?.instance,
      correlationId: options?.correlationId,
    });
  }

  const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดภายในระบบ';
  return createProblemDetails({
    status: 500,
    title: 'Internal Server Error',
    detail: message,
    code: 'INTERNAL_SERVER_ERROR',
    instance: options?.instance,
    correlationId: options?.correlationId,
  });
}

export function problemDetailsResponse(problem: ProblemDetails): NextResponse {
  return new NextResponse(JSON.stringify(problem), {
    status: problem.status,
    headers: {
      'Content-Type': 'application/problem+json',
      ...(problem.correlationId ? { 'X-Correlation-Id': problem.correlationId } : {}),
    },
  });
}
