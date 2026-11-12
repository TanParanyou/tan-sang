import type {
  GroupedOrderItemSummary,
  OrderItem,
  OrderSession,
  OrderSessionFeeOptions,
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
            pictureUrl: item.pictureUrl ?? null,
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
        if (!existingRecipient.pictureUrl && item.pictureUrl) {
          existingRecipient.pictureUrl = item.pictureUrl;
        }
      } else {
        existing.recipients.push({
          recipientName: cleanRecipient,
          quantity: item.quantity,
          pictureUrl: item.pictureUrl ?? null,
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
        pictureUrl: item.pictureUrl ?? null,
        totalQuantity: item.quantity,
        totalAmount: lineTotal,
        finalAmount: lineTotal,
        items: [itemEntry],
      });
    } else {
      existing.totalQuantity += item.quantity;
      existing.totalAmount = fromSatang(toSatang(existing.totalAmount) + toSatang(lineTotal));
      existing.finalAmount = existing.totalAmount;
      if (!existing.pictureUrl && item.pictureUrl) {
        existing.pictureUrl = item.pictureUrl;
      }
      existing.items.push(itemEntry);
    }
  }

  return Array.from(recipientMap.values());
}

/**
 * Allocates delivery fee, packaging fee, and discounts among recipients with zero satang drift.
 */
export function calculateRecipientAllocations(
  recipientBreakdowns: RecipientOrderBreakdown[],
  feeOptions: OrderSessionFeeOptions = {},
): {
  recipientBreakdowns: RecipientOrderBreakdown[];
  grandTotalAmount: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  netPayableAmount: number;
  splitMethod: 'EQUAL' | 'PROPORTIONAL';
} {
  const deliveryFee = Math.max(0, feeOptions.deliveryFee || 0);
  const packagingFee = Math.max(0, feeOptions.packagingFee || 0);
  const discount = Math.max(0, feeOptions.discount || 0);
  const splitMethod = feeOptions.splitMethod || 'EQUAL';

  const totalFoodSatang = recipientBreakdowns.reduce((sum, r) => sum + toSatang(r.totalAmount), 0);
  const deliveryFeeSatang = toSatang(deliveryFee);
  const packagingFeeSatang = toSatang(packagingFee);
  const totalFeeSatang = deliveryFeeSatang + packagingFeeSatang;
  const discountSatang = toSatang(discount);
  const grandTotalFood = fromSatang(totalFoodSatang);
  const netPayableSatang = Math.max(0, totalFoodSatang + totalFeeSatang - discountSatang);
  const netPayableAmount = fromSatang(netPayableSatang);

  const activeRecipients = recipientBreakdowns.filter((r) => r.totalAmount > 0);
  const count = activeRecipients.length;

  if (count === 0 || (totalFeeSatang === 0 && discountSatang === 0)) {
    return {
      recipientBreakdowns: recipientBreakdowns.map((r) => ({
        ...r,
        deliveryFeeShare: 0,
        discountShare: 0,
        finalAmount: r.totalAmount,
      })),
      grandTotalAmount: grandTotalFood,
      deliveryFee,
      packagingFee,
      discount,
      netPayableAmount: grandTotalFood,
      splitMethod,
    };
  }

  let feeDistributedSatang = 0;
  let discountDistributedSatang = 0;

  const allocated = recipientBreakdowns.map((r, index) => {
    if (r.totalAmount <= 0) {
      return {
        ...r,
        _feeSatang: 0,
        _discSatang: 0,
      };
    }

    let myFeeSatang = 0;
    let myDiscountSatang = 0;

    if (splitMethod === 'EQUAL') {
      const baseFee = Math.floor(totalFeeSatang / count);
      const feeRemainder = totalFeeSatang % count;
      myFeeSatang = baseFee + (index < feeRemainder ? 1 : 0);

      const baseDisc = Math.floor(discountSatang / count);
      const discRemainder = discountSatang % count;
      myDiscountSatang = baseDisc + (index < discRemainder ? 1 : 0);
    } else {
      const ratio = totalFoodSatang > 0 ? toSatang(r.totalAmount) / totalFoodSatang : 1 / count;
      myFeeSatang = Math.round(totalFeeSatang * ratio);
      myDiscountSatang = Math.round(discountSatang * ratio);
    }

    feeDistributedSatang += myFeeSatang;
    discountDistributedSatang += myDiscountSatang;

    return {
      ...r,
      _feeSatang: myFeeSatang,
      _discSatang: myDiscountSatang,
    };
  });

  // Reconcile rounding difference
  const activeItems = allocated.filter((r) => r.totalAmount > 0);
  const firstActive = activeItems[0];
  if (firstActive) {
    const feeDiff = totalFeeSatang - feeDistributedSatang;
    if (feeDiff !== 0) {
      firstActive._feeSatang += feeDiff;
    }
    const discDiff = discountSatang - discountDistributedSatang;
    if (discDiff !== 0) {
      firstActive._discSatang += discDiff;
    }
  }

  const finalBreakdowns: RecipientOrderBreakdown[] = allocated.map((r) => {
    const foodSatang = toSatang(r.totalAmount);
    const myNetSatang = Math.max(0, foodSatang + (r._feeSatang || 0) - (r._discSatang || 0));
    return {
      recipientName: r.recipientName,
      pictureUrl: r.pictureUrl,
      totalQuantity: r.totalQuantity,
      totalAmount: r.totalAmount,
      deliveryFeeShare: fromSatang(r._feeSatang || 0),
      discountShare: fromSatang(r._discSatang || 0),
      finalAmount: fromSatang(myNetSatang),
      isPaid: r.isPaid,
      items: r.items,
    };
  });

  return {
    recipientBreakdowns: finalBreakdowns,
    grandTotalAmount: grandTotalFood,
    deliveryFee,
    packagingFee,
    discount,
    netPayableAmount,
    splitMethod,
  };
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
  feeSummary?: {
    deliveryFee?: number;
    packagingFee?: number;
    discount?: number;
    netPayableAmount?: number;
  },
): string {
  if (recipientBreakdowns.length === 0) {
    return `สรุปยอดสั่งอาหาร: ${storeDisplayName}\n(ยังไม่มีรายการอาหาร)`;
  }

  const grandTotalFormatted = formatGrandTotal(grandTotalAmount, 'บาท');
  const isGrandTotalZero = grandTotalAmount === 0;
  const netPayable = feeSummary?.netPayableAmount ?? grandTotalAmount;
  const deliveryFee = feeSummary?.deliveryFee ?? 0;
  const packagingFee = feeSummary?.packagingFee ?? 0;
  const discount = feeSummary?.discount ?? 0;
  const hasFeeOrDiscount = deliveryFee > 0 || packagingFee > 0 || discount > 0;

  const lines: string[] = [
    `สรุปยอดสั่งอาหาร: ${storeDisplayName}`,
    ...(orderedAt ? [`วัน-เวลา: ${formatThaiDateTime(orderedAt)}`] : []),
  ];

  if (hasFeeOrDiscount) {
    lines.push(
      grandTotalFormatted
        ? `ยอดค่าอาหาร: ${grandTotalFormatted} (${totalItemsCount} รายการ)`
        : `ยอดค่าอาหาร: ${totalItemsCount} รายการ`,
    );
    if (deliveryFee > 0) {
      lines.push(`+ ค่าส่ง: ${formatPrice(deliveryFee, { unit: 'บาท' })}`);
    }
    if (packagingFee > 0) {
      lines.push(`+ ค่าถุง/บริการ: ${formatPrice(packagingFee, { unit: 'บาท' })}`);
    }
    if (discount > 0) {
      lines.push(`- ส่วนลด: ${formatPrice(discount, { unit: 'บาท' })}`);
    }
    lines.push(`ยอดสุทธิที่ต้องชำระ: ${formatGrandTotal(netPayable, 'บาท')}`);
  } else {
    lines.push(
      grandTotalFormatted
        ? `ยอดรวมทั้งหมด: ${grandTotalFormatted} (${totalItemsCount} รายการ)`
        : `ยอดรวมทั้งหมด: ${totalItemsCount} รายการ (รอร้านคิดเงิน)`,
    );
  }

  lines.push('------------------------');
  lines.push('ยอดแยกรายคน (สำหรับโอนเงิน / ให้ขุนทองช่วยหาร):');

  recipientBreakdowns.forEach((r, index) => {
    const itemDetails = r.items
      .map((it) => `${it.displayTitle} x${it.quantity}`)
      .join(', ');

    const targetAmount = hasFeeOrDiscount ? (r.finalAmount ?? r.totalAmount) : r.totalAmount;
    const amountStr = formatPrice(targetAmount, {
      isGrandTotalZero,
      unit: 'บาท',
    });

    const adjustments: string[] = [];
    if (r.deliveryFeeShare && r.deliveryFeeShare > 0) {
      adjustments.push(`+ค่าส่ง ${formatPrice(r.deliveryFeeShare)}`);
    }
    if (r.discountShare && r.discountShare > 0) {
      adjustments.push(`-ส่วนลด ${formatPrice(r.discountShare)}`);
    }
    const adjNote = adjustments.length > 0 ? ` (${adjustments.join(', ')})` : '';

    lines.push(`${index + 1}. ${r.recipientName}: ${amountStr}${adjNote} (${itemDetails})`);
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
  feeOptions: OrderSessionFeeOptions = {},
): OrderSessionSummary {
  const groupedItems = groupOrderItemsForMerchant(session.items);
  const rawRecipientBreakdowns = groupOrderItemsByRecipient(session.items);

  const {
    recipientBreakdowns,
    grandTotalAmount,
    deliveryFee,
    packagingFee,
    discount,
    netPayableAmount,
    splitMethod,
  } = calculateRecipientAllocations(rawRecipientBreakdowns, feeOptions);

  const totalItemsCount = groupedItems.reduce((sum, g) => sum + g.totalQuantity, 0);
  const sessionDate = session.closedAt ?? session.createdAt;

  return {
    sessionId: session.id,
    storeDisplayName,
    status: session.status,
    totalItemsCount,
    grandTotalAmount,
    deliveryFee,
    packagingFee,
    discount,
    netPayableAmount,
    splitMethod,
    groupedItems,
    recipientBreakdowns,
    merchantCopyText: formatMerchantOrderText(storeDisplayName, groupedItems, sessionDate),
    khunThongCopyText: formatKhunThongSplitText(
      storeDisplayName,
      recipientBreakdowns,
      grandTotalAmount,
      totalItemsCount,
      sessionDate,
      {
        deliveryFee,
        packagingFee,
        discount,
        netPayableAmount,
      },
    ),
  };
}

