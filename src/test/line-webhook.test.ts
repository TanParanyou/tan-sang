import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/line/webhook/route';

describe('LINE Webhook Store Selection & Session Opening', () => {
  const createWebhookRequest = (text: string, groupId = 'C_TEST_GROUP_99') => {
    const body = {
      events: [
        {
          type: 'message',
          replyToken: 'test-reply-token',
          source: {
            type: 'group',
            groupId,
            userId: 'U_TEST_USER_01',
          },
          message: {
            type: 'text',
            text,
          },
        },
      ],
    };

    return new NextRequest('http://localhost:3000/api/line/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  it('prompts user to choose or specify a store when typing "เปิดบิล" or "69" without a store name', async () => {
    const req = createWebhookRequest('เปิดบิล', 'C_GROUP_NO_STORE_1');
    const res = await POST(req);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data.results[0]).toMatchObject({
      command: 'PROMPT_STORE_SELECTION',
    });
  });

  it('opens a session matching registered store when typing "เปิดบิล ครัวตาล"', async () => {
    const req = createWebhookRequest('เปิดบิล ครัวตาล', 'C_GROUP_KRUA_TARN_1');
    const res = await POST(req);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data.results[0]?.command).toBe('OPEN_SESSION');
    expect(json.data.results[0]?.flexMessage?.altText).toContain('ครัวตาล');
  });

  it('opens a custom store session when typing "เปิดบิล ข้าวมันไก่"', async () => {
    const req = createWebhookRequest('เปิดบิล ข้าวมันไก่', 'C_GROUP_CUSTOM_STORE_1');
    const res = await POST(req);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data.results[0]?.command).toBe('OPEN_SESSION');
    expect(json.data.results[0]?.flexMessage?.altText).toContain('ข้าวมันไก่');
  });

  it('resends existing open session if a session is already active in the group', async () => {
    const group = 'C_GROUP_DUPLICATE_CHECK';
    // 1st call opens session
    const req1 = createWebhookRequest('เปิดบิล ข้าวมันไก่', group);
    await POST(req1);

    // 2nd call attempts to open again
    const req2 = createWebhookRequest('เปิดบิล ข้าวมันไก่', group);
    const res2 = await POST(req2);
    const json2 = await res2.json();

    expect(json2.ok).toBe(true);
    expect(json2.data.results[0]?.command).toBe('RESEND_OPEN_SESSION');
  });

  it('handles 1-on-1 direct message opening and provides LINE group share button in flex message', async () => {
    const body = {
      events: [
        {
          type: 'message',
          replyToken: 'test-reply-dm-token',
          source: {
            type: 'user',
            userId: 'U_USER_SOLO_1',
          },
          message: {
            type: 'text',
            text: 'เปิดบิล ข้าวมันไก่',
          },
        },
      ],
    };

    const req = new NextRequest('http://localhost:3000/api/line/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data.results[0]?.command).toBe('OPEN_SESSION');
    const flexContents = json.data.results[0]?.flexMessage?.contents;
    // Verify Share Button exists in footer
    const buttons = flexContents.footer.contents;
    const shareBtn = buttons.find((b: { action?: { label?: string } }) =>
      b.action?.label?.includes('แชร์เข้ากลุ่ม LINE'),
    );
    expect(shareBtn).toBeDefined();
    expect(shareBtn.action.uri).toContain('https://line.me/R/share?text=');
  });

  it('answers KhunThong group bot guidance when user asks about KhunThong', async () => {
    const req = createWebhookRequest('ใช้กับขุนทองยังไง');
    const res = await POST(req);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data.results[0]?.command).toBe('KHUNTHONG_HELP');
  });
});
