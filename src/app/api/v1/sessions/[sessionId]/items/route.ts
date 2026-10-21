import { NextRequest } from 'next/server';
import {
  AddOrderItemInputSchema,
  DeleteOrderItemInputSchema,
  UpdateOrderItemInputSchema,
} from '@/features/order-session/order-session.schema';
import { getOrderSessionService } from '@/server/container';
import { apiSuccess, handleApiError } from '@/server/http/api-response';

const CreateItemRequestSchema = AddOrderItemInputSchema.omit({ sessionId: true });
const UpdateItemRequestSchema = UpdateOrderItemInputSchema.omit({ sessionId: true });
const DeleteItemRequestSchema = DeleteOrderItemInputSchema.omit({ sessionId: true });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const body: unknown = await request.json();
    const parsedBody = CreateItemRequestSchema.parse(body);
    const service = getOrderSessionService();

    await service.addOrderItem({
      ...parsedBody,
      sessionId,
    });

    const updatedDetail = await service.getSessionDetail(sessionId);
    return apiSuccess(updatedDetail, 201);
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
    const parsedBody = UpdateItemRequestSchema.parse(body);
    const service = getOrderSessionService();

    await service.updateOrderItem({
      ...parsedBody,
      sessionId,
    });

    const updatedDetail = await service.getSessionDetail(sessionId);
    return apiSuccess(updatedDetail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const body: unknown = await request.json();
    const parsedBody = DeleteItemRequestSchema.parse(body);
    const service = getOrderSessionService();

    await service.deleteOrderItem({
      ...parsedBody,
      sessionId,
    });

    const updatedDetail = await service.getSessionDetail(sessionId);
    return apiSuccess(updatedDetail);
  } catch (error) {
    return handleApiError(error);
  }
}
