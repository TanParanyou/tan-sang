import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className,
  disabled,
}: QuantityStepperProps) {
  const handleDec = () => {
    if (value > min) onChange(value - 1);
  };

  const handleInc = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center border border-hairline bg-surface rounded-theme select-none',
        disabled && 'opacity-40 pointer-events-none',
        className,
      )}
    >
      <button
        type="button"
        onClick={handleDec}
        disabled={value <= min || disabled}
        aria-label="Decrease quantity"
        className="flex h-[40px] w-[40px] items-center justify-center text-ink hover:bg-subtle disabled:opacity-20 disabled:hover:bg-transparent"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="flex h-[40px] min-w-[48px] items-center justify-center border-x border-hairline font-mono text-base font-semibold tabular-nums text-ink">
        {value}
      </span>

      <button
        type="button"
        onClick={handleInc}
        disabled={value >= max || disabled}
        aria-label="Increase quantity"
        className="flex h-[40px] w-[40px] items-center justify-center text-ink hover:bg-subtle disabled:opacity-20 disabled:hover:bg-transparent"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
