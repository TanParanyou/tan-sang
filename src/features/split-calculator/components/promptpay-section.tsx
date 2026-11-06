'use client';

import React from 'react';
import { Check, CreditCard, QrCode } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { PromptPayTargetInfo } from '@/lib/utils/promptpay';

interface PromptPaySectionProps {
  promptPayAccount: string;
  onPromptPayAccountChange: (val: string) => void;
  parsedPromptPay: PromptPayTargetInfo | null;
  onOpenQrModal: () => void;
}

export function PromptPaySection({
  promptPayAccount,
  onPromptPayAccountChange,
  parsedPromptPay,
  onOpenQrModal,
}: PromptPaySectionProps) {
  const { t } = useI18n();

  return (
    <div className="p-3.5 sm:p-5 bg-subtle/40 border-t border-hairline space-y-2 w-full box-border">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <label htmlFor="promptpay-input" className="block text-xs font-bold text-ink">
          <CreditCard className="inline h-3.5 w-3.5 mr-1 text-ink-muted" />
          {t.split.promptPaySectionTitle}
        </label>
        {parsedPromptPay && (
          <span className="text-[11px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="h-3 w-3" />
            {parsedPromptPay.type === 'PHONE' ? t.split.promptPayPhone : t.split.promptPayIdCard} ({parsedPromptPay.formatted})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 w-full min-w-0">
        <Input
          id="promptpay-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          containerClassName="flex-1 min-w-0"
          value={promptPayAccount}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
            onPromptPayAccountChange(digitsOnly);
          }}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.currentTarget.select()}
          placeholder={t.split.promptPayInputPlaceholder}
          className="text-xs font-mono h-10 w-full min-w-0 bg-surface"
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onOpenQrModal}
          className={cn(
            'shrink-0 text-xs px-3 sm:px-3.5 h-10 font-bold transition-all',
            parsedPromptPay
              ? 'bg-[#003d6b] hover:bg-[#002f52] text-white border-[#003d6b] shadow-2xs'
              : 'text-ink-secondary hover:text-ink',
          )}
        >
          <QrCode className="h-4 w-4 mr-1.5" />
          <span>{t.split.createQrBtn}</span>
        </Button>
      </div>
      <p className="text-[11px] text-ink-muted">
        {t.split.promptPayHint}
      </p>
    </div>
  );
}
