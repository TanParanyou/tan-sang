'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Printer, Share2 } from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { useLiff } from '@/features/line/liff-provider';
import type {
  OrderSession,
  OrderSessionSummary,
} from '@/features/order-session/order-session.schema';
import type {
  ReceiptPrintFormat,
  ReceiptViewMode,
} from '@/features/receipt/receipt.schema';
import { formatOrderItemTitle } from '@/server/services/order-calculator.service';
import { Button, Chip } from '@/components/ui';

export function ReceiptClient({
  session,
  summary,
}: {
  session: OrderSession;
  summary: OrderSessionSummary;
}) {
  const { shareBillToLine } = useLiff();
  const [printFormat, setPrintFormat] = useState<ReceiptPrintFormat>('THERMAL_80MM');
  const [viewMode, setViewMode] = useState<ReceiptViewMode>('GROUPED');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2600);
  };

  const handleCopy = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(summary.merchantCopyText);
      notify('คัดลอกข้อความส่งร้านค้าแล้ว!');
    }
  };

  const handleShareLine = async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const res = await shareBillToLine(
      {
        sessionId: session.id,
        storeDisplayName: summary.storeDisplayName,
        totalQuantity: summary.totalItemsCount,
        grandTotalAmount: summary.grandTotalAmount,
        orderUrl: `${origin}/order/${session.id}`,
        receiptUrl: `${origin}/receipt/${session.id}`,
      },
      summary.recipientBreakdowns,
    );
    notify(res.message);
  };

  const formattedDate = new Date(session.closedAt ?? session.createdAt).toLocaleString(
    'th-TH',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  );

  return (
    <div className="min-h-screen bg-canvas pb-16 print:bg-white print:pb-0">
      <DevPersonaBar hostUserId={session.hostUserId} />

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-theme border border-hairline bg-ink px-4 py-2 text-xs font-medium text-surface shadow-theme print:hidden"
        >
          {toast}
        </div>
      )}

      {/* Non-Print Control Toolbar */}
      <div className="border-b border-hairline bg-surface px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
          <Link
            href={`/order/${session.id}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-secondary hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าสั่งอาหาร
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
              คัดลอกส่งร้าน
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleShareLine}
            >
              <Share2 className="h-4 w-4" />
              Share to LINE
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              สั่งพิมพ์ใบเสร็จ
            </Button>
          </div>
        </div>

        {/* Paper Format & View Mode Selectors */}
        <div className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
          <div className="inline-flex gap-1">
            <Chip
              selected={printFormat === 'THERMAL_80MM'}
              onClick={() => setPrintFormat('THERMAL_80MM')}
            >
              สลิป 80mm
            </Chip>
            <Chip
              selected={printFormat === 'A4'}
              onClick={() => setPrintFormat('A4')}
            >
              กระดาษ A4
            </Chip>
          </div>

          <div className="inline-flex gap-1">
            <Chip
              selected={viewMode === 'GROUPED'}
              onClick={() => setViewMode('GROUPED')}
            >
              รวมเมนู + แยกคน
            </Chip>
            <Chip
              selected={viewMode === 'INDIVIDUAL'}
              onClick={() => setViewMode('INDIVIDUAL')}
            >
              เฉพาะแยกรายชื่อ
            </Chip>
          </div>
        </div>
      </div>

      {/* Printable Receipt Sheet */}
      <main className="mx-auto mt-6 px-4 print:mt-0 print:px-0">
        <article
          className={`mx-auto border border-hairline bg-surface p-6 text-ink shadow-theme print:border-0 print:p-0 ${
            printFormat === 'THERMAL_80MM'
              ? 'max-w-[340px] font-mono text-xs print:max-w-[76mm]'
              : 'max-w-2xl text-sm print:max-w-none'
          }`}
        >
          {/* Receipt Header */}
          <div className="border-b border-dashed border-ink pb-3 text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink-secondary">
              TAN-SANG GROUP ORDER
            </p>
            <h1 className="mt-1 text-lg font-bold text-ink">{summary.storeDisplayName}</h1>
            <p className="mt-1 font-mono text-[11px] text-ink-secondary">{formattedDate}</p>
            <p className="font-mono text-[10px] text-ink-muted">
              SESSION: #{session.id.slice(0, 8).toUpperCase()} ({session.status})
            </p>
          </div>

          {/* Section 1: Merchant Grouped Summary */}
          {viewMode === 'GROUPED' && (
            <div className="border-b border-dashed border-ink py-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                1. สรุปรายการอาหารส่งร้าน ({summary.totalItemsCount} จาน)
              </h2>
              <div className="mt-2 space-y-2">
                {summary.groupedItems.map((g, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-ink">
                        {formatOrderItemTitle(g.menuName, g.variantName, g.optionNames)}
                      </p>
                      <p className="text-[11px] text-ink-secondary">
                        สั่งโดย: {g.recipients.map((r) => r.recipientName).join(', ')}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono font-bold tabular-nums text-ink">
                      x {g.totalQuantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Individual Recipient Breakdown */}
          <div className="py-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              2. ยอดแยกตามรายคน ({summary.recipientBreakdowns.length} คน)
            </h2>

            <div className="mt-2 space-y-3">
              {summary.recipientBreakdowns.map((rec) => (
                <div key={rec.recipientName} className="border-t border-dotted border-hairline pt-2">
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>{rec.recipientName}</span>
                    <span className="font-mono tabular-nums">{rec.totalAmount} ฿</span>
                  </div>

                  <ul className="mt-1 space-y-0.5 text-[11px] text-ink-secondary">
                    {rec.items.map((it) => (
                      <li key={it.itemId} className="flex justify-between">
                        <span className="truncate pr-2">
                          • {it.displayTitle} (x{it.quantity})
                        </span>
                        <span className="shrink-0 font-mono tabular-nums">{it.lineTotal} ฿</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Summary */}
          <div className="border-t-2 border-ink pt-3 font-mono">
            <div className="flex items-center justify-between text-base font-bold text-ink">
              <span>ยอดรวมทั้งหมด ({summary.totalItemsCount} จาน)</span>
              <span className="text-lg tabular-nums">{summary.grandTotalAmount} ฿</span>
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-muted">
              *** ขอบคุณที่ใช้บริการทันสั่ง (Tan-Sang) ***
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
