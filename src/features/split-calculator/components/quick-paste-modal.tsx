'use client';

import React, { useState } from 'react';
import { X, Clipboard, ArrowDownRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/i18n-context';
import { parseQuickPasteText } from '../split-calculator.service';

interface QuickPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Array<{ name: string; price: number }>) => void;
}

export function QuickPasteModal({ isOpen, onClose, onImport }: QuickPasteModalProps) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!text.trim()) {
      setError(t.split.emptyPasteError);
      return;
    }

    const parsed = parseQuickPasteText(text);
    if (parsed.length === 0) {
      setError(t.split.invalidPasteError);
      return;
    }

    setError(null);
    onImport(parsed);
    setText('');
    onClose();
  };

  const handlePasteExample = () => {
    setText(`1. Tan 79.5\n2. Boss 79.5\n3. Gus 79.5\n4. Fim 59.5\n5. Mean 59.5`);
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-paste-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-theme border border-hairline bg-surface p-5 shadow-theme">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-theme bg-chili/10 text-chili">
              <Clipboard className="h-4 w-4" />
            </div>
            <div>
              <h2 id="quick-paste-title" className="text-base font-bold text-ink">
                {t.split.quickPasteModalTitle}
              </h2>
              <p className="text-xs text-ink-secondary">
                {t.split.quickPasteModalDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-theme p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-4 space-y-3">
          <Textarea
            rows={7}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t.split.quickPastePlaceholder}
            className="font-mono text-xs leading-relaxed"
          />

          {error && (
            <p className="text-xs text-red-600 font-medium animate-shake">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>{t.split.quickPasteFormatHint}</span>
            <button
              type="button"
              onClick={handlePasteExample}
              className="inline-flex items-center text-chili hover:underline font-semibold"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {t.split.trySample}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
          <Button variant="secondary" size="md" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" size="md" onClick={handleImport}>
            <ArrowDownRight className="h-4 w-4 mr-1.5" />
            {t.split.confirmPasteBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}
