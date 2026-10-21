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
    const { sessionRepo, storeRepo } = getRepositories();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    const getOrderUrl = (id: string) =>
      liffId ? `https://liff.line.me/${liffId}/order/${id}` : `${appUrl}/order/${id}`;
    const getReceiptUrl = (id: string) =>
      liffId ? `https://liff.line.me/${liffId}/receipt/${id}` : `${appUrl}/receipt/${id}`;

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

        // Check if there is already an active (OPEN) session in this group
        const existingSession = await sessionRepo.findOpenSessionByGroupId(lineGroupId);
        if (existingSession) {
          const summary = await service.getSessionSummary(existingSession.id);
          const flexMessage = buildSessionCreatedFlexMessage({
            sessionId: existingSession.id,
            storeDisplayName: summary.storeDisplayName,
            totalQuantity: summary.totalItemsCount,
            grandTotalAmount: summary.grandTotalAmount,
            orderUrl: getOrderUrl(existingSession.id),
            receiptUrl: getReceiptUrl(existingSession.id),
          });

          const storeLabel =
            summary.storeDisplayName === 'สั่งอาหารกลุ่ม'
              ? 'บิล: สั่งอาหารกลุ่ม'
              : `ร้าน: ${summary.storeDisplayName}`;

          await replyToLineIfConfigured(event.replyToken, [
            {
              type: 'text',
              text: `กลุ่มนี้มีบิลเปิดรับออเดอร์อยู่แล้วครับ! (${storeLabel})\nกดแตะสั่งอาหารต่อได้เลย หรือพิมพ์ "ปิดบิล" เพื่อสรุปยอดครับ 👇`,
            },
            flexMessage,
          ]);
          results.push({ command: 'RESEND_OPEN_SESSION', sessionId: existingSession.id });
          continue;
        }

        // If user typed "เปิดบิล" or "69" without specifying a store name:
        // Do NOT guess or fallback randomly! Ask them to choose or specify the store.
        if (!customStoreArg) {
          const activeStores = await storeRepo.findActiveStores().catch(() => []);
          const quickReplyItems: Array<{
            type: 'action';
            action: { type: 'message'; label: string; text: string };
          }> = [];

          for (const s of activeStores.slice(0, 4)) {
            const storeThName = s.name.th || s.id;
            quickReplyItems.push({
              type: 'action',
              action: {
                type: 'message',
                label: `🍳 ${storeThName}`.slice(0, 20),
                text: `เปิดบิล ${storeThName}`,
              },
            });
          }

          if (quickReplyItems.length < 5) {
            quickReplyItems.push({
              type: 'action',
              action: {
                type: 'message',
                label: '🍗 ข้าวมันไก่',
                text: 'เปิดบิล ข้าวมันไก่',
              },
            });
          }
          if (quickReplyItems.length < 5) {
            quickReplyItems.push({
              type: 'action',
              action: {
                type: 'message',
                label: '🍜 ก๋วยเตี๋ยว',
                text: 'เปิดบิล ก๋วยเตี๋ยว',
              },
            });
          }

          const storeListText =
            activeStores.length > 0
              ? activeStores.map((s) => `• "เปิดบิล ${s.name.th}" (มีเมนูในระบบ)`).join('\n')
              : '• "เปิดบิล ครัวตาล" (มีเมนูในระบบ)';

          await replyToLineIfConfigured(event.replyToken, [
            {
              type: 'text',
              text: `🍽️ ต้องการเปิดบิลสั่งอาหารร้านไหนดีครับ?\n\nพิมพ์ "เปิดบิล [ชื่อร้าน]" เช่น:\n${storeListText}\n• "เปิดบิล ข้าวมันไก่"\n• "เปิดบิล ส้มตำ"\n\n(หรือแตะปุ่มเลือกร้านด้านล่างได้เลยครับ 👇)`,
              quickReply: {
                items: quickReplyItems,
              },
            },
          ]);
          results.push({ command: 'PROMPT_STORE_SELECTION' });
          continue;
        }

        // If user specified a store name (e.g. "เปิดบิล ข้าวมันไก่" or "เปิดบิล ครัวตาล")
        // Check if it matches an existing registered store catalog
        const activeStores = await storeRepo.findActiveStores().catch(() => []);
        const matchedStore = activeStores.find((s) => {
          const th = s.name.th?.trim().toLowerCase();
          const en = s.name.en?.trim().toLowerCase();
          const arg = customStoreArg.toLowerCase();
          return (
            (th && (th.includes(arg) || arg.includes(th))) ||
            (en && (en.includes(arg) || arg.includes(en))) ||
            s.id.toLowerCase() === arg
          );
        });

        const storeId = matchedStore ? matchedStore.id : null;
        const storeDisplayName = matchedStore
          ? (matchedStore.name.th || matchedStore.id)
          : customStoreArg;

        const session = await service.createSession({
          lineGroupId,
          hostUserId: actorUserId,
          storeId,
          customStoreName: matchedStore ? null : storeDisplayName,
        });

        const flexMessage = buildSessionCreatedFlexMessage({
          sessionId: session.id,
          storeDisplayName,
          totalQuantity: 0,
          grandTotalAmount: 0,
          orderUrl: getOrderUrl(session.id),
          receiptUrl: getReceiptUrl(session.id),
        });

        await replyToLineIfConfigured(event.replyToken, [flexMessage]);
        results.push({ command: 'OPEN_SESSION', sessionId: session.id, flexMessage });
        continue;
      }

      // Command 2: Close & Summarize Active Session ("ปิดบิล", "สรุปบิล", "ปิดตี้", "จบ")
      if (text === 'ปิดบิล' || text === 'สรุปบิล' || text === 'ปิดตี้' || text === 'จบ') {
        const openSession = await sessionRepo.findOpenSessionByGroupId(lineGroupId);
        if (!openSession) {
          await replyToLineIfConfigured(event.replyToken, [
            {
              type: 'text',
              text: 'ยังไม่มีบิลที่เปิดอยู่เลยครับ 😅\nพิมพ์ "69" หรือ "ตาลสั่ง" เพื่อเปิดบิลใหม่ได้เลย!',
            },
          ]);
          results.push({ command: 'NO_OPEN_SESSION_TO_CLOSE' });
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
            orderUrl: getOrderUrl(openSession.id),
            receiptUrl: getReceiptUrl(openSession.id),
          },
          summary.recipientBreakdowns,
        );

        await replyToLineIfConfigured(event.replyToken, [flexMessage]);
        results.push({ command: 'CLOSE_SESSION', sessionId: openSession.id, flexMessage });
        continue;
      }

      // Command 3: Help Instructions ("วิธีใช้", "help", "คำสั่ง", "?")
      if (text === 'วิธีใช้' || text === 'คำสั่ง' || text === 'ช่วยด้วย' || text.toLowerCase() === 'help' || text === '?') {
        await replyToLineIfConfigured(event.replyToken, [
          {
            type: 'text',
            text: '🍜 วิธีสั่งอาหารกลุ่มด้วย "ตาลสั่ง":\n\n1️⃣ พิมพ์ "69" หรือ "ตาลสั่ง" เพื่อเปิดบิล\n(หรือ "69 ข้าวมันไก่" เพื่อระบุชื่อร้าน)\n2️⃣ สมาชิกแตะปุ่ม "กดสั่งอาหาร" เพื่อเลือกเมนู\n3️⃣ เมื่อสั่งครบแล้ว พิมพ์ "ปิดบิล" เพื่อให้บอทสรุปยอดและคิดเงินแยกรายคนให้อัตโนมัติครับ!',
          },
        ]);
        results.push({ command: 'HELP' });
        continue;
      }
    }

    return apiSuccess({ processed: results.length, results });
  } catch (error) {
    return handleApiError(error);
  }
}
