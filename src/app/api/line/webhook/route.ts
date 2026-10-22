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
      const isDirectMessage = event.source.type === 'user';
      const actorUserId = event.source.userId ?? 'U_DEFAULT_HOST';
      const lineGroupId =
        event.source.groupId ??
        event.source.roomId ??
        (isDirectMessage ? `DM_${actorUserId}` : 'C_DEFAULT_GROUP');

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

          const promptText = isDirectMessage
            ? `คุณมีบิลที่เปิดรับออเดอร์อยู่แล้วครับ (${storeLabel})\nแตะปุ่ม "แชร์เข้ากลุ่ม LINE" ด้านล่าง เพื่อส่งต่อให้เพื่อนๆ สั่งอาหารได้เลย หรือพิมพ์ "ปิดบิล" เพื่อสรุปยอดครับ`
            : `กลุ่มนี้มีบิลเปิดรับออเดอร์อยู่แล้วครับ (${storeLabel})\nกดแตะสั่งอาหารต่อได้เลย หรือพิมพ์ "ปิดบิล" เพื่อสรุปยอดครับ`;

          await replyToLineIfConfigured(event.replyToken, [
            {
              type: 'text',
              text: promptText,
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
                label: storeThName.slice(0, 20),
                text: `เปิดบิล ${storeThName}`,
              },
            });
          }

          if (quickReplyItems.length < 5) {
            quickReplyItems.push({
              type: 'action',
              action: {
                type: 'message',
                label: 'ข้าวมันไก่',
                text: 'เปิดบิล ข้าวมันไก่',
              },
            });
          }
          if (quickReplyItems.length < 5) {
            quickReplyItems.push({
              type: 'action',
              action: {
                type: 'message',
                label: 'ก๋วยเตี๋ยว',
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
              text: `ต้องการเปิดบิลสั่งอาหารร้านไหนดีครับ?\n\nพิมพ์ "เปิดบิล [ชื่อร้าน]" เช่น:\n${storeListText}\n• "เปิดบิล ข้าวมันไก่"\n• "เปิดบิล ส้มตำ"\n\n(หรือแตะปุ่มเลือกร้านด้านล่างได้เลยครับ)`,
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

        const messages: unknown[] = [flexMessage];
        if (isDirectMessage) {
          messages.unshift({
            type: 'text',
            text: `เปิดบิลร้าน "${storeDisplayName}" สำเร็จแล้วครับ\n\nหากกลุ่มของคุณมี "บอทขุนทอง" อยู่แล้ว ไม่ต้องดึงบอทเข้ากลุ่มครับ แตะปุ่ม "แชร์เข้ากลุ่ม LINE" ที่การ์ดด้านล่าง เพื่อส่งต่อให้เพื่อนๆ เข้ามากดสั่งอาหารได้ทันที`,
          });
        }

        await replyToLineIfConfigured(event.replyToken, messages);
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
              text: 'ยังไม่มีบิลที่เปิดอยู่เลยครับ\nพิมพ์ "69" หรือ "ตาลสั่ง" เพื่อเปิดบิลใหม่ได้เลยครับ',
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

        const closeMessages: unknown[] = [flexMessage];
        if (isDirectMessage) {
          closeMessages.unshift({
            type: 'text',
            text: `ปิดบิลเรียบร้อยแล้วครับ\n\nแตะปุ่ม "แชร์สรุปบิลเข้ากลุ่ม LINE" ด้านล่าง เพื่อส่งยอดให้เพื่อนๆ หรือกดดูใบเสร็จเพื่อคัดลอกยอดแยกรายคนไปให้บอทขุนทองช่วยหารบิลต่อได้เลยครับ`,
          });
        }

        await replyToLineIfConfigured(event.replyToken, closeMessages);
        results.push({ command: 'CLOSE_SESSION', sessionId: openSession.id, flexMessage });
        continue;
      }

      // Command 3: Help & KhunThong Group Bot Guidance
      if (
        text.includes('ขุนทอง') ||
        text.includes('เข้ากลุ่มไม่ได้') ||
        text.includes('บอทเด้ง')
      ) {
        await replyToLineIfConfigured(event.replyToken, [
          {
            type: 'text',
            text: 'วิธีใช้ "ตาลสั่ง" ร่วมกับกลุ่มที่มีบอทขุนทอง:\n\nเนื่องจาก LINE จำกัดให้มี LINE Bot ในกลุ่มได้เพียง 1 ตัว คุณไม่ต้องลบขุนทอง และไม่ต้องดึงบอทตาลสั่งเข้ากลุ่มครับ\n\n1. พิมพ์ "69 [ชื่อร้าน]" ในแชทนี้เพื่อเปิดบิล\n2. แตะปุ่ม "แชร์เข้ากลุ่ม LINE" ที่การ์ด เพื่อส่งให้เพื่อนๆ ในกลุ่มกดสั่งอาหาร\n3. เพื่อนๆ แตะลิงก์เข้าเลือกเมนูและท็อปปิ้งได้ทุกคน\n4. เมื่อสั่งครบแล้ว พิมพ์ "ปิดบิล" ในแชทนี้ แล้วส่งยอดแยกรายคนให้บอทขุนทองช่วยหารต่อได้เลยครับ',
          },
        ]);
        results.push({ command: 'KHUNTHONG_HELP' });
        continue;
      }

      if (text === 'วิธีใช้' || text === 'คำสั่ง' || text === 'ช่วยด้วย' || text.toLowerCase() === 'help' || text === '?') {
        await replyToLineIfConfigured(event.replyToken, [
          {
            type: 'text',
            text: 'วิธีสั่งอาหารกลุ่มด้วย "ตาลสั่ง":\n\n1. พิมพ์ "69" หรือ "ตาลสั่ง [ชื่อร้าน]" เพื่อเปิดบิล\n2. สมาชิกแตะปุ่ม "กดสั่งอาหาร" เพื่อเลือกเมนู (หรือแตะ "แชร์เข้ากลุ่ม LINE" เพื่อส่งให้เพื่อน)\n3. เมื่อสั่งครบแล้ว พิมพ์ "ปิดบิล" เพื่อสรุปยอดและคิดเงินแยกรายคน\n4. นำยอดแยกรายคนส่งต่อให้บอทขุนทองช่วยทวงเงินได้ทันทีครับ',
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
