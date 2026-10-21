import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderSessionService, getRepositories } from '@/server/container';
import { apiSuccess, handleApiError } from '@/server/http/api-response';
import {
  buildBillSummaryFlexMessage,
  buildSessionCreatedFlexMessage,
} from '@/server/services/line-flex.service';

const LineWebhookEventSchema = z.object({
  type: z.string(),
  replyToken: z.string().optional(),
  source: z.object({
    type: z.enum(['user', 'group', 'room']),
    userId: z.string().optional(),
    groupId: z.string().optional(),
    roomId: z.string().optional(),
  }),
  message: z
    .object({
      type: z.string(),
      text: z.string().optional(),
    })
    .optional(),
});

const LineWebhookBodySchema = z.object({
  events: z.array(LineWebhookEventSchema).default([]),
});

function verifyLineSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || secret === 'your-line-channel-secret') {
    // Allow local simulation when secret is not configured
    return true;
  }
  if (!signatureHeader) {
    return false;
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, actualBuf);
}

async function replyToLineIfConfigured(replyToken: string | undefined, messages: unknown[]) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!replyToken || !accessToken || accessToken === 'your-line-channel-access-token') {
    return;
  }

  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!verifyLineSignature(rawBody, signature)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: 'INVALID_LINE_SIGNATURE', message: 'Invalid x-line-signature' },
        },
        { status: 401 },
      );
    }

    const body: unknown = rawBody ? JSON.parse(rawBody) : { events: [] };
    const parsed = LineWebhookBodySchema.parse(body);
    const service = getOrderSessionService();
    const { sessionRepo } = getRepositories();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const results = [];

    for (const event of parsed.events) {
      if (event.type !== 'message' || event.message?.type !== 'text') {
        continue;
      }

      const text = event.message.text?.trim() ?? '';
      const lineGroupId = event.source.groupId ?? event.source.roomId ?? 'C_DEFAULT_GROUP';
      const actorUserId = event.source.userId ?? 'U_DEFAULT_HOST';

      // Command 1: Open Session ("ตาลสั่ง", "69", "ทันสั่ง", or "เปิดบิล [ชื่อร้าน]")
      const openMatch = text.match(/^(ตาลสั่ง|69|ทันสั่ง|เปิดบิล)(?:\s+(.*))?$/i);
      if (openMatch) {
        const customStoreArg = openMatch[2]?.trim() || '';

        const session = await service.createSession({
          lineGroupId,
          hostUserId: actorUserId,
          storeId: customStoreArg ? null : 'STORE01',
          customStoreName: customStoreArg || null,
        });

        const flexMessage = buildSessionCreatedFlexMessage({
          sessionId: session.id,
          storeDisplayName: customStoreArg || 'ครัวตาล (ตามสั่งโชคชัย 4)',
          totalQuantity: 0,
          grandTotalAmount: 0,
          orderUrl: `${appUrl}/order/${session.id}`,
          receiptUrl: `${appUrl}/receipt/${session.id}`,
        });

        await replyToLineIfConfigured(event.replyToken, [flexMessage]);
        results.push({ command: 'OPEN_SESSION', sessionId: session.id, flexMessage });
        continue;
      }

      // Command 2: Close & Summarize Active Session ("ปิดบิล", "สรุปบิล", "ปิดตี้")
      if (text === 'ปิดบิล' || text === 'สรุปบิล' || text === 'ปิดตี้' || text === 'จบ') {
        const openSession = await sessionRepo.findOpenSessionByGroupId(lineGroupId);
        if (!openSession) {
          continue;
        }

        await service.closeSession({
          sessionId: openSession.id,
          actorUserId,
        });

        const summary = await service.getSessionSummary(openSession.id);
        const flexMessage = buildBillSummaryFlexMessage(
          {
            sessionId: openSession.id,
            storeDisplayName: summary.storeDisplayName,
            totalQuantity: summary.totalItemsCount,
            grandTotalAmount: summary.grandTotalAmount,
            orderUrl: `${appUrl}/order/${openSession.id}`,
            receiptUrl: `${appUrl}/receipt/${openSession.id}`,
          },
          summary.recipientBreakdowns,
        );

        await replyToLineIfConfigured(event.replyToken, [flexMessage]);
        results.push({ command: 'CLOSE_SESSION', sessionId: openSession.id, flexMessage });
      }
    }

    return apiSuccess({ processed: results.length, results });
  } catch (error) {
    return handleApiError(error);
  }
}
