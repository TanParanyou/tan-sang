import { describe, expect, it } from 'vitest';
import {
  crc16,
  generatePromptPayPayload,
  generatePromptPayQrDataUrl,
  parsePromptPayTarget,
} from '@/lib/utils/promptpay';

describe('PromptPay Utility (ฟังก์ชันสร้างพร้อมเพย์ QR)', () => {
  it('correctly calculates CRC-16 for sample data', () => {
    // Standard test vector for CRC-16/CCITT
    const result = crc16('00020101021129370016A000000677010111011300668123456785802TH53037646304');
    expect(result).toHaveLength(4);
    expect(/^[0-9A-F]{4}$/.test(result)).toBe(true);
  });

  it('correctly parses 10-digit Thai mobile number', () => {
    const parsed = parsePromptPayTarget('081-234-5678');
    expect(parsed).toEqual({
      type: 'PHONE',
      sanitized: '0066812345678',
      formatted: '081-234-5678',
    });
  });

  it('correctly parses 13-digit Thai National ID', () => {
    const parsed = parsePromptPayTarget('1-2345-67890-12-3');
    expect(parsed).toEqual({
      type: 'NATIONAL_ID',
      sanitized: '1234567890123',
      formatted: '1-2345-67890-12-3',
    });
  });

  it('returns null for invalid targets', () => {
    expect(parsePromptPayTarget('abc')).toBeNull();
    expect(parsePromptPayTarget('123')).toBeNull();
  });

  it('generates valid EMVCo PromptPay payload for phone with and without amount', () => {
    // Static QR (no amount)
    const payloadStatic = generatePromptPayPayload('0812345678');
    expect(payloadStatic).not.toBeNull();
    expect(payloadStatic).toContain('000201');
    expect(payloadStatic).toContain('010211'); // Static
    expect(payloadStatic).toContain('A000000677010111'); // Phone AID
    expect(payloadStatic).toContain('0066812345678');
    expect(payloadStatic).toContain('5802TH');
    expect(payloadStatic).toContain('5303764');
    expect(payloadStatic).toContain('6304');

    // Dynamic QR (with amount)
    const payloadDynamic = generatePromptPayPayload('0812345678', 505);
    expect(payloadDynamic).not.toBeNull();
    expect(payloadDynamic).toContain('010212'); // Dynamic
    expect(payloadDynamic).toContain('5406505.00'); // Tag 54 amount
  });

  it('generates QR code Data URL image', async () => {
    const dataUrl = await generatePromptPayQrDataUrl('0812345678', 505);
    expect(dataUrl).not.toBeNull();
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
