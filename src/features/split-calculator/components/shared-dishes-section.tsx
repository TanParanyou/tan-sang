'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, Plus, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useI18n } from '@/lib/i18n/i18n-context';
import { evaluateSimpleMath, hasMathOperators } from '@/lib/utils/math-expression';

export interface SharedDishDraft {
  id: string;
  name: string;
  price: number | '';
  memberIds: string[]; // empty array = shared by all
}

interface SharedDishesSectionProps {
  sharedItems: SharedDishDraft[];
  allMembers: Array<{ id: string; name: string }>;
  onAddSharedDish: () => void;
  onRemoveSharedDish: (id: string) => void;
  onUpdateSharedDish: (
    id: string,
    field: 'name' | 'price' | 'memberIds',
    value: string | number | '' | string[],
  ) => void;
}

export function SharedDishesSection({
  sharedItems,
  allMembers,
  onAddSharedDish,
  onRemoveSharedDish,
  onUpdateSharedDish,
}: SharedDishesSectionProps) {
  const { t } = useI18n();
  // If there are shared items, expand by default; if empty, collapse by default
  const [isExpanded, setIsExpanded] = useState(sharedItems.length > 0);

  const sharedTotal = sharedItems.reduce(
    (sum, it) => sum + (typeof it.price === 'number' ? it.price : 0),
    0,
  );

  const toggleMemberInclusion = (dish: SharedDishDraft, memberId: string) => {
    if (!dish.memberIds || dish.memberIds.length === 0) {
      const activeIds = allMembers.map((m) => m.id);
      const remaining = activeIds.filter((id) => id !== memberId);
      onUpdateSharedDish(dish.id, 'memberIds', remaining.length > 0 ? remaining : [memberId]);
      return;
    }

    const exists = dish.memberIds.includes(memberId);
    let next: string[];
    if (exists) {
      next = dish.memberIds.filter((id) => id !== memberId);
    } else {
      next = [...dish.memberIds, memberId];
    }

    if (next.length === allMembers.length || next.length === 0) {
      onUpdateSharedDish(dish.id, 'memberIds', []);
    } else {
      onUpdateSharedDish(dish.id, 'memberIds', next);
    }
  };

  const handlePriceCommit = (dishId: string, val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      onUpdateSharedDish(dishId, 'price', '');
      return;
    }
    if (hasMathOperators(trimmed)) {
      const evaluated = evaluateSimpleMath(trimmed);
      if (evaluated !== null && !isNaN(evaluated)) {
        onUpdateSharedDish(dishId, 'price', evaluated);
        return;
      }
    }
    const num = parseFloat(trimmed);
    onUpdateSharedDish(dishId, 'price', !isNaN(num) ? num : '');
  };

  return (
    <section aria-labelledby="shared-dishes-heading" className="w-full box-border border-b border-hairline bg-canvas/30">
      {/* Compact Collapsible Header */}
      <div
        onClick={() => {
          if (sharedItems.length === 0 && !isExpanded) {
            setIsExpanded(true);
            onAddSharedDish();
          } else {
            setIsExpanded((prev) => !prev);
          }
        }}
        className="flex items-center justify-between p-3 sm:px-4 cursor-pointer select-none hover:bg-subtle/40 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chili/10 text-chili shrink-0">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            {sharedItems.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink">
                  {t.split.sharedDishesSummary
                    .replace('{count}', String(sharedItems.length))
                    .replace('{total}', String(sharedTotal))}
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-ink-secondary">
                {t.split.sharedDishesSection}
              </span>
            )}
            <p className="text-[11px] text-ink-muted truncate">
              {sharedItems.length === 0
                ? t.split.sharedDishesEmptyHint
                : isExpanded
                ? t.split.collapseDetails
                : t.split.expandDetails}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {sharedItems.length === 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                onAddSharedDish();
              }}
              className="inline-flex min-h-[30px] items-center gap-1 rounded-theme px-2.5 text-xs font-semibold text-chili bg-chili/10 hover:bg-chili/15 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.split.addSharedDish}</span>
            </button>
          )}

          {sharedItems.length > 0 && (
            <div className="p-1 rounded-theme text-ink-muted">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Shared Dishes List */}
      {isExpanded && sharedItems.length > 0 && (
        <div className="p-3 sm:px-4 pt-1 pb-3 space-y-2.5 border-t border-hairline/60 bg-surface/50">
          {sharedItems.map((dish, dIdx) => {
            const numericPrice = typeof dish.price === 'number' ? dish.price : 0;
            const isAll = !dish.memberIds || dish.memberIds.length === 0;
            const participantCount = isAll ? allMembers.length : dish.memberIds.length;
            const costPerPerson =
              numericPrice > 0 && participantCount > 0
                ? Math.round(numericPrice / participantCount)
                : 0;

            return (
              <div
                key={dish.id}
                className="p-2.5 rounded-lg border border-hairline bg-surface space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-ink-muted w-4 shrink-0">
                    {dIdx + 1}.
                  </span>

                  {/* Dish Name */}
                  <input
                    type="text"
                    value={dish.name}
                    onChange={(e) => onUpdateSharedDish(dish.id, 'name', e.target.value)}
                    placeholder={t.split.sharedDishNamePlaceholder}
                    className="min-w-0 flex-1 min-h-[38px] px-2.5 bg-canvas/60 text-ink text-xs font-medium border border-hairline rounded-theme focus:outline-none focus:ring-1.5 focus:ring-ink"
                  />

                  {/* Price Input */}
                  <div className="relative w-[76px] sm:w-[88px] shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      defaultValue={dish.price === '' ? '' : String(dish.price)}
                      key={`price-${dish.id}-${dish.price}`}
                      onBlur={(e) => handlePriceCommit(dish.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="0"
                      title={t.split.inlineMathHint}
                      className="w-full min-h-[38px] pl-1.5 pr-4 bg-canvas/60 text-ink font-mono tabular-nums text-xs font-bold text-right border border-hairline rounded-theme focus:outline-none focus:ring-1.5 focus:ring-ink"
                    />
                    <span className="absolute right-1 top-2.5 text-xs text-ink-muted pointer-events-none">
                      {t.common.baht}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveSharedDish(dish.id)}
                    className="h-8 w-7 flex items-center justify-center text-ink-muted hover:text-red-600 rounded-theme transition-colors shrink-0 p-0"
                    title={t.split.deleteSharedDish}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Member Selection Chips & Cost Per Person */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 pl-6">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[11px] text-ink-muted font-medium mr-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      หาร:
                    </span>

                    {/* Toggle All Button */}
                    <button
                      type="button"
                      onClick={() => onUpdateSharedDish(dish.id, 'memberIds', [])}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-semibold border transition-all',
                        isAll
                          ? 'bg-ink text-surface border-ink'
                          : 'bg-surface text-ink-secondary border-hairline hover:bg-subtle',
                      )}
                    >
                      {t.split.sharedByAll}
                    </button>

                    {/* Individual Member Chips */}
                    {allMembers.map((m) => {
                      const isIncluded = isAll || dish.memberIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMemberInclusion(dish, m.id)}
                          className={cn(
                            'px-2 py-0.5 rounded text-[11px] font-medium border transition-all',
                            isIncluded && !isAll
                              ? 'bg-chili/10 text-chili border-chili/30 font-semibold'
                              : isAll
                              ? 'bg-subtle/40 text-ink-secondary border-hairline'
                              : 'bg-surface text-ink-muted border-hairline/60 line-through opacity-60 hover:opacity-100',
                          )}
                        >
                          {m.name || 'เพื่อน'}
                        </button>
                      );
                    })}
                  </div>

                  {numericPrice > 0 && (
                    <div className="font-mono text-[11px] font-bold text-chili bg-canvas px-2 py-0.5 rounded border border-hairline ml-auto">
                      {t.split.sharedCostPerPerson.replace('{amount}', String(costPerPerson))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={onAddSharedDish}
            className="w-full min-h-[34px] flex items-center justify-center gap-1.5 rounded-theme border border-dashed border-hairline text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-subtle transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.split.addSharedDish}
          </button>
        </div>
      )}
    </section>
  );
}
