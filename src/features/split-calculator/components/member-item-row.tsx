'use client';

import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  Trash2,
  Copy,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useI18n } from '@/lib/i18n/i18n-context';
import { evaluateSimpleMath, hasMathOperators } from '@/lib/utils/math-expression';
import type { SplitMemberResult } from '../split-calculator.schema';

interface MemberItemRowProps {
  index: number;
  totalMembers: number;
  member: SplitMemberResult;
  rawPrice: number | string;
  rawName: string;
  isPaid?: boolean;
  forceExpanded?: boolean;
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
  forceExpanded = false,
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

  // Local state for individual row expansion (ดูข้อมูลได้เมื่อแตะ)
  const [isExpanded, setIsExpanded] = useState(false);
  const showDetails = forceExpanded || isExpanded;

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
        'py-2.5 px-1 transition-all rounded-theme select-none w-full max-w-full overflow-hidden box-border',
        isBeingDragged && 'opacity-30 bg-subtle border-dashed border-ink/40 scale-[0.98]',
        isDragTarget && 'border-t-2 border-t-chili bg-chili/5',
        !isBeingDragged && !isDragTarget && 'hover:bg-subtle/30',
        isPaid && 'bg-emerald-500/5',
      )}
    >
      {/* Line 1: Main Inputs with Wide, Uncramped Breathing Room */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
        {/* Drag Handle with Index */}
        <button
          type="button"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="flex h-9 w-6 sm:w-7 shrink-0 items-center justify-center rounded-theme text-ink-muted hover:bg-subtle hover:text-ink cursor-grab active:cursor-grabbing touch-none p-0"
          title={t.split.dragToReorder}
          aria-label={dragAria}
        >
          <GripVertical className="h-3 w-3 mr-0.5 opacity-50 shrink-0" />
          <span className="font-mono text-xs font-bold text-ink-secondary">{personNum}</span>
        </button>

        {/* Member Name (Flex-1: Takes ALL available space so it never squashes) */}
        <input
          id={`name-input-${member.id}`}
          type="text"
          aria-label={personNameLabel}
          value={rawName}
          onChange={(e) => onNameChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.currentTarget.select()}
          placeholder={personNameLabel}
          className="min-w-0 flex-1 min-h-[42px] px-3 bg-canvas/70 text-ink text-xs sm:text-sm font-medium border border-hairline rounded-theme focus:outline-none focus:ring-1.5 focus:ring-ink focus:bg-surface transition-colors"
        />

        {/* Original Price / Math Input */}
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
            className="w-full min-w-0 min-h-[42px] pl-2 pr-5 bg-canvas/70 text-ink font-mono tabular-nums text-xs sm:text-sm font-bold text-right border border-hairline rounded-theme focus:outline-none focus:ring-1.5 focus:ring-ink focus:bg-surface transition-colors"
          />
          <span className="absolute right-1.5 top-3 text-xs text-ink-muted pointer-events-none">
            {t.common.baht}
          </span>
        </div>

        {/* Delete Row Button */}
        <button
          type="button"
          onClick={onRemove}
          disabled={totalMembers <= 1}
          className="flex h-9 w-6 sm:w-7 shrink-0 items-center justify-center text-ink-muted hover:text-red-600 disabled:opacity-20 transition-colors rounded-theme p-0"
          aria-label={deleteAria}
          title={t.split.deleteRowTitle}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Line 2: Prominent Net Payable Bar (Under name, spacious, tap to view details) */}
      {member.totalBeforeDiscount > 0 && (
        <div className="mt-1.5 ml-7 sm:ml-9 flex items-center justify-between gap-2 pr-1">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1.5 py-1 px-2.5 rounded-theme border font-mono tabular-nums text-xs transition-all select-none',
              isPaid
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : showDetails
                ? 'bg-ink text-surface border-ink shadow-2xs font-bold'
                : 'bg-chili/10 text-chili border-chili/30 hover:bg-chili/20 font-bold',
            )}
            title={showDetails ? t.split.collapseDetails : t.split.expandDetails}
          >
            <span className="font-sans font-semibold text-[11px] opacity-80">{t.split.netToPay}:</span>
            <span className={cn('font-bold text-xs sm:text-sm', isPaid && 'line-through opacity-75')}>
              {member.finalPrice} {t.common.baht}
            </span>
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5 opacity-70 ml-0.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 opacity-70 ml-0.5 shrink-0" />
            )}
          </button>

          {/* Quick Payment Status Toggle Checkbox */}
          {onTogglePaid && (
            <button
              type="button"
              onClick={onTogglePaid}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all shrink-0',
                isPaid
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-canvas text-ink-muted border-hairline hover:text-ink hover:bg-subtle',
              )}
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
      )}

      {/* Expanded Details Drawer (เมื่อกดดูข้อมูล หรือกดดูทุกคน) */}
      {showDetails && member.totalBeforeDiscount > 0 && (
        <div className="mt-2 ml-7 sm:ml-9 mr-1 p-2.5 rounded-lg bg-subtle/80 border border-hairline space-y-2 text-xs transition-all">
          {/* Breakdown Math */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-ink-secondary font-mono text-[11px] pb-1.5 border-b border-hairline/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>
                {t.split.originalDishPrice}: <strong className="text-ink">{member.originalPrice}</strong> ฿
              </span>
              {member.sharedPrice > 0 && (
                <span>
                  + {t.split.sharedPortion}: <strong className="text-chili">{member.sharedPrice}</strong> ฿
                </span>
              )}
              {member.discountAmount !== 0 && (
                <span
                  className={cn(
                    'font-semibold',
                    member.discountAmount > 0 ? 'text-emerald-600' : 'text-red-600',
                  )}
                >
                  {member.discountAmount > 0
                    ? `(-${member.discountAmount} ฿)`
                    : `(+${Math.abs(member.discountAmount)} ฿)`}
                </span>
              )}
            </div>
            <div className="font-semibold text-ink-muted">
              สัดส่วน {member.percentShare.toFixed(1)}%
            </div>
          </div>

          {/* Quick Copy Reminder */}
          {onCopyReminder && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={onCopyReminder}
                className="inline-flex min-h-[30px] items-center gap-1.5 px-2.5 py-1 rounded-theme text-xs font-semibold text-ink-secondary bg-surface border border-hairline hover:text-ink hover:bg-canvas transition-colors"
                title={t.split.copyIndividualDebt}
              >
                <Copy className="h-3.5 w-3.5 text-ink-muted" />
                <span>{t.split.copyIndividualDebt}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
