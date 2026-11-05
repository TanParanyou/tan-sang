import type {
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
 * Calculates bill split allocation based on delivery fees and discounts.
 */
export function calculateSplitBill(input: SplitBillInput): SplitBillResult {
  const items = input.items || [];
  const deliveryFee = Math.max(0, input.deliveryFee || 0);
  const discount = Math.max(0, input.discount || 0);
  const roundToInteger = input.roundToInteger ?? true;
  const splitMethod = input.splitMethod || 'PROPORTIONAL';

  const deliveryFeeSatang = toSatang(deliveryFee);
  const discountSatang = toSatang(discount);
  const netDiscountSatang = discountSatang - deliveryFeeSatang;

  const subtotalSatang = items.reduce((sum, item) => sum + toSatang(Math.max(0, item.price || 0)), 0);
  const grandTotalSatang = subtotalSatang + deliveryFeeSatang - discountSatang;

  const validItems = items.filter((item) => (item.price || 0) > 0);
  const activeCount = validItems.length;

  const members: SplitMemberResult[] = items.map((item, index) => {
    const originalPriceSatang = toSatang(Math.max(0, item.price || 0));
    const fallbackName = item.name.trim() || `คนที่ ${index + 1}`;

    if (originalPriceSatang === 0 || subtotalSatang === 0) {
      return {
        id: item.id,
        name: fallbackName,
        originalPrice: 0,
        percentShare: 0,
        discountAmount: 0,
        finalPrice: 0,
        exactFinalPrice: 0,
      };
    }

    let exactDiscountSatang = 0;
    let percentShare = 0;

    if (splitMethod === 'PROPORTIONAL') {
      percentShare = (originalPriceSatang / subtotalSatang) * 100;
      exactDiscountSatang = (originalPriceSatang / subtotalSatang) * netDiscountSatang;
    } else {
      // EQUAL split across non-zero members
      percentShare = (1 / (activeCount || 1)) * 100;
      exactDiscountSatang = activeCount > 0 ? netDiscountSatang / activeCount : 0;
    }

    const exactFinalPriceSatang = originalPriceSatang - exactDiscountSatang;
    const exactFinalPrice = fromSatang(exactFinalPriceSatang);
    const exactDiscountAmount = fromSatang(exactDiscountSatang);

    let finalPrice: number;
    let discountAmount: number;

    if (roundToInteger) {
      discountAmount = Math.round(exactDiscountAmount);
      // Consistent with spreadsheet: final price = round(original price - rounded discount)
      finalPrice = Math.max(0, Math.round(fromSatang(originalPriceSatang) - discountAmount));
    } else {
      discountAmount = fromSatang(Math.round(exactDiscountSatang));
      finalPrice = Math.max(0, fromSatang(Math.round(exactFinalPriceSatang)));
    }

    return {
      id: item.id,
      name: fallbackName,
      originalPrice: fromSatang(originalPriceSatang),
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
    deliveryFee,
    discount,
    netDiscount: fromSatang(netDiscountSatang),
    grandTotal,
    totalCollected,
    roundingDifference,
    members,
    splitMethod,
  };
}

/**
 * Formats clean, friendly summary text ready to paste directly into LINE Group or KhunThong.
 */
export function formatSplitBillCopyText(
  result: SplitBillResult,
  options?: { customHeader?: string; promptPayAccount?: string },
): string {
  const header = options?.customHeader?.trim() || 'สรุปยอดหารค่าอาหาร (ตาลหาร)';
  const lines: string[] = [header, '------------------------'];

  const grandTotalFormatted = formatGrandTotal(result.grandTotal, 'บาท');
  lines.push(`ค่าอาหารรวม: ${formatPrice(result.subtotal, { unit: 'บาท' })}`);

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

  result.members
    .filter((m) => m.originalPrice > 0)
    .forEach((m, idx) => {
      const priceText = `${m.finalPrice} บาท`;
      const discountNote =
        m.discountAmount !== 0
          ? ` (เดิม ${m.originalPrice} ${m.discountAmount > 0 ? `ลดไป ${m.discountAmount}` : `เพิ่ม ${Math.abs(m.discountAmount)}`})`
          : '';
      lines.push(`${idx + 1}. ${m.name}: ${priceText}${discountNote}`);
    });

  if (result.roundingDifference !== 0) {
    lines.push('------------------------');
    if (result.roundingDifference > 0) {
      lines.push(`* ยอดรวมรายคนหลังปัดเศษเกินจากบิลจริง ${result.roundingDifference} บาท`);
    } else {
      lines.push(`* ยอดรวมรายคนหลังปัดเศษขาดจากบิลจริง ${Math.abs(result.roundingDifference)} บาท`);
    }
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
    // Clean leading index like "1. " or "1) " or "- "
    const cleanedLine = line.replace(/^(\d+[\.\)]\s*|-\s*)/, '').trim();

    // Regex to match "Name Price" or "Name: Price" or "Name - Price"
    const match = cleanedLine.match(/^([^\d:=,-]+)[:=,-]?\s*(\d+(\.\d+)?)/);
    if (match && match[1] && match[2]) {
      const name = match[1].trim();
      const price = parseFloat(match[2]);
      if (name && !isNaN(price) && price > 0 && name !== 'รวม' && name !== 'ค่าอาหาร' && name !== 'ค่าส่ง' && name !== 'ส่วนลด') {
        parsed.push({ name, price });
      }
    }
  }

  return parsed;
}

/**
 * Reorders an array by moving an item from startIndex to endIndex.
 */
export function reorderArray<T>(list: T[], startIndex: number, endIndex: number): T[] {
  if (startIndex < 0 || startIndex >= list.length || endIndex < 0 || endIndex >= list.length) {
    return list;
  }
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  if (removed !== undefined) {
    result.splice(endIndex, 0, removed);
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
  const list = [...items];
  return list.sort((a, b) => {
    const priceA = typeof a.price === 'number' ? a.price : 0;
    const priceB = typeof b.price === 'number' ? b.price : 0;

    if (sortBy === 'PRICE_DESC') {
      return priceB - priceA;
    }
    if (sortBy === 'PRICE_ASC') {
      return priceA - priceB;
    }
    if (sortBy === 'NAME_ASC') {
      return a.name.localeCompare(b.name, 'th');
    }
    return 0;
  });
}
