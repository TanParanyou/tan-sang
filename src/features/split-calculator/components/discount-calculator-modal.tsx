'use client';

import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, Trash2, ArrowRight, Delete, RotateCcw, ListPlus, Hash } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'keypad' | 'list'>('keypad');

  // Keypad Calculator State
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [historyList, setHistoryList] = useState<Array<{ expr: string; result: number }>>([]);

  // Itemized List State
  const [items, setItems] = useState<DiscountItem[]>([]);

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpen) {
      const parsedInitial = parseFloat(currentDiscount);
      if (!isNaN(parsedInitial) && parsedInitial > 0) {
        setDisplayValue(String(parsedInitial));
        setExpression(String(parsedInitial));
        setItems([{ id: 'init-1', label: '', amount: currentDiscount }]);
      } else {
        setDisplayValue('0');
        setExpression('');
        setItems([
          { id: 'item-1', label: '', amount: '' },
          { id: 'item-2', label: '', amount: '' },
        ]);
      }
      setHistoryList([]);
    }
  }, [isOpen, currentDiscount]);

  if (!isOpen) return null;

  // --- Safe Expression Evaluation ---
  const evaluateExpression = (expr: string): number => {
    try {
      // Clean and sanitize expression: only allow numbers, +, -, *, /, ., and spaces
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d+\-*/. ]+$/.test(sanitized)) return 0;
      
      // Avoid trailing operator before evaluating
      const trimmed = sanitized.replace(/[+\-*/. ]+$/, '');
      if (!trimmed) return 0;

      // Safe arithmetic evaluation using Function without access to context
      const fn = new Function(`return (${trimmed})`);
      const val = Number(fn());
      return isNaN(val) || !isFinite(val) ? 0 : Math.round(val * 100) / 100;
    } catch {
      return 0;
    }
  };

  // --- Keypad Handlers ---
  const handleKeyDigit = (digit: string) => {
    setDisplayValue((prev) => {
      if (prev === '0' || prev === 'Error') return digit;
      return prev + digit;
    });
    setExpression((prev) => {
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const handleKeyOperator = (op: '+' | '-' | '×' | '÷') => {
    // If expression ends with an operator, replace it
    setExpression((prev) => {
      const trimmed = prev.trim();
      if (!trimmed || trimmed === '0') return `0 ${op} `;
      if (/[+\-×÷]$/.test(trimmed)) {
        return trimmed.slice(0, -1) + `${op} `;
      }
      return `${trimmed} ${op} `;
    });
    setDisplayValue('0');
  };

  const handleKeyDecimal = () => {
    setDisplayValue((prev) => {
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
    setExpression((prev) => {
      if (/[+\-×÷ ]$/.test(prev) || !prev) {
        return prev + '0.';
      }
      const parts = prev.split(/[+\-×÷ ]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.includes('.')) return prev;
      return prev + '.';
    });
  };

  const handleKeyClear = () => {
    setDisplayValue('0');
    setExpression('');
  };

  const handleKeyBackspace = () => {
    setDisplayValue((prev) => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
    setExpression((prev) => {
      const trimmed = prev.trimEnd();
      if (trimmed.length <= 1) return '';
      return trimmed.slice(0, -1);
    });
  };

  const handleKeyEquals = () => {
    if (!expression) return;
    const result = evaluateExpression(expression);
    setHistoryList((prev) => [{ expr: expression, result }, ...prev.slice(0, 4)]);
    setDisplayValue(String(result));
    setExpression(String(result));
  };

  const handleQuickAdd = (amount: number) => {
    setExpression((prev) => {
      const trimmed = prev.trim();
      if (!trimmed || trimmed === '0') return String(amount);
      if (/[+\-×÷]$/.test(trimmed)) {
        return `${trimmed} ${amount}`;
      }
      return `${trimmed} + ${amount}`;
    });
    setDisplayValue(String(amount));
  };

  // --- List Handlers ---
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

  const listSum = items.reduce((sum, item) => {
    const val = parseFloat(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Compute final discount based on active tab
  const keypadCurrentResult = expression ? evaluateExpression(expression) : parseFloat(displayValue) || 0;
  const currentTotal = activeTab === 'keypad' ? keypadCurrentResult : listSum;

  const handleConfirm = () => {
    const finalVal = activeTab === 'keypad' ? keypadCurrentResult : listSum;
    onApply(finalVal > 0 ? String(finalVal) : '');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-calc-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-subtle/40">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-theme bg-chili/10 text-chili shrink-0">
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

        {/* Tab Toggle: Keypad vs Itemized List */}
        <div className="px-4 pt-3 pb-1">
          <div className="grid grid-cols-2 p-0.5 rounded-theme bg-subtle border border-hairline text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('keypad')}
              className={`flex items-center justify-center gap-1.5 py-1.5 font-semibold rounded-theme transition-all select-none ${
                activeTab === 'keypad'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <Hash className="h-3.5 w-3.5" />
              <span>{t.split.calcTabKeypad}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center justify-center gap-1.5 py-1.5 font-semibold rounded-theme transition-all select-none ${
                activeTab === 'list'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <ListPlus className="h-3.5 w-3.5" />
              <span>{t.split.calcTabList}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Authentic Calculator Keypad UI */}
        {activeTab === 'keypad' && (
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
            {/* Calculator Display Screen */}
            <div className="rounded-xl bg-canvas border border-hairline p-3 sm:p-4 text-right flex flex-col justify-end shadow-inner min-h-[76px]">
              {expression && (
                <div className="font-mono text-xs text-ink-muted tracking-wide truncate mb-1">
                  {expression}
                </div>
              )}
              <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-chili tracking-tight truncate">
                {keypadCurrentResult.toLocaleString()}
                <span className="text-xs sm:text-sm font-sans font-medium text-ink-muted ml-1.5">
                  {t.common.baht}
                </span>
              </div>
            </div>

            {/* Quick Add Discount Pill Presets */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {[20, 30, 50, 80, 100, 150].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="px-2 py-1 rounded-theme text-xs font-mono font-bold bg-subtle text-ink-secondary hover:bg-neutral-200 active:scale-95 transition-all border border-hairline shrink-0"
                >
                  +{amt}
                </button>
              ))}
            </div>

            {/* 4x4 Calculator Keypad Grid */}
            <div className="grid grid-cols-4 gap-2 pt-1 select-none">
              {/* Row 1: Clear, Backspace, Divide, Multiply */}
              <button
                type="button"
                onClick={handleKeyClear}
                className="h-11 rounded-theme font-bold text-sm bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20"
              >
                C
              </button>
              <button
                type="button"
                onClick={handleKeyBackspace}
                className="h-11 rounded-theme flex items-center justify-center bg-subtle text-ink hover:bg-neutral-200 active:scale-95 transition-all border border-hairline"
                aria-label="Backspace"
              >
                <Delete className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleKeyOperator('÷')}
                className="h-11 rounded-theme font-bold text-base bg-subtle text-chili hover:bg-neutral-200 active:scale-95 transition-all border border-hairline"
              >
                ÷
              </button>
              <button
                type="button"
                onClick={() => handleKeyOperator('×')}
                className="h-11 rounded-theme font-bold text-base bg-subtle text-chili hover:bg-neutral-200 active:scale-95 transition-all border border-hairline"
              >
                ×
              </button>

              {/* Row 2: 7, 8, 9, Minus */}
              <button
                type="button"
                onClick={() => handleKeyDigit('7')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleKeyDigit('8')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleKeyDigit('9')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleKeyOperator('-')}
                className="h-11 rounded-theme font-bold text-base bg-subtle text-chili hover:bg-neutral-200 active:scale-95 transition-all border border-hairline"
              >
                -
              </button>

              {/* Row 3: 4, 5, 6, Plus */}
              <button
                type="button"
                onClick={() => handleKeyDigit('4')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleKeyDigit('5')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleKeyDigit('6')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleKeyOperator('+')}
                className="h-11 rounded-theme font-bold text-lg bg-chili/10 text-chili hover:bg-chili/20 active:scale-95 transition-all border border-chili/30"
              >
                +
              </button>

              {/* Row 4: 1, 2, 3, Equals */}
              <button
                type="button"
                onClick={() => handleKeyDigit('1')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleKeyDigit('2')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleKeyDigit('3')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                3
              </button>
              <button
                type="button"
                onClick={handleKeyEquals}
                className="h-24 row-span-2 rounded-theme font-bold text-lg bg-chili text-white hover:bg-neutral-800 active:scale-95 transition-all shadow-xs flex items-center justify-center"
              >
                =
              </button>

              {/* Row 5: 0, 00, Decimal */}
              <button
                type="button"
                onClick={() => handleKeyDigit('0')}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeyDigit('00')}
                className="h-11 rounded-theme font-bold text-sm bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                00
              </button>
              <button
                type="button"
                onClick={handleKeyDecimal}
                className="h-11 rounded-theme font-bold text-base bg-surface text-ink hover:bg-subtle active:scale-95 transition-all border border-hairline shadow-2xs"
              >
                .
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Itemized List Mode */}
        {activeTab === 'list' && (
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
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
          </div>
        )}

        {/* Footer with total and confirm */}
        <div className="p-3.5 border-t border-hairline bg-subtle/40 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-ink-muted font-medium">{t.split.totalSumDiscount}</span>
            <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-chili">
              {currentTotal.toLocaleString()} {t.common.baht}
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
