import type {
  SharedDishItem,
  SharedItemResult,
  SplitBillInput,
  SplitBillResult,
  SplitItem,
  SplitMemberResult,
} from './split-calculator.schema';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';

/**
 * Converts a baht amount to integer satang to avoid IEEE-754 floating point drift.
 */
function toSatang(amount: number): number {
  return Math.round(amount * 100);
}

function fromSatang(satang: number): number {
  return satang / 100;
}

/**
 * Calculates bill split allocation based on delivery fees, discounts, and optional shared dishes.
 */
export function calculateSplitBill(input: SplitBillInput): SplitBillResult {
  const items = input.items || [];
  const sharedItemsInput = input.sharedItems || [];
  const deliveryFee = Math.max(0, input.deliveryFee || 0);
  const discount = Math.max(0, input.discount || 0);
  const roundToInteger = input.roundToInteger ?? true;
  const splitMethod = input.splitMethod || 'PROPORTIONAL';

  const deliveryFeeSatang = toSatang(deliveryFee);
  const discountSatang = toSatang(discount);
  const netDiscountSatang = discountSatang - deliveryFeeSatang;

  const personalSubtotalSatang = items.reduce(
    (sum, item) => sum + toSatang(Math.max(0, item.price || 0)),
    0,
  );

  // Map to track member shared satang portion
  const memberSharedSatangMap = new Map<string, number>();
  items.forEach((it) => memberSharedSatangMap.set(it.id, 0));

  let sharedSubtotalSatang = 0;
  const processedSharedItems: SharedItemResult[] = [];

  for (const s of sharedItemsInput) {
    const sPriceSatang = toSatang(Math.max(0, s.price || 0));
    if (sPriceSatang <= 0) continue;

    // Determine participants
    let participantIds: string[] = [];
    if (s.memberIds && s.memberIds.length > 0) {
      participantIds = s.memberIds.filter((mid) => items.some((it) => it.id === mid));
    }
    // If not specified or none matched, fallback to all members
    if (participantIds.length === 0) {
      participantIds = items.map((it) => it.id);
    }

    if (participantIds.length === 0) continue;

    sharedSubtotalSatang += sPriceSatang;

    const basePerMemberSatang = Math.floor(sPriceSatang / participantIds.length);
    const remainderSatang = sPriceSatang % participantIds.length;

    participantIds.forEach((pid, pIdx) => {
      const extra = pIdx < remainderSatang ? 1 : 0;
      const current = memberSharedSatangMap.get(pid) || 0;
      memberSharedSatangMap.set(pid, current + basePerMemberSatang + extra);
    });

    processedSharedItems.push({
      id: s.id,
      name: s.name.trim() || 'ของกินส่วนกลาง',
      price: fromSatang(sPriceSatang),
      memberIds: participantIds,
      costPerPerson: fromSatang(Math.round(sPriceSatang / participantIds.length)),
      participantCount: participantIds.length,
    });
  }

  const subtotalSatang = personalSubtotalSatang + sharedSubtotalSatang;
  const grandTotalSatang = subtotalSatang + deliveryFeeSatang - discountSatang;

  const validItems = items.filter(
    (item) => (item.price || 0) > 0 || (memberSharedSatangMap.get(item.id) || 0) > 0,
  );
  const activeCount = validItems.length;

  const members: SplitMemberResult[] = items.map((item, index) => {
    const originalPriceSatang = toSatang(Math.max(0, item.price || 0));
    const sharedPriceSatang = memberSharedSatangMap.get(item.id) || 0;
    const totalBeforeDiscountSatang = originalPriceSatang + sharedPriceSatang;
    const fallbackName = item.name.trim() || `คนที่ ${index + 1}`;

    if (totalBeforeDiscountSatang === 0 || subtotalSatang === 0) {
      return {
        id: item.id,
        name: fallbackName,
        originalPrice: 0,
        sharedPrice: 0,
        totalBeforeDiscount: 0,
        percentShare: 0,
        discountAmount: 0,
        finalPrice: 0,
        exactFinalPrice: 0,
      };
    }

    let exactDiscountSatang = 0;
    let percentShare = 0;

    if (splitMethod === 'PROPORTIONAL') {
      percentShare = (totalBeforeDiscountSatang / subtotalSatang) * 100;
      exactDiscountSatang = (totalBeforeDiscountSatang / subtotalSatang) * netDiscountSatang;
    } else {
      // EQUAL split across non-zero members
      percentShare = (1 / (activeCount || 1)) * 100;
      exactDiscountSatang = activeCount > 0 ? netDiscountSatang / activeCount : 0;
    }

    const exactFinalPriceSatang = totalBeforeDiscountSatang - exactDiscountSatang;
    const exactFinalPrice = fromSatang(exactFinalPriceSatang);
    const exactDiscountAmount = fromSatang(exactDiscountSatang);

    let finalPrice: number;
    let discountAmount: number;

    if (roundToInteger) {
      discountAmount = Math.round(exactDiscountAmount);
      // final price = round(total before discount - rounded discount)
      finalPrice = Math.max(0, Math.round(fromSatang(totalBeforeDiscountSatang) - discountAmount));
    } else {
      discountAmount = fromSatang(Math.round(exactDiscountSatang));
      finalPrice = Math.max(0, fromSatang(Math.round(exactFinalPriceSatang)));
    }

    return {
      id: item.id,
      name: fallbackName,
      originalPrice: fromSatang(originalPriceSatang),
      sharedPrice: fromSatang(sharedPriceSatang),
      totalBeforeDiscount: fromSatang(totalBeforeDiscountSatang),
      percentShare: Math.round(percentShare * 100) / 100,
      discountAmount,
      finalPrice,
      exactFinalPrice,
    };
  });

  const totalCollectedSatang = members.reduce((sum, m) => sum + toSatang(m.finalPrice), 0);
  const grandTotal = fromSatang(grandTotalSatang);
  const totalCollected = fromSatang(totalCollectedSatang);
  const roundingDifference = fromSatang(totalCollectedSatang - grandTotalSatang);

  return {
    subtotal: fromSatang(subtotalSatang),
    personalSubtotal: fromSatang(personalSubtotalSatang),
    sharedSubtotal: fromSatang(sharedSubtotalSatang),
    deliveryFee,
    discount,
    netDiscount: fromSatang(netDiscountSatang),
    grandTotal,
    totalCollected,
    roundingDifference,
    members,
    sharedItems: processedSharedItems,
    splitMethod,
  };
}

/**
 * Formats individual debt/reminder message for a specific member.
 */
export function formatIndividualPaymentText(
  member: SplitMemberResult,
  promptPayAccount?: string,
): string {
  const promptPayText = promptPayAccount?.trim()
    ? `\nพร้อมเพย์: ${promptPayAccount.trim()}`
    : '';
  return `ยอดโอนค่าอาหารของ ${member.name}: ${member.finalPrice} บาท${promptPayText}`;
}

/**
 * Formats clean, friendly summary text ready to paste directly into LINE Group or KhunThong.
 */
export function formatSplitBillCopyText(
  result: SplitBillResult,
  options?: {
    customHeader?: string;
    promptPayAccount?: string;
    paidMemberIds?: string[];
  },
): string {
  const header = options?.customHeader?.trim() || 'สรุปยอดหารค่าอาหาร (ตาลหาร)';
  const lines: string[] = [header, '------------------------'];

  const grandTotalFormatted = formatGrandTotal(result.grandTotal, 'บาท');
  lines.push(`ค่าอาหารรวม: ${formatPrice(result.subtotal, { unit: 'บาท' })}`);

  if (result.sharedSubtotal > 0 && result.sharedItems.length > 0) {
    lines.push(`- อาหารเดี่ยวรวม: ${formatPrice(result.personalSubtotal, { unit: 'บาท' })}`);
    lines.push(`- รายการส่วนกลาง (Shared): ${formatPrice(result.sharedSubtotal, { unit: 'บาท' })}`);
    result.sharedItems.forEach((si) => {
      lines.push(`  • ${si.name}: ${si.price} บ. (${si.participantCount} คน, คนละ ${si.costPerPerson} บ.)`);
    });
  }

  if (result.deliveryFee > 0 || result.discount > 0) {
    const deliveryPart = result.deliveryFee > 0 ? `ค่าส่ง: +${result.deliveryFee} บ.` : '';
    const discountPart = result.discount > 0 ? `ส่วนลด: -${result.discount} บ.` : '';
    const midPart = [deliveryPart, discountPart].filter(Boolean).join(' | ');
    lines.push(midPart);

    if (result.netDiscount > 0) {
      lines.push(`เหลือส่วนลดสุทธิ: ${result.netDiscount} บาท (หารตามสัดส่วน)`);
    } else if (result.netDiscount < 0) {
      lines.push(`ค่าส่งคงเหลือที่ต้องจ่ายเพิ่ม: ${Math.abs(result.netDiscount)} บาท`);
    }
  }

  lines.push(`ยอดสุทธิทั้งบิล: ${grandTotalFormatted}`);
  lines.push('------------------------');
  lines.push('ยอดโอนแยกรายคน:');

  const paidIds = new Set(options?.paidMemberIds || []);

  result.members
    .filter((m) => m.totalBeforeDiscount > 0 || m.originalPrice > 0)
    .forEach((m, idx) => {
      const isPaid = paidIds.has(m.id);
      const paidTag = isPaid ? ' [✓ โอนแล้ว]' : '';
      const priceText = `${m.finalPrice} บาท`;

      let detailBreakdown = '';
      if (m.sharedPrice > 0) {
        detailBreakdown = ` (ส่วนตัว ${m.originalPrice} + ส่วนกลาง ${m.sharedPrice})`;
      }

      const discountNote =
        m.discountAmount !== 0
          ? ` (${m.discountAmount > 0 ? `ลดไป ${m.discountAmount}` : `เพิ่ม ${Math.abs(m.discountAmount)}`})`
          : '';

      lines.push(`${idx + 1}. ${m.name}: ${priceText}${detailBreakdown}${discountNote}${paidTag}`);
    });

  if (result.roundingDifference !== 0) {
    lines.push('------------------------');
    if (result.roundingDifference > 0) {
      lines.push(`* ยอดรวมรายคนหลังปัดเศษเกินจากบิลจริง ${result.roundingDifference} บาท`);
    } else {
      lines.push(`* ยอดรวมรายคนหลังปัดเศษขาดจากบิลจริง ${Math.abs(result.roundingDifference)} บาท`);
    }
  }

  if (paidIds.size > 0) {
    const totalCount = result.members.filter((m) => m.finalPrice > 0).length;
    const paidCount = result.members.filter((m) => m.finalPrice > 0 && paidIds.has(m.id)).length;
    lines.push('------------------------');
    lines.push(`สถานะการชำระ: โอนแล้ว ${paidCount}/${totalCount} คน`);
  }

  if (options?.promptPayAccount?.trim()) {
    lines.push('------------------------');
    lines.push(`พร้อมเพย์ / บัญชีรับโอน: ${options.promptPayAccount.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Intelligent parser for quick-pasting members from Excel, Sheets, CSV, TSV, or raw chat text.
 */
export function parseQuickPasteText(rawText: string): Array<{ name: string; price: number }> {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const parsed: Array<{ name: string; price: number }> = [];

  for (const line of lines) {
    // 1. Check if line is CSV / TSV format
    const delimiter = line.includes('\t') ? '\t' : line.includes(',') ? ',' : null;
    if (delimiter) {
      const tokens = line.split(delimiter).map((t) => t.trim()).filter((t) => t.length > 0);
      
      let candidateName = '';
      let candidatePrice: number | null = null;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token) continue;
        const num = parseFloat(token);

        // Skip headers or metadata
        if (token === '#' || token === 'ชื่อ' || token.includes('ราคา') || token.includes('ห้ามลบ')) {
          candidateName = '';
          candidatePrice = null;
          break;
        }

        // If it's a number and we don't have a price yet
        if (!isNaN(num)) {
          if (candidateName && candidatePrice === null) {
            candidatePrice = num;
            break;
          }
        } else {
          // Non-numeric token, candidate for name
          if (!candidateName) {
            candidateName = token;
          }
        }
      }

      if (candidateName && candidatePrice !== null && candidatePrice > 0) {
        parsed.push({ name: candidateName, price: candidatePrice });
        continue;
      }
    }

    // 2. Fallback: Parse natural text line: e.g. "1. กัส 79.5" or "กัส 79.5" or "กัส: 79.5 บาท"
    const cleanedLine = line.replace(/^(\d+[\.\)]\s*|-\s*)/, '').trim();

    // Regex to match "Name Price" or "Name: Price" or "Name - Price"
    const match = cleanedLine.match(/^([^\d:=,-]+)[:=,-]?\s*(\d+(\.\d+)?)/);
    if (match && match[1] && match[2]) {
      const name = match[1].trim();
      const price = parseFloat(match[2]);
      if (name && !isNaN(price) && price > 0 && name !== 'รวม' && name !== 'ค่าอาหาร' && name !== 'ค่าส่ง' && name !== 'ส่วนลด') {
        parsed.push({ name, price });
        continue;
      }
    }

    // 3. Fallback: Check if number is at the beginning, e.g. "79.5 กัส"
    const revMatch = cleanedLine.match(/^(\d+(\.\d+)?)\s*[:=,-]?\s*([^\d:=,-]+)/);
    if (revMatch && revMatch[1] && revMatch[3]) {
      const price = parseFloat(revMatch[1]);
      const name = revMatch[3].trim();
      if (name && !isNaN(price) && price > 0) {
        parsed.push({ name, price });
        continue;
      }
    }
  }

  return parsed;
}

/**
 * Reorders an array by moving item at `fromIndex` to `toIndex`.
 */
export function reorderArray<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return list;
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return list;
  }
  const result = [...list];
  const removed = result.splice(fromIndex, 1)[0];
  if (removed !== undefined) {
    result.splice(toIndex, 0, removed);
  }
  return result;
}

/**
 * Sorts split items by price or name.
 */
export function sortSplitItems<T extends { name: string; price: number | '' }>(
  items: T[],
  sortBy: 'PRICE_DESC' | 'PRICE_ASC' | 'NAME_ASC',
): T[] {
  const cloned = [...items];
  switch (sortBy) {
    case 'PRICE_DESC':
      return cloned.sort((a, b) => {
        const pA = typeof a.price === 'number' ? a.price : 0;
        const pB = typeof b.price === 'number' ? b.price : 0;
        return pB - pA;
      });
    case 'PRICE_ASC':
      return cloned.sort((a, b) => {
        const pA = typeof a.price === 'number' ? a.price : 0;
        const pB = typeof b.price === 'number' ? b.price : 0;
        return pA - pB;
      });
    case 'NAME_ASC':
      return cloned.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    default:
      return cloned;
  }
}

export interface SplitBillSharePayload {
  deliveryFee: number;
  discount: number;
  splitMethod: 'PROPORTIONAL' | 'EQUAL';
  promptPay: string;
  items: Array<{ id?: string; name: string; price: number | '' }>;
  sharedItems?: Array<{ id?: string; name: string; price: number | ''; memberIds?: string[] }>;
}

export interface DecodedSplitBill {
  deliveryFee: number;
  discount: number;
  splitMethod: 'PROPORTIONAL' | 'EQUAL';
  promptPay: string;
  items: Array<{ id: string; name: string; price: number | '' }>;
  sharedItems?: Array<{ id: string; name: string; price: number | ''; memberIds: string[] }>;
}

function utf8ToBase64Url(str: string): string {
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16)),
  );
  const base64 =
    typeof window !== 'undefined'
      ? window.btoa(utf8Bytes)
      : Buffer.from(utf8Bytes, 'binary').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Encodes bill split data into an ultra-compact Base64URL string safe for all chat apps.
 */
export function encodeSplitBillToUrl(payload: SplitBillSharePayload): string {
  const compact = {
    f: payload.deliveryFee || 0,
    d: payload.discount || 0,
    m: payload.splitMethod === 'EQUAL' ? 'E' : 'P',
    p: (payload.promptPay || '').trim(),
    i: payload.items.map((it) => [
      it.name || '',
      typeof it.price === 'number' ? it.price : Number(it.price) || 0,
    ]),
    s: (payload.sharedItems || [])
      .filter((si) => (typeof si.price === 'number' && si.price > 0) || si.name.trim() !== '')
      .map((si) => [
        si.name || '',
        typeof si.price === 'number' ? si.price : Number(si.price) || 0,
        si.memberIds || [],
      ]),
  };
  return utf8ToBase64Url(JSON.stringify(compact));
}

/**
 * Decodes a URL query parameter string back into split bill data.
 */
export function decodeSplitBillFromUrl(raw: string): DecodedSplitBill | null {
  if (!raw || typeof raw !== 'string') return null;

  try {
    let b64 = raw.replace(/-/g, '+').replace(/_/g, '/').replace(/ /g, '+');
    while (b64.length % 4) b64 += '=';

    const binary =
      typeof window !== 'undefined'
        ? window.atob(b64)
        : Buffer.from(b64, 'base64').toString('binary');

    let parsedJson: any = null;

    // Try format 1: new UTF-8 Base64URL encoding
    try {
      const decodedUtf8 = decodeURIComponent(
        binary
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      parsedJson = JSON.parse(decodedUtf8);
    } catch {
      // Fallback format 2: old URI component encoding
      try {
        parsedJson = JSON.parse(decodeURIComponent(binary));
      } catch {
        // Fallback format 3: raw binary JSON
        parsedJson = JSON.parse(binary);
      }
    }

    if (!parsedJson || typeof parsedJson !== 'object') return null;

    // Check if new compact format { f, d, m, p, i: [[name, price], ...], s: [[name, price, [memberIds]], ...] }
    if (Array.isArray(parsedJson.i)) {
      return {
        deliveryFee: Number(parsedJson.f) || 0,
        discount: Number(parsedJson.d) || 0,
        splitMethod: parsedJson.m === 'E' ? 'EQUAL' : 'PROPORTIONAL',
        promptPay: typeof parsedJson.p === 'string' ? parsedJson.p : '',
        items: parsedJson.i.map((entry: any, idx: number) => {
          const name = Array.isArray(entry) ? String(entry[0] || '') : String(entry?.name || '');
          const price = Array.isArray(entry)
            ? typeof entry[1] === 'number'
              ? entry[1]
              : Number(entry[1]) || ''
            : typeof entry?.price === 'number'
            ? entry.price
            : Number(entry?.price) || '';
          return {
            id: String(idx + 1),
            name,
            price: price === 0 || price === '' ? '' : price,
          };
        }),
        sharedItems: Array.isArray(parsedJson.s)
          ? parsedJson.s.map((entry: any, idx: number) => ({
              id: `shared-${idx + 1}`,
              name: Array.isArray(entry) ? String(entry[0] || '') : '',
              price: Array.isArray(entry)
                ? typeof entry[1] === 'number'
                  ? entry[1]
                  : Number(entry[1]) || ''
                : '',
              memberIds: Array.isArray(entry) && Array.isArray(entry[2]) ? entry[2] : [],
            }))
          : [],
      };
    }

    // Check if old verbose format { deliveryFee, discount, splitMethod, promptPay, items }
    if (Array.isArray(parsedJson.items)) {
      return {
        deliveryFee: Number(parsedJson.deliveryFee) || 0,
        discount: Number(parsedJson.discount) || 0,
        splitMethod: parsedJson.splitMethod === 'EQUAL' ? 'EQUAL' : 'PROPORTIONAL',
        promptPay: typeof parsedJson.promptPay === 'string' ? parsedJson.promptPay : '',
        items: parsedJson.items.map((it: any, idx: number) => ({
          id: it.id ? String(it.id) : String(idx + 1),
          name: typeof it.name === 'string' ? it.name : '',
          price: typeof it.price === 'number' ? it.price : Number(it.price) || '',
        })),
        sharedItems: [],
      };
    }

    return null;
  } catch (err) {
    console.warn('Failed to decode split bill payload from URL:', err);
    return null;
  }
}
