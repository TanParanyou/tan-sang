'use client';

import React from 'react';
import { AlertCircle, Receipt, CheckCircle2, RotateCcw, CheckCheck } from 'lucide-react';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { SplitBillResult } from '../split-calculator.schema';

interface BillLedgerSectionProps {
  result: SplitBillResult;
  paidMemberIds?: string[];
  onMarkAllPaid?: () => void;
  onResetPaid?: () => void;
}

export function BillLedgerSection({
  result,
  paidMemberIds = [],
  onMarkAllPaid,
  onResetPaid,
}: BillLedgerSectionProps) {
  const { t } = useI18n();

  const activeMembers = result.members.filter((m) => m.finalPrice > 0);
  const paidSet = new Set(paidMemberIds);
  const paidMembers = activeMembers.filter((m) => paidSet.has(m.id));
  const paidCount = paidMembers.length;
  const totalCount = activeMembers.length;

  const paidAmount = paidMembers.reduce((sum, m) => sum + m.finalPrice, 0);
  const unpaidAmount = Math.max(0, result.totalCollected - paidAmount);
  const percentPaid = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

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
        {/* Subtotal Breakdowns */}
        {result.sharedSubtotal > 0 ? (
          <>
            <div className="flex justify-between text-ink-secondary text-xs sm:text-sm">
              <span>{t.split.foodSubtotal}</span>
              <span className="font-mono tabular-nums font-semibold text-ink">
                {formatPrice(result.subtotal, { unit: t.common.baht })}
              </span>
            </div>
            <div className="flex justify-between text-ink-muted text-[11px] pl-3">
              <span>• อาหารเดี่ยว</span>
              <span className="font-mono tabular-nums">
                {formatPrice(result.personalSubtotal, { unit: t.common.baht })}
              </span>
            </div>
            <div className="flex justify-between text-ink-muted text-[11px] pl-3">
              <span>• รายการส่วนกลาง</span>
              <span className="font-mono tabular-nums">
                +{formatPrice(result.sharedSubtotal, { unit: t.common.baht })}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-ink-secondary text-xs sm:text-sm">
            <span>{t.split.foodSubtotal}</span>
            <span className="font-mono tabular-nums font-semibold text-ink">
              {formatPrice(result.subtotal, { unit: t.common.baht })}
            </span>
          </div>
        )}

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

      {/* Payment Tracking Dashboard Card */}
      {totalCount > 0 && (
        <div className="mt-4 pt-3 border-t border-hairline space-y-2.5 bg-subtle/30 -mx-4 -mb-4 p-4 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                {t.split.paidStatus}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {onMarkAllPaid && paidCount < totalCount && (
                <button
                  type="button"
                  onClick={onMarkAllPaid}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                >
                  <CheckCheck className="h-3 w-3" />
                  {t.split.markAllPaid}
                </button>
              )}
              {onResetPaid && paidCount > 0 && (
                <button
                  type="button"
                  onClick={onResetPaid}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  {t.split.resetPaid}
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-ink-secondary">
                {t.split.paymentProgress
                  .replace('{paid}', String(paidCount))
                  .replace('{total}', String(totalCount))}
              </span>
              <span className="font-mono tabular-nums text-emerald-600 font-bold">
                {percentPaid}%
              </span>
            </div>
            <div className="h-2 w-full bg-canvas rounded-full overflow-hidden border border-hairline">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${percentPaid}%` }}
              />
            </div>
          </div>

          {/* Amount Summary: Paid vs Unpaid */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-lg bg-surface border border-hairline flex flex-col">
              <span className="text-[11px] text-ink-muted">{t.split.paidAmountLabel}</span>
              <span className="font-mono tabular-nums font-bold text-emerald-600 text-sm">
                {formatPrice(paidAmount, { unit: t.common.baht })}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-hairline flex flex-col">
              <span className="text-[11px] text-ink-muted">{t.split.unpaidAmountLabel}</span>
              <span className="font-mono tabular-nums font-bold text-chili text-sm">
                {formatPrice(unpaidAmount, { unit: t.common.baht })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
