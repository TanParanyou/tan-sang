import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getOrderSessionService } from '@/server/container';
import { apiSuccess, handleApiError } from '@/server/http/api-response';

const PatchSessionPayloadSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('TOGGLE_READY'),
    userId: z.string().trim().min(1).max(64),
    displayName: z.string().trim().min(1).max(100),
    isReady: z.boolean(),
  }),
  z.object({
    action: z.literal('CLOSE_SESSION'),
    actorUserId: z.string().trim().min(1).max(64),
  }),
]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const service = getOrderSessionService();
    const detail = await service.getSessionDetail(sessionId);
    return apiSuccess(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const body: unknown = await request.json();
    const payload = PatchSessionPayloadSchema.parse(body);
    const service = getOrderSessionService();

    if (payload.action === 'TOGGLE_READY') {
      await service.toggleParticipantReady({
        sessionId,
        userId: payload.userId,
        displayName: payload.displayName,
        isReady: payload.isReady,
      });
    } else {
      await service.closeSession({
        sessionId,
        actorUserId: payload.actorUserId,
      });
    }

    const updatedDetail = await service.getSessionDetail(sessionId);
    return apiSuccess(updatedDetail);
  } catch (error) {
    return handleApiError(error);
  }
}
