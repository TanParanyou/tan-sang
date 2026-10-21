import type { LineFlexReceiptSharePayload } from '@/features/line/line.schema';
import type { RecipientOrderBreakdown } from '@/features/order-session/order-session.schema';

export function buildSessionCreatedFlexMessage(payload: LineFlexReceiptSharePayload) {
  const title =
    payload.storeDisplayName === 'สั่งอาหารกลุ่ม'
      ? 'เปิดบิลสั่งอาหารกลุ่ม — กดเลือกเมนูได้เลย'
      : `เปิดบิลสั่งอาหารร้าน ${payload.storeDisplayName} — กดเลือกเมนูได้เลย`;

  return {
    type: 'flex' as const,
    altText: title,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#FAF8F5',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'ตาลสั่ง • เปิดบิลสั่งอาหารกลุ่ม',
            size: 'xs',
            weight: 'bold',
            color: '#D9480F',
          },
          {
            type: 'text',
            text: payload.storeDisplayName,
            size: 'xl',
            weight: 'bold',
            color: '#141413',
            margin: 'xs',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'แตะปุ่มด้านล่างเพื่อเลือกเมนู ขนาด ท็อปปิ้ง (หรือพิมพ์เมนูตามสั่งเอง) เมื่อสั่งครบแล้วให้พิมพ์ "ปิดบิล" ในแชท เพื่อสรุปยอดรวมและแยกยอดรายคนครับ',
            size: 'sm',
            color: '#57534E',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#D9480F',
            action: {
              type: 'uri',
              label: 'กดสั่งอาหารเลย',
              uri: payload.orderUrl,
            },
          },
        ],
      },
    },
  };
}

export function buildBillSummaryFlexMessage(
  payload: LineFlexReceiptSharePayload,
  recipientBreakdowns: RecipientOrderBreakdown[],
) {
  const recipientRows = recipientBreakdowns.slice(0, 12).map((r) => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'sm',
    contents: [
      {
        type: 'text',
        text: `${r.recipientName} (${r.totalQuantity})`,
        size: 'sm',
        color: '#141413',
        flex: 3,
        wrap: true,
      },
      {
        type: 'text',
        text: `${r.totalAmount.toLocaleString('th-TH')} ฿`,
        size: 'sm',
        weight: 'bold',
        color: '#141413',
        align: 'end',
        flex: 2,
      },
    ],
  }));

  return {
    type: 'flex' as const,
    altText: `สรุปยอดบิล ${payload.storeDisplayName} รวม ${payload.grandTotalAmount.toLocaleString('th-TH')} บาท`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#141413',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'สรุปบิลค่าอาหาร • ปิดรับออเดอร์แล้ว',
            size: 'xs',
            weight: 'bold',
            color: '#FDBA74',
          },
          {
            type: 'text',
            text: payload.storeDisplayName,
            size: 'lg',
            weight: 'bold',
            color: '#FFFFFF',
            margin: 'xs',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          ...recipientRows,
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: `รวมทั้งหมด (${payload.totalQuantity} รายการ)`,
                size: 'sm',
                weight: 'bold',
                color: '#57534E',
              },
              {
                type: 'text',
                text: `${payload.grandTotalAmount.toLocaleString('th-TH')} ฿`,
                size: 'md',
                weight: 'bold',
                color: '#D9480F',
                align: 'end',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#141413',
            action: {
              type: 'uri',
              label: 'ดูใบเสร็จฉบับเต็ม / สั่งพิมพ์',
              uri: payload.receiptUrl,
            },
          },
        ],
      },
    },
  };
}
