'use client';

import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/i18n-context';

interface DiscountCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDiscount: string;
  onApply: (totalDiscount: string) => void;
}

interface DiscountItem {
  id: string;
  label: string;
  amount: string;
}

export function DiscountCalculatorModal({
  isOpen,
  onClose,
  currentDiscount,
  onApply,
}: DiscountCalculatorModalProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<DiscountItem[]>([]);

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpen) {
      const parsedInitial = parseFloat(currentDiscount);
      if (!isNaN(parsedInitial) && parsedInitial > 0) {
        setItems([{ id: 'init-1', label: '', amount: currentDiscount }]);
      } else {
        setItems([
          { id: 'item-1', label: '', amount: '' },
          { id: 'item-2', label: '', amount: '' },
        ]);
      }
    }
  }, [isOpen, currentDiscount]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, label: '', amount: '' },
    ]);
  };

  const handleUpdateItem = (id: string, field: 'label' | 'amount', value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === 'amount') {
            // Keep numbers or decimals
            const cleanVal = value.replace(/[^0-9.]/g, '');
            return { ...item, amount: cleanVal };
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalSum = items.reduce((sum, item) => {
    const val = parseFloat(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleConfirm = () => {
    onApply(totalSum > 0 ? String(totalSum) : '');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-calc-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-subtle/40">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-theme bg-chili/10 text-chili">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h2 id="discount-calc-title" className="text-sm font-bold text-ink">
                {t.split.discountCalcTitle}
              </h2>
              <p className="text-[11px] text-ink-muted">
                {t.split.discountCalcSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-theme p-1.5 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
            aria-label={t.common.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List of discount entries */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="w-5 text-center font-mono text-xs text-ink-muted shrink-0">
                  {idx + 1}.
                </span>
                <Input
                  type="text"
                  placeholder={t.split.discountItemNamePlaceholder}
                  value={item.label}
                  onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
                  containerClassName="flex-1 min-w-0"
                  className="text-xs h-9 bg-canvas"
                />
                <div className="relative w-28 sm:w-32 shrink-0">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={item.amount}
                    onChange={(e) => handleUpdateItem(item.id, 'amount', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                    containerClassName="w-full"
                    className="text-xs font-mono tabular-nums text-right font-bold text-chili h-9 pr-6 bg-canvas"
                  />
                  <span className="absolute right-2 top-2 text-xs text-ink-muted pointer-events-none">
                    ฿
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="h-8 w-8 flex items-center justify-center text-ink-muted hover:text-red-600 rounded-theme transition-colors shrink-0"
                  title={t.common.delete}
                  aria-label={t.common.delete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddItem}
            className="w-full mt-2 border-dashed border-hairline text-xs text-ink-secondary hover:text-ink hover:border-ink py-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t.split.addDiscountItem}
          </Button>

          {/* Quick preset buttons */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-ink-muted block mb-1.5">
              {t.split.quickAddDiscount}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[20, 30, 50, 80, 100, 150].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setItems((prev) => [
                      ...prev.filter((i) => i.amount !== ''),
                      {
                        id: `preset-${Date.now()}-${amt}`,
                        label: `${t.split.discount} ${amt}฿`,
                        amount: String(amt),
                      },
                    ]);
                  }}
                  className="px-2.5 py-1 rounded-theme text-xs font-mono font-medium bg-subtle text-ink-secondary hover:bg-neutral-200 hover:text-ink transition-colors border border-hairline"
                >
                  +{amt}฿
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with total and confirm */}
        <div className="p-4 border-t border-hairline bg-subtle/40 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-ink-muted font-medium">{t.split.totalSumDiscount}</span>
            <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-chili">
              {totalSum.toLocaleString()} {t.common.baht}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs px-3 min-h-[38px]"
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              className="text-xs px-4 min-h-[38px] bg-chili border-chili hover:bg-neutral-800 text-white font-bold"
            >
              <span>{t.split.applyDiscount}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
