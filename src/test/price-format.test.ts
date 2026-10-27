import { describe, expect, it } from 'vitest';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';

describe('formatPrice utility', () => {
  it('formats normal positive prices with default currency unit', () => {
    expect(formatPrice(50)).toBe('50 ฿');
    expect(formatPrice(1250)).toBe('1,250 ฿');
    expect(formatPrice(65, { unit: 'บาท' })).toBe('65 บาท');
    expect(formatPrice(40, { unit: '' })).toBe('40');
  });

  it('formats 0 baht as "ฟรี" when session has pricing', () => {
    expect(formatPrice(0)).toBe('ฟรี');
    expect(formatPrice(0, { isGrandTotalZero: false })).toBe('ฟรี');
    expect(formatPrice(0, { zeroFallback: 'แถมฟรี' })).toBe('แถมฟรี');
  });

  it('formats 0 baht as "รอคิดเงิน" or fallback when entire session is unpriced', () => {
    expect(formatPrice(0, { isGrandTotalZero: true })).toBe('รอคิดเงิน');
    expect(
      formatPrice(0, { isGrandTotalZero: true, unpricedFallback: '-' }),
    ).toBe('-');
    expect(
      formatPrice(0, { isGrandTotalZero: true, unit: 'บาท' }),
    ).toBe('รอคิดเงิน');
  });
});

describe('formatGrandTotal utility', () => {
  it('formats grand total when positive', () => {
    expect(formatGrandTotal(180)).toBe('180 ฿');
    expect(formatGrandTotal(2500, 'บาท')).toBe('2,500 บาท');
  });

  it('returns null when grand total is 0 to allow caller-defined omissions', () => {
    expect(formatGrandTotal(0)).toBeNull();
  });
});
