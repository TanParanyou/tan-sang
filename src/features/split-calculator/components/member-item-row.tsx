'use client';

import React, { useState, useEffect } from 'react';
import { GripVertical, Trash2, CheckCircle2, Circle, Copy } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useI18n } from '@/lib/i18n/i18n-context';
import { evaluateSimpleMath, hasMathOperators } from '@/lib/utils/math-expression';
import type { SplitMemberResult } from '../split-calculator.schema';

interface MemberItemRowProps {
  index: number;
  totalMembers: number;
  member: SplitMemberResult;
  rawPrice: number | '';
  rawName: string;
  isPaid?: boolean;
  onTogglePaid?: () => void;
  onCopyReminder?: () => void;
  isBeingDragged: boolean;
  isDragTarget: boolean;
  onNameChange: (val: string) => void;
  onPriceChange: (val: string) => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onTouchStart: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function MemberItemRow({
  index,
  totalMembers,
  member,
  rawPrice,
  rawName,
  isPaid = false,
  onTogglePaid,
  onCopyReminder,
  isBeingDragged,
  isDragTarget,
  onNameChange,
  onPriceChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: MemberItemRowProps) {
  const { t } = useI18n();

  const personNum = index + 1;
  const personNameLabel = `${t.split.memberPlaceholder} ${personNum}`;
  const dragAria = t.split.dragPersonAria.replace('{index}', String(personNum));
  const deleteAria = t.split.deletePersonAria.replace('{index}', String(personNum));

  // Local draft state for inline math (e.g. "60+15")
  const [inputText, setInputText] = useState<string>(
    rawPrice === '' ? '' : String(rawPrice),
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputText(rawPrice === '' ? '' : String(rawPrice));
    }
  }, [rawPrice, isFocused]);

  const handlePriceInputCommit = (valueToCommit: string) => {
    const trimmed = valueToCommit.trim();
    if (!trimmed) {
      setInputText('');
      onPriceChange('');
      return;
    }

    if (hasMathOperators(trimmed)) {
      const evaluated = evaluateSimpleMath(trimmed);
      if (evaluated !== null && !isNaN(evaluated)) {
        setInputText(String(evaluated));
        onPriceChange(String(evaluated));
        return;
      }
    }

    // Default numeric fallback
    const numeric = parseFloat(trimmed);
    if (!isNaN(numeric)) {
      setInputText(String(numeric));
      onPriceChange(String(numeric));
    } else {
      setInputText(rawPrice === '' ? '' : String(rawPrice));
    }
  };

  return (
    <div
      data-member-row-index={index}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'py-2 px-0.5 sm:px-1 transition-all rounded-theme select-none w-full max-w-full overflow-hidden box-border',
        isBeingDragged && 'opacity-30 bg-subtle border-dashed border-ink/40 scale-[0.98]',
        isDragTarget && 'border-t-2 border-t-chili bg-chili/5',
        !isBeingDragged && !isDragTarget && 'hover:bg-subtle/50',
        isPaid && 'bg-emerald-500/5',
      )}
    >
      <div className="flex items-center gap-1 sm:gap-2 w-full min-w-0">
        {/* Drag Handle with Index (Touch & Mouse) */}
        <button
          type="button"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="flex h-9 w-7 shrink-0 items-center justify-center rounded-theme text-ink-muted hover:bg-subtle hover:text-ink cursor-grab active:cursor-grabbing touch-none p-0"
          title={t.split.dragToReorder}
          aria-label={dragAria}
        >
          <GripVertical className="h-3 w-3 mr-0.5 opacity-60 shrink-0" />
          <span className="font-mono text-xs font-bold text-ink-secondary">{personNum}</span>
        </button>

        {/* Member Name */}
        <input
          id={`name-input-${member.id}`}
          type="text"
          aria-label={personNameLabel}
          value={rawName}
          onChange={(e) => onNameChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.currentTarget.select()}
          placeholder={personNameLabel}
          className="min-w-0 flex-1 min-h-[40px] px-2.5 sm:px-3 bg-canvas/80 text-ink text-xs sm:text-sm font-medium border border-hairline rounded-theme focus:outline-none focus:ring-1.5 focus:ring-ink focus:bg-surface transition-colors"
        />

        {/* Original Price / Inline Math Input */}
        <div className="relative w-[84px] sm:w-[96px] shrink-0">
          <input
            id={`price-input-${member.id}`}
            type="text"
            inputMode="decimal"
            aria-label={`${t.split.pricePlaceholder} ${personNum}`}
            value={inputText}
            onChange={(e) => {
              const val = e.target.value;
              setInputText(val);
              // If it's a plain number without operators, update price live
              if (!hasMathOperators(val)) {
                onPriceChange(val);
              }
            }}
            onFocus={(e) => {
              setIsFocused(true);
              e.target.select();
            }}
            onBlur={() => {
              setIsFocused(false);
              handlePriceInputCommit(inputText);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="0"
            title={t.split.inlineMathHint}
            className="w-full min-w-0 min-h-[40px] pl-1.5 pr-5 bg-canvas/80 text-ink font-mono tabular-nums text-xs sm:text-sm font-bold text-right border border-hairline rounded-theme focus:outline-none focus:ring-1.5 focus:ring-ink focus:bg-surface transition-colors"
          />
          <span className="absolute right-1.5 top-2.5 text-xs text-ink-muted pointer-events-none">
            {t.common.baht}
          </span>
        </div>

        {/* Delete Row Button */}
        <button
          type="button"
          onClick={onRemove}
          disabled={totalMembers <= 1}
          className="flex h-9 w-7 shrink-0 items-center justify-center text-ink-muted hover:text-red-600 disabled:opacity-20 transition-colors rounded-theme p-0"
          aria-label={deleteAria}
          title={t.split.deleteRowTitle}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Member Breakdown Subline: Clean, tabular, interactive */}
      {member.totalBeforeDiscount > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 pl-8 sm:pl-9 pr-1 py-1.5 px-2 rounded-lg bg-subtle/50 hover:bg-subtle border border-hairline/60 transition-colors">
          <div className="flex items-center gap-1.5 text-ink-secondary font-mono text-[11px] truncate">
            <span className="font-semibold text-ink-muted">{member.percentShare.toFixed(1)}%</span>

            {/* Shared Breakdown Note */}
            {member.sharedPrice > 0 && (
              <span className="text-ink-muted truncate hidden sm:inline">
                ({t.split.personalShare} {member.originalPrice} + {t.split.sharedPortion} {member.sharedPrice})
              </span>
            )}

            {/* Discount / Surcharge Pill */}
            {member.discountAmount !== 0 && (
              <span
                className={cn(
                  'font-medium truncate',
                  member.discountAmount > 0 ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {member.discountAmount > 0
                  ? `(${t.split.discountPill.replace('{amount}', String(member.discountAmount))})`
                  : `(${t.split.surchargePill.replace('{amount}', String(Math.abs(member.discountAmount)))})`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* Quick Copy Reminder Button */}
            {onCopyReminder && member.finalPrice > 0 && (
              <button
                type="button"
                onClick={onCopyReminder}
                className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                title={t.split.copyIndividualDebt}
                aria-label={t.split.copyIndividualDebt}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Payable Amount Badge */}
            <span
              onClick={() => document.getElementById(`price-input-${member.id}`)?.focus()}
              className={cn(
                'text-xs sm:text-sm font-bold font-mono tabular-nums px-2 py-0.5 rounded-md border border-hairline shadow-2xs cursor-pointer transition-colors',
                isPaid
                  ? 'text-ink-muted line-through bg-canvas'
                  : 'text-chili bg-surface hover:border-chili/40',
              )}
              title={t.split.clickToEditPrice}
            >
              {member.finalPrice} {t.common.baht}
            </span>

            {/* Paid Status Toggle Checkbox */}
            {onTogglePaid && member.finalPrice > 0 && (
              <button
                type="button"
                onClick={onTogglePaid}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all border shrink-0',
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-canvas text-ink-muted border-hairline hover:text-ink hover:bg-subtle',
                )}
                title={isPaid ? t.split.paid : t.split.unpaid}
              >
                {isPaid ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.split.paid}</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-3 w-3 opacity-40" />
                    <span>{t.split.unpaid}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
