'use client';

import React, { useEffect, useState } from 'react';
import { X, Download, QrCode, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui';
import { generatePromptPayQrDataUrl, parsePromptPayTarget } from '@/lib/utils/promptpay';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';
import { useI18n } from '@/lib/i18n/i18n-context';

export interface PromptPayQrItemOption {
  id: string;
  name: string;
  amount: number;
}

export interface PromptPayQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptPayId: string;
  totalAmount?: number | null;
  items?: PromptPayQrItemOption[];
  modalTitle?: string;
}

export function PromptPayQrModal({
  isOpen,
  onClose,
  promptPayId,
  totalAmount,
  items = [],
  modalTitle,
}: PromptPayQrModalProps) {
  const { t } = useI18n();
  const [selectedItemId, setSelectedItemId] = useState<string>('TOTAL'); // 'TOTAL' | 'NONE' | item.id
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const resolvedTitle = modalTitle ?? t.promptPayModal.title;
  const parsedTarget = parsePromptPayTarget(promptPayId);

  // Calculate targeted amount
  const selectedAmount =
    selectedItemId === 'TOTAL'
      ? totalAmount ?? null
      : selectedItemId === 'NONE'
      ? null
      : items.find((m) => m.id === selectedItemId)?.amount ?? null;

  const selectedItemName =
    selectedItemId === 'TOTAL'
      ? t.split.grandTotal
      : selectedItemId === 'NONE'
      ? t.promptPayModal.unspecifiedAmount
      : items.find((m) => m.id === selectedItemId)?.name ?? '';

  useEffect(() => {
    if (!isOpen || !parsedTarget) {
      setQrDataUrl(null);
      return;
    }

    let isMounted = true;
    generatePromptPayQrDataUrl(promptPayId, selectedAmount, { width: 320 }).then((url) => {
      if (isMounted) {
        setQrDataUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, promptPayId, selectedAmount, parsedTarget]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `PromptPay-${parsedTarget?.formatted || 'QR'}${selectedAmount ? `-${selectedAmount}B` : ''}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPromptPayNumber = async () => {
    if (parsedTarget && navigator.clipboard) {
      await navigator.clipboard.writeText(parsedTarget.sanitized.replace(/^0066/, '0'));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promptpay-qr-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm rounded-theme border border-hairline bg-surface p-5 shadow-theme flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-theme bg-[#003d6b]/10 text-[#003d6b]">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h2 id="promptpay-qr-title" className="text-sm font-bold text-ink">
                {resolvedTitle}
              </h2>
              <p className="text-[11px] text-ink-secondary">{t.promptPayModal.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-theme p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
            aria-label={t.promptPayModal.closeAria}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Code Container styled with official PromptPay banner */}
        <div className="my-4 w-full flex flex-col items-center">
          <div className="w-full max-w-[260px] rounded-theme border-2 border-[#003d6b] bg-white p-3 shadow-sm flex flex-col items-center">
            {/* PromptPay Top Brand Header */}
            <div className="w-full bg-[#003d6b] text-white py-1.5 px-3 rounded-xs text-center font-bold text-xs tracking-wider mb-2">
              {t.promptPayModal.brandBadge}
            </div>

            {/* QR Image */}
            <div className="w-[210px] h-[210px] bg-white flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="PromptPay QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-ink-muted animate-pulse">{t.promptPayModal.generating}</div>
              )}
            </div>

            {/* Target Details */}
            <div className="mt-2 text-center w-full">
              <button
                type="button"
                onClick={handleCopyPromptPayNumber}
                className="group inline-flex items-center gap-1 text-xs font-mono font-bold text-[#003d6b] hover:underline"
                title={t.promptPayModal.copyNumberTitle}
              >
                <span>{parsedTarget?.formatted}</span>
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                )}
              </button>
              {selectedAmount !== null && selectedAmount > 0 && (
                <div className="mt-0.5 text-sm font-bold text-chili font-mono tabular-nums">
                  {formatGrandTotal(selectedAmount, t.common.baht)}
                </div>
              )}
            </div>
          </div>

          {/* Amount Selection Options (if items or total amount available) */}
          {(items.length > 0 || (totalAmount !== null && totalAmount !== undefined && totalAmount > 0)) && (
            <div className="w-full mt-4 space-y-2">
              <label htmlFor="qr-amount-select" className="block text-xs font-semibold text-ink">
                {t.promptPayModal.selectAmountLabel}
              </label>
              <select
                id="qr-amount-select"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full min-h-[40px] px-3 bg-surface text-ink text-xs border border-hairline rounded-theme focus:outline-none focus:ring-1 focus:ring-ink font-medium"
              >
                {totalAmount !== null && totalAmount !== undefined && (
                  <option value="TOTAL">
                    {t.promptPayModal.totalAmountOption.replace('{amount}', formatPrice(totalAmount, { unit: t.common.baht }))}
                  </option>
                )}
                <option value="NONE">{t.promptPayModal.noAmountOption}</option>
                {items.length > 0 && (
                  <optgroup label={t.promptPayModal.individualGroupLabel}>
                    {items
                      .filter((m) => m.amount > 0)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}: {m.amount} {t.common.baht}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              <p className="text-[11px] text-ink-muted text-center">
                {t.promptPayModal.amountSummaryHint
                  .replace('{name}', selectedItemName)
                  .replace('{amount}', selectedAmount !== null ? `${selectedAmount} ${t.common.baht}` : t.promptPayModal.unspecifiedAmount)}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-2 pt-2 border-t border-hairline">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1 text-xs"
          >
            {t.common.close}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex-1 bg-[#003d6b] hover:bg-[#002f52] border-[#003d6b] text-white text-xs font-bold"
          >
            <Download className="h-4 w-4 mr-1.5" />
            {t.promptPayModal.saveQrImage}
          </Button>
        </div>
      </div>
    </div>
  );
}
