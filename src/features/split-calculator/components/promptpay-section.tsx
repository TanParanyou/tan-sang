'use client';

import React from 'react';
import { Check, CreditCard, QrCode } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
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
  return (
    <div className="p-4 sm:p-5 bg-subtle/40 border-t border-hairline space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="promptpay-input" className="block text-xs font-bold text-ink">
          <CreditCard className="inline h-3.5 w-3.5 mr-1 text-ink-muted" />
          บัญชีพร้อมเพย์สำหรับรับโอนเงิน
        </label>
        {parsedPromptPay && (
          <span className="text-[11px] font-mono text-line-accent font-semibold flex items-center gap-1">
            <Check className="h-3 w-3" />
            {parsedPromptPay.type === 'PHONE' ? 'เบอร์พร้อมเพย์' : 'เลขบัตร ปชช.'} ({parsedPromptPay.formatted})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          id="promptpay-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={promptPayAccount}
          onChange={(e) => {
            // กรอกได้เฉพาะตัวเลขเท่านั้น ไม่เกิน 15 หลัก
            const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
            onPromptPayAccountChange(digitsOnly);
          }}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.currentTarget.select()}
          placeholder="กรอกเฉพาะตัวเลข เช่น 0812345678"
          className="text-xs font-mono h-10 flex-1 bg-surface"
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onOpenQrModal}
          className={cn(
            'shrink-0 text-xs px-3.5 h-10 font-bold transition-all',
            parsedPromptPay
              ? 'bg-[#003d6b] hover:bg-[#002f52] text-white border-[#003d6b] shadow-2xs'
              : 'text-ink-secondary hover:text-ink',
          )}
        >
          <QrCode className="h-4 w-4 mr-1.5" />
          <span>สร้าง QR</span>
        </Button>
      </div>
      <p className="text-[11px] text-ink-muted">
        กรอกเฉพาะตัวเลข (เบอร์มือถือ 10 หลัก หรือบัตร ปชช. 13 หลัก) แล้วกด <strong>&ldquo;สร้าง QR&rdquo;</strong> ให้เพื่อนสแกน
      </p>
    </div>
  );
}
