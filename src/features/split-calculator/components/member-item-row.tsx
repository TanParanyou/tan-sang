'use client';

import React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { SplitMemberResult } from '../split-calculator.schema';

interface MemberItemRowProps {
  index: number;
  totalMembers: number;
  member: SplitMemberResult;
  rawPrice: number | '';
  rawName: string;
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

        {/* Original Price */}
        <div className="relative w-[80px] sm:w-[92px] shrink-0">
          <input
            id={`price-input-${member.id}`}
            type="number"
            min="0"
            step="any"
            aria-label={`${t.split.pricePlaceholder} ${personNum}`}
            value={rawPrice}
            onChange={(e) => onPriceChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            placeholder="0"
            className="w-full min-w-0 min-h-[40px] pl-2 pr-5 bg-canvas/80 text-ink font-mono tabular-nums text-xs sm:text-sm font-bold text-right border border-hairline rounded-theme focus:outline-none focus:ring-1.5 focus:ring-ink focus:bg-surface transition-colors"
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

      {/* Member Breakdown Subline: Clean, tabular, clickable */}
      {member.originalPrice > 0 && (
        <div
          onClick={() => document.getElementById(`price-input-${member.id}`)?.focus()}
          className="mt-1.5 flex items-center justify-between pl-8 sm:pl-9 pr-1 py-1.5 px-2 rounded-lg bg-subtle/50 hover:bg-subtle border border-hairline/60 cursor-pointer group transition-colors"
          title={t.split.clickToEditPrice}
        >
          <div className="flex items-center gap-1.5 text-ink-secondary font-mono text-[11px] truncate">
            <span className="font-semibold text-ink-muted">{member.percentShare.toFixed(1)}%</span>
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

          <div className="flex items-center gap-1.5 font-mono shrink-0 pl-2">
            <span className="text-[11px] font-medium text-ink-secondary">{t.split.finalPayable}:</span>
            <span className="text-xs sm:text-sm font-bold text-chili tabular-nums bg-surface px-2 py-0.5 rounded-md border border-hairline shadow-2xs group-hover:border-chili/40 transition-colors">
              {member.finalPrice} {t.common.baht}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
