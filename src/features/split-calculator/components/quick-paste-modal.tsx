'use client';

import React, { useState } from 'react';
import { X, Clipboard, ArrowDownRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui/input';
import { parseQuickPasteText } from '../split-calculator.service';

interface QuickPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Array<{ name: string; price: number }>) => void;
}

export function QuickPasteModal({ isOpen, onClose, onImport }: QuickPasteModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!text.trim()) {
      setError('กรุณาวางข้อความก่อนกดยืนยัน');
      return;
    }

    const parsed = parseQuickPasteText(text);
    if (parsed.length === 0) {
      setError('ไม่พบข้อมูลชื่อและราคาที่ถูกต้อง กรุณาตรวจสอบรูปแบบข้อความ');
      return;
    }

    setError(null);
    onImport(parsed);
    setText('');
    onClose();
  };

  const handlePasteExample = () => {
    setText(`1. กัส 79.5\n2. ตาล 79.5\n3. เอฟ 79.5\n4. บอส 79.5\n5. โก 59.5`);
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
                วางข้อความด่วน (Quick Paste)
              </h2>
              <p className="text-xs text-ink-secondary">
                คัดลอกจาก Excel, Google Sheets หรือแชท LINE มาวางได้เลย
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-theme p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
            aria-label="ปิดหน้าต่าง"
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
            placeholder={`กัส 79.5\nตาล 79.5\nโก 59.5\nหรือคัดลอกทั้งคอลัมน์จาก Google Sheets มาวางได้ทันที`}
            className="font-mono text-sm"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>รองรับทั้ง: ชื่อ ราคา หรือ ชื่อ, ราคา หรือจากตาราง Excel</span>
            <button
              type="button"
              onClick={handlePasteExample}
              className="inline-flex items-center gap-1 text-chili hover:underline font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              ลองใส่ตัวอย่าง
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
          <Button variant="secondary" size="md" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="primary" size="md" onClick={handleImport} className="bg-chili hover:bg-chili/90 text-white border-chili">
            <ArrowDownRight className="h-4 w-4 mr-1" />
            นำเข้าข้อมูล
          </Button>
        </div>
      </div>
    </div>
  );
}
