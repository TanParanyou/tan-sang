'use client';

import React from 'react';
import { AlertCircle, Receipt } from 'lucide-react';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { SplitBillResult } from '../split-calculator.schema';

interface BillLedgerSectionProps {
  result: SplitBillResult;
}

export function BillLedgerSection({ result }: BillLedgerSectionProps) {
  const { t } = useI18n();

  return (
    <div className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-hairline">
        <div className="flex items-center gap-1.5">
          <Receipt className="h-4 w-4 text-chili" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            {t.split.billLedgerSection}
          </h2>
        </div>
        <span className="text-xs text-ink-secondary">
          {result.members.length} {t.split.peopleCount}
        </span>
      </div>

      <div className="space-y-1.5 text-sm pt-1">
        <div className="flex justify-between text-ink-secondary text-xs sm:text-sm">
          <span>{t.split.foodSubtotal}</span>
          <span className="font-mono tabular-nums font-semibold text-ink">
            {formatPrice(result.subtotal, { unit: t.common.baht })}
          </span>
        </div>

        {result.deliveryFee > 0 && (
          <div className="flex justify-between text-ink-secondary text-xs sm:text-sm">
            <span>{t.split.deliverySubtotal}</span>
            <span className="font-mono tabular-nums font-semibold text-ink">
              +{formatPrice(result.deliveryFee, { unit: t.common.baht })}
            </span>
          </div>
        )}

        {result.discount > 0 && (
          <div className="flex justify-between text-chili text-xs sm:text-sm">
            <span>{t.split.discountSubtotal}</span>
            <span className="font-mono tabular-nums font-semibold">
              -{formatPrice(result.discount, { unit: t.common.baht })}
            </span>
          </div>
        )}

        {/* Grand Total Row */}
        <div className="border-t-2 border-dashed border-hairline my-2.5 pt-2.5 flex justify-between items-baseline">
          <div>
            <span className="text-sm font-bold text-ink">{t.split.netTotalToPay}</span>
            <span className="block text-[11px] text-ink-muted">
              {t.split.netTotalHint}
            </span>
          </div>
          <span className="font-mono text-2xl font-black text-chili tabular-nums">
            {formatGrandTotal(result.grandTotal, t.common.baht)}
          </span>
        </div>

        {/* Verification Check */}
        <div className="flex justify-between text-xs text-ink-muted pt-1 border-t border-hairline">
          <span>{t.split.totalCollected}</span>
          <span className="font-mono tabular-nums font-bold text-ink-secondary">
            {formatPrice(result.totalCollected, { unit: t.common.baht })}
          </span>
        </div>

        {result.roundingDifference !== 0 && (
          <div className="rounded-theme bg-amber-500/10 p-2 text-xs text-amber-800 flex items-start gap-1.5 mt-2 border border-amber-200/50">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              {t.split.roundDiffBadge}:{' '}
              <strong className="font-mono tabular-nums">
                {Math.abs(result.roundingDifference)} {t.common.baht}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
