/**
 * Centralized formatting utility for price and baht displays.
 * Serves as the single source of truth across Web UI, printable slips,
 * LINE Flex messages, and clipboard export texts.
 */

export interface FormatPriceOptions {
  /** Indicates if the entire session has no pricing (grand total is 0) */
  isGrandTotalZero?: boolean;
  /** Currency symbol or unit suffix (defaults to '฿') */
  unit?: '฿' | 'บาท' | '';
  /** Fallback string when amount is 0 and isGrandTotalZero is true */
  unpricedFallback?: string;
  /** Fallback string when amount is 0 and isGrandTotalZero is false (an item is free) */
  zeroFallback?: string;
}

/**
 * Formats an item price or recipient total, automatically handling 0 baht and unpriced scenarios.
 */
export function formatPrice(
  amount: number,
  options: FormatPriceOptions = {},
): string {
  const {
    isGrandTotalZero = false,
    unit = '฿',
    unpricedFallback = 'รอคิดเงิน',
    zeroFallback = 'ฟรี',
  } = options;

  if (amount > 0) {
    const formatted = amount.toLocaleString('th-TH');
    return unit ? `${formatted} ${unit}` : formatted;
  }

  return isGrandTotalZero ? unpricedFallback : zeroFallback;
}

/**
 * Formats a grand total amount. Returns null if amount is 0 so caller can omit or customize fallback.
 */
export function formatGrandTotal(
  amount: number,
  unit: '฿' | 'บาท' = '฿',
): string | null {
  if (amount > 0) {
    return `${amount.toLocaleString('th-TH')} ${unit}`;
  }
  return null;
}
