import type {
  GroupedOrderItemSummary,
  OrderItem,
  OrderSession,
  OrderSessionSummary,
  RecipientOrderBreakdown,
} from '@/features/order-session/order-session.schema';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';
import { formatThaiDateTime } from '@/lib/utils/date';

/**
 * Converts a baht amount to integer satang to prevent IEEE-754 floating point drift.
 */
function toSatang(amount: number): number {
  return Math.round(amount * 100);
}

function fromSatang(satang: number): number {
  return satang / 100;
}

/**
 * Formats a single order item's display title (e.g. "ข้าวผัดหมู (ธรรมดา) + ไข่ดาว").
 */
export function formatOrderItemTitle(
  menuName: string,
  variantName: string | null,
  optionNames: string[],
): string {
  const cleanMenu = menuName.trim();
  const cleanVariant = variantName?.trim();
  const baseTitle = cleanVariant ? `${cleanMenu} (${cleanVariant})` : cleanMenu;

  if (optionNames.length === 0) {
    return baseTitle;
  }

  return `${baseTitle} + ${optionNames.join(', ')}`;
}

/**
 * Calculates unit price (including options) and line total for a single order item.
 */
export function calculateOrderItemTotals(item: Pick<OrderItem, 'unitPrice' | 'quantity' | 'options'>): {
  unitPriceWithOptions: number;
  lineTotal: number;
} {
  const optionsSatang = item.options.reduce((sum, opt) => sum + toSatang(opt.price), 0);
  const unitWithOptionsSatang = toSatang(item.unitPrice) + optionsSatang;
  const lineTotalSatang = unitWithOptionsSatang * item.quantity;

  return {
    unitPriceWithOptions: fromSatang(unitWithOptionsSatang),
    lineTotal: fromSatang(lineTotalSatang),
  };
}

/**
 * Groups identical menu items, variants, sorted options, and notes for Merchant View.
 * Example output: "ข้าวผัดหมู (ธรรมดา) + ไข่ดาว x 3"
 */
export function groupOrderItemsForMerchant(items: OrderItem[]): GroupedOrderItemSummary[] {
  const groupedMap = new Map<string, GroupedOrderItemSummary>();

  for (const item of items) {
    const normalizedMenu = item.menuName.trim();
    const normalizedVariant = item.variantName?.trim() || null;
    const normalizedNote = item.note?.trim() || null;
    const sortedOptionNames = item.options
      .map((opt) => opt.optionName.trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => a.localeCompare(b, 'th'));

    const { unitPriceWithOptions, lineTotal } = calculateOrderItemTotals(item);

    const fingerprint = [
      normalizedMenu.toLowerCase(),
      (normalizedVariant ?? '').toLowerCase(),
      sortedOptionNames.map((o) => o.toLowerCase()).join('|'),
      (normalizedNote ?? '').toLowerCase(),
      toSatang(unitPriceWithOptions).toString(),
    ].join('::');

    const existing = groupedMap.get(fingerprint);
    if (!existing) {
      groupedMap.set(fingerprint, {
        fingerprint,
        menuName: normalizedMenu,
        variantName: normalizedVariant,
        optionNames: sortedOptionNames,
        note: normalizedNote,
        unitPriceWithOptions,
        totalQuantity: item.quantity,
        totalPrice: lineTotal,
        recipients: [
          {
            recipientName: item.recipientName.trim(),
            quantity: item.quantity,
          },
        ],
      });
    } else {
      existing.totalQuantity += item.quantity;
      existing.totalPrice = fromSatang(toSatang(existing.totalPrice) + toSatang(lineTotal));

      const cleanRecipient = item.recipientName.trim();
      const existingRecipient = existing.recipients.find(
        (r) => r.recipientName.toLowerCase() === cleanRecipient.toLowerCase(),
      );
      if (existingRecipient) {
        existingRecipient.quantity += item.quantity;
      } else {
        existing.recipients.push({
          recipientName: cleanRecipient,
          quantity: item.quantity,
        });
      }
    }
  }

  return Array.from(groupedMap.values());
}

/**
 * Groups order items by recipient name for Individual Breakdown (split bill view).
 */
export function groupOrderItemsByRecipient(items: OrderItem[]): RecipientOrderBreakdown[] {
  const recipientMap = new Map<string, RecipientOrderBreakdown>();

  for (const item of items) {
    const cleanRecipient = item.recipientName.trim();
    const key = cleanRecipient.toLowerCase();
    const sortedOptionNames = item.options
      .map((opt) => opt.optionName.trim())
      .filter((name) => name.length > 0);
    const displayTitle = formatOrderItemTitle(
      item.menuName,
      item.variantName,
      sortedOptionNames,
    );
    const { unitPriceWithOptions, lineTotal } = calculateOrderItemTotals(item);

    const existing = recipientMap.get(key);
    const itemEntry = {
      itemId: item.id,
      displayTitle,
      note: item.note?.trim() || null,
      quantity: item.quantity,
      unitPriceWithOptions,
      lineTotal,
    };

    if (!existing) {
      recipientMap.set(key, {
        recipientName: cleanRecipient,
        totalQuantity: item.quantity,
        totalAmount: lineTotal,
        items: [itemEntry],
      });
    } else {
      existing.totalQuantity += item.quantity;
      existing.totalAmount = fromSatang(toSatang(existing.totalAmount) + toSatang(lineTotal));
      existing.items.push(itemEntry);
    }
  }

  return Array.from(recipientMap.values());
}

/**
 * Generates clean text formatted for pasting directly into Merchant LINE/Facebook chat.
 */
export function formatMerchantOrderText(
  storeDisplayName: string,
  groupedItems: GroupedOrderItemSummary[],
  orderedAt?: string | null,
): string {
  if (groupedItems.length === 0) {
    return `ออเดอร์ร้าน: ${storeDisplayName}\n(ยังไม่มีรายการอาหาร)`;
  }

  const lines: string[] = [`ออเดอร์ร้าน: ${storeDisplayName}`];
  if (orderedAt) {
    lines.push(`วัน-เวลา: ${formatThaiDateTime(orderedAt)}`);
  }
  lines.push('------------------------');
  let totalQuantity = 0;
  let grandTotalSatang = 0;

  groupedItems.forEach((group, index) => {
    const title = formatOrderItemTitle(group.menuName, group.variantName, group.optionNames);
    const noteSuffix = group.note ? ` [หมายเหตุ: ${group.note}]` : '';
    lines.push(`${index + 1}. ${title}${noteSuffix} x ${group.totalQuantity}`);
    totalQuantity += group.totalQuantity;
    grandTotalSatang += toSatang(group.totalPrice);
  });

  const grandTotal = fromSatang(grandTotalSatang);
  lines.push('------------------------');
  const grandTotalFormatted = formatGrandTotal(grandTotal, 'บาท');
  if (grandTotalFormatted) {
    lines.push(`รวมทั้งหมด: ${totalQuantity} รายการ (${grandTotalFormatted})`);
  } else {
    lines.push(`รวมทั้งหมด: ${totalQuantity} รายการ`);
  }

  return lines.join('\n');
}

/**
 * Generates formatted text specifically for splitting bills with friends or passing to KhunThong.
 */
export function formatKhunThongSplitText(
  storeDisplayName: string,
  recipientBreakdowns: RecipientOrderBreakdown[],
  grandTotalAmount: number,
  totalItemsCount: number,
  orderedAt?: string | null,
): string {
  if (recipientBreakdowns.length === 0) {
    return `สรุปยอดสั่งอาหาร: ${storeDisplayName}\n(ยังไม่มีรายการอาหาร)`;
  }

  const grandTotalFormatted = formatGrandTotal(grandTotalAmount, 'บาท');
  const isGrandTotalZero = grandTotalAmount === 0;

  const lines: string[] = [
    `สรุปยอดสั่งอาหาร: ${storeDisplayName}`,
    ...(orderedAt ? [`วัน-เวลา: ${formatThaiDateTime(orderedAt)}`] : []),
    grandTotalFormatted
      ? `ยอดรวมทั้งหมด: ${grandTotalFormatted} (${totalItemsCount} รายการ)`
      : `ยอดรวมทั้งหมด: ${totalItemsCount} รายการ (รอร้านคิดเงิน)`,
    '------------------------',
    'ยอดแยกรายคน (สำหรับโอนเงิน / ให้ขุนทองช่วยหาร):',
  ];

  recipientBreakdowns.forEach((r, index) => {
    const itemDetails = r.items
      .map((it) => `${it.displayTitle} x${it.quantity}`)
      .join(', ');
    const amountStr = formatPrice(r.totalAmount, {
      isGrandTotalZero,
      unit: 'บาท',
    });
    lines.push(`${index + 1}. ${r.recipientName}: ${amountStr} (${itemDetails})`);
  });

  lines.push('------------------------');
  lines.push('สามารถนำยอดรายคนนี้ไปเปิดบิลในบอทขุนทอง หรือแจ้งยอดโอนในกลุ่มได้เลยครับ');

  return lines.join('\n');
}

/**
 * Builds the complete OrderSessionSummary view model for both Grouped & Individual views.
 */
export function buildOrderSessionSummary(
  session: OrderSession,
  storeDisplayName: string,
): OrderSessionSummary {
  const groupedItems = groupOrderItemsForMerchant(session.items);
  const recipientBreakdowns = groupOrderItemsByRecipient(session.items);

  const totalItemsCount = groupedItems.reduce((sum, g) => sum + g.totalQuantity, 0);
  const grandTotalSatang = groupedItems.reduce((sum, g) => sum + toSatang(g.totalPrice), 0);
  const grandTotalAmount = fromSatang(grandTotalSatang);
  const sessionDate = session.closedAt ?? session.createdAt;

  return {
    sessionId: session.id,
    storeDisplayName,
    status: session.status,
    totalItemsCount,
    grandTotalAmount,
    groupedItems,
    recipientBreakdowns,
    merchantCopyText: formatMerchantOrderText(storeDisplayName, groupedItems, sessionDate),
    khunThongCopyText: formatKhunThongSplitText(
      storeDisplayName,
      recipientBreakdowns,
      grandTotalAmount,
      totalItemsCount,
      sessionDate,
    ),
  };
}
