import { describe, expect, it } from 'vitest';
import {
  buildBillSummaryFlexMessage,
  buildReceiptShareText,
} from '@/server/services/line-flex.service';
import { generateMetadata } from '@/app/(liff)/receipt/[sessionId]/page';
import { getOrderSessionService } from '@/server/container';

describe('Receipt Sharing & LINE Message Compliance', () => {
  const samplePayload = {
    sessionId: 'sess-abc-12345678',
    storeDisplayName: 'ก๋วยเตี๋ยวเรือป้าทอง',
    totalQuantity: 4,
    grandTotalAmount: 240,
    orderUrl: 'http://localhost:3000/order/sess-abc-12345678',
    receiptUrl: 'http://localhost:3000/receipt/sess-abc-12345678',
  };

  it('buildReceiptShareText creates human-readable share text with total price', () => {
    const text = buildReceiptShareText(samplePayload);
    expect(text).toContain('ก๋วยเตี๋ยวเรือป้าทอง');
    expect(text).toContain('4 จาน');
    expect(text).toContain('240 บาท');
    expect(text).toContain('http://localhost:3000/receipt/sess-abc-12345678');
  });

  it('buildReceiptShareText handles unpriced zero grand total', () => {
    const unpricedPayload = {
      ...samplePayload,
      grandTotalAmount: 0,
    };
    const text = buildReceiptShareText(unpricedPayload);
    expect(text).toContain('ก๋วยเตี๋ยวเรือป้าทอง');
    expect(text).toContain('4 จาน');
    expect(text).toContain('ดูสรุปรายการอาหารสำหรับเช็คของ');
    expect(text).toContain('http://localhost:3000/receipt/sess-abc-12345678');
  });

  it('buildBillSummaryFlexMessage respects LINE action label length <= 20 characters', () => {
    const flex = buildBillSummaryFlexMessage(samplePayload, [
      {
        recipientName: 'สมชาย',
        totalQuantity: 2,
        totalAmount: 120,
        items: [],
      },
      {
        recipientName: 'สมหญิง',
        totalQuantity: 2,
        totalAmount: 120,
        items: [],
      },
    ]);

    // Inspect buttons in footer
    const buttons = flex.contents.footer.contents;
    expect(buttons.length).toBeGreaterThan(0);

    for (const btn of buttons) {
      if ('action' in btn && btn.action && 'label' in btn.action && btn.action.label) {
        // LINE Messaging API strictly enforces label length <= 20
        expect(btn.action.label.length).toBeLessThanOrEqual(20);
      }
    }
  });

  it('generateMetadata produces rich metadata for receipt page', async () => {
    const service = getOrderSessionService();
    const session = await service.createSession({
      customStoreName: 'ข้าวมันไก่ตอน',
      hostUserId: 'U_TEST_HOST',
      lineGroupId: 'C_METADATA_TEST',
    });

    const meta = await generateMetadata({
      params: Promise.resolve({ sessionId: session.id }),
    });

    expect(meta.title).toContain('ข้าวมันไก่ตอน');
    expect(meta.description).toContain('ข้าวมันไก่ตอน');
    expect(meta.openGraph?.title).toContain('ข้าวมันไก่ตอน');
    expect(meta.openGraph?.url).toContain(`/receipt/${session.id}`);
  });
});
