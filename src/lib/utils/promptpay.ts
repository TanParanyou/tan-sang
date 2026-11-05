import QRCode from 'qrcode';

/**
 * Calculates CRC-16/CCITT-FALSE (EMVCo standard: poly 0x1021, init 0xFFFF).
 */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats a tag-length-value (TLV) string according to EMVCo spec.
 */
function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export type PromptPayTargetType = 'PHONE' | 'NATIONAL_ID' | 'EWALLET' | 'UNKNOWN';

export interface PromptPayTargetInfo {
  type: PromptPayTargetType;
  sanitized: string;
  formatted: string;
}

/**
 * Analyzes and sanitizes PromptPay ID (Mobile Phone, Thai National ID, or e-Wallet).
 */
export function parsePromptPayTarget(target: string): PromptPayTargetInfo | null {
  if (!target) return null;

  // Extract only digits
  const digits = target.replace(/\D/g, '');

  // 1. Mobile Phone (starts with 0, 9-10 digits: 08x, 09x, 06x)
  if (/^0[689]\d{8}$/.test(digits) || /^0[1-9]\d{7,8}$/.test(digits)) {
    // 10-digit phone
    const normalized = digits.padStart(10, '0');
    // Format to 0066 + 9 digits (drop leading 0)
    const internationalPhone = `0066${normalized.slice(1)}`;
    const display = `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
    return {
      type: 'PHONE',
      sanitized: internationalPhone,
      formatted: display,
    };
  }

  // 2. Thai National ID or Tax ID (13 digits)
  if (/^\d{13}$/.test(digits)) {
    const display = `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
    return {
      type: 'NATIONAL_ID',
      sanitized: digits,
      formatted: display,
    };
  }

  // 3. e-Wallet (15 digits)
  if (/^\d{15}$/.test(digits)) {
    return {
      type: 'EWALLET',
      sanitized: digits,
      formatted: digits,
    };
  }

  return null;
}

/**
 * Builds the official EMVCo PromptPay QR payload string.
 */
export function generatePromptPayPayload(target: string, amount?: number | null): string | null {
  const parsed = parsePromptPayTarget(target);
  if (!parsed) return null;

  const hasAmount = typeof amount === 'number' && amount > 0;

  // Tag 00: Payload Format Indicator = 01
  let payload = formatTlv('00', '01');

  // Tag 01: Point of Initiation Method: 11 = Static (no amount), 12 = Dynamic (with amount)
  payload += formatTlv('01', hasAmount ? '12' : '11');

  // Tag 29: Merchant Account Info - PromptPay
  let merchantInfo = '';
  if (parsed.type === 'PHONE') {
    // Sub-tag 00: AID for Phone
    merchantInfo += formatTlv('00', 'A000000677010111');
    // Sub-tag 01: Mobile number (13 digits: 0066xxxxxxxxx)
    merchantInfo += formatTlv('01', parsed.sanitized);
  } else if (parsed.type === 'NATIONAL_ID') {
    // Sub-tag 00: AID for National ID / Tax ID
    merchantInfo += formatTlv('00', 'A000000677010112');
    // Sub-tag 02: National ID (13 digits)
    merchantInfo += formatTlv('02', parsed.sanitized);
  } else if (parsed.type === 'EWALLET') {
    // Sub-tag 00: AID for e-Wallet
    merchantInfo += formatTlv('00', 'A000000677010113');
    // Sub-tag 03: e-Wallet ID (15 digits)
    merchantInfo += formatTlv('03', parsed.sanitized);
  }

  payload += formatTlv('29', merchantInfo);

  // Tag 58: Country Code = TH
  payload += formatTlv('58', 'TH');

  // Tag 53: Transaction Currency = 764 (THB)
  payload += formatTlv('53', '764');

  // Tag 54: Transaction Amount (if specified)
  if (hasAmount) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTlv('54', formattedAmount);
  }

  // Tag 63: Checksum (CRC-16)
  const checksumPrefix = '6304';
  const dataForCrc = payload + checksumPrefix;
  const checksum = crc16(dataForCrc);

  return `${dataForCrc}${checksum}`;
}

/**
 * Generates Data URL (PNG base64) for PromptPay QR code.
 */
export async function generatePromptPayQrDataUrl(
  target: string,
  amount?: number | null,
  options?: { width?: number; margin?: number },
): Promise<string | null> {
  const payload = generatePromptPayPayload(target, amount);
  if (!payload) return null;

  try {
    return await QRCode.toDataURL(payload, {
      width: options?.width ?? 280,
      margin: options?.margin ?? 2,
      color: {
        dark: '#141413',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate PromptPay QR:', err);
    return null;
  }
}
