'use client';

import React from 'react';
import { BadgePercent, Info, Sparkles, TrendingDown, TrendingUp, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import type { SplitMethod } from '../split-calculator.schema';

interface BillInfoSectionProps {
  deliveryFeeInput: string;
  onDeliveryFeeChange: (val: string) => void;
  discountInput: string;
  onDiscountChange: (val: string) => void;
  splitMethod: SplitMethod;
  onSplitMethodChange: (method: SplitMethod) => void;
  netDiscount: number;
}

export function BillInfoSection({
  deliveryFeeInput,
  onDeliveryFeeChange,
  discountInput,
  onDiscountChange,
  splitMethod,
  onSplitMethodChange,
  netDiscount,
}: BillInfoSectionProps) {
  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Section Title & Mode Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            1. ข้อมูลบิลส่วนกลาง
          </h2>
          <p className="text-sm font-semibold text-ink">ค่าส่งและส่วนลด</p>
        </div>

        {/* Segmented Mode Control */}
        <div className="flex items-center rounded-theme bg-subtle p-0.5 border border-hairline text-xs">
          <button
            type="button"
            onClick={() => onSplitMethodChange('PROPORTIONAL')}
            className={cn(
              'rounded-theme px-2.5 py-1 text-xs font-medium transition-all select-none',
              splitMethod === 'PROPORTIONAL'
                ? 'bg-surface text-ink font-bold shadow-2xs'
                : 'text-ink-secondary hover:text-ink',
            )}
          >
            ตามสัดส่วน %
          </button>
          <button
            type="button"
            onClick={() => onSplitMethodChange('EQUAL')}
            className={cn(
              'rounded-theme px-2.5 py-1 text-xs font-medium transition-all select-none',
              splitMethod === 'EQUAL'
                ? 'bg-surface text-ink font-bold shadow-2xs'
                : 'text-ink-secondary hover:text-ink',
            )}
          >
            หารเท่ากัน
          </button>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
        <div className="min-w-0 w-full">
          <label htmlFor="delivery-fee-input" className="block text-xs font-medium text-ink-secondary mb-1">
            <Truck className="inline h-3.5 w-3.5 mr-1 text-ink-muted" />
            ค่าส่ง (บาท)
          </label>
          <Input
            id="delivery-fee-input"
            type="number"
            min="0"
            step="any"
            containerClassName="w-full min-w-0"
            value={deliveryFeeInput}
            onChange={(e) => onDeliveryFeeChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            placeholder="0"
            className="font-mono tabular-nums text-right font-semibold text-sm h-11 w-full min-w-0"
          />
        </div>
        <div className="min-w-0 w-full">
          <label htmlFor="discount-input" className="block text-xs font-medium text-ink-secondary mb-1">
            <BadgePercent className="inline h-3.5 w-3.5 mr-1 text-chili" />
            ส่วนลดรวม (บาท)
          </label>
          <Input
            id="discount-input"
            type="number"
            min="0"
            step="any"
            containerClassName="w-full min-w-0"
            value={discountInput}
            onChange={(e) => onDiscountChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            placeholder="0"
            className="font-mono tabular-nums text-right font-semibold text-sm h-11 w-full min-w-0 text-chili"
          />
        </div>
      </div>

      {/* Net Discount Banner */}
      <div className="rounded-theme bg-canvas px-3.5 py-2.5 text-xs flex items-center justify-between border border-hairline">
        <span className="text-ink-secondary flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-ink-muted shrink-0" />
          {netDiscount > 0 ? (
            <span>เหลือส่วนลดสุทธิสำหรับเฉลี่ยคืน:</span>
          ) : netDiscount < 0 ? (
            <span>ค่าส่งส่วนเกินที่ต้องช่วยกันจ่ายเพิ่ม:</span>
          ) : (
            <span>ค่าส่งและส่วนลดหักล้างกันพอดี</span>
          )}
        </span>
        <span
          className={cn(
            'font-mono font-bold tabular-nums text-sm',
            netDiscount > 0
              ? 'text-line-accent flex items-center'
              : netDiscount < 0
              ? 'text-red-600 flex items-center'
              : 'text-ink-secondary',
          )}
        >
          {netDiscount > 0 && <TrendingDown className="h-3.5 w-3.5 mr-0.5 inline" />}
          {netDiscount < 0 && <TrendingUp className="h-3.5 w-3.5 mr-0.5 inline" />}
          {Math.abs(netDiscount)} ฿
        </span>
      </div>
    </div>
  );
}
