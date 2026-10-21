import { NextRequest } from 'next/server';
import { CreateOrderSessionInputSchema } from '@/features/order-session/order-session.schema';
import { getOrderSessionService } from '@/server/container';
import { apiSuccess, handleApiError } from '@/server/http/api-response';

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const service = getOrderSessionService();
    const history = await service.listSessionHistory(limit);
    return apiSuccess(history);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const input = CreateOrderSessionInputSchema.parse(body);
    const service = getOrderSessionService();
    const session = await service.createSession(input);
    return apiSuccess(session, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
