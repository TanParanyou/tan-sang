'use client';

import React, { useRef, useState } from 'react';
import {
  Download,
  Printer,
  Share2,
  Check,
  Link2,
  X,
} from 'lucide-react';
import { useLiff } from '@/features/line/liff-provider';
import type {
  OrderSession,
  OrderSessionSummary,
} from '@/features/order-session/order-session.schema';
import { formatOrderItemTitle } from '@/server/services/order-calculator.service';
import { buildReceiptShareText } from '@/server/services/line-flex.service';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';
import { formatThaiDateTime, formatThaiTime } from '@/lib/utils/date';
import { Button } from '@/components/ui';

export interface ReceiptSlipClientProps {
  session: OrderSession;
  summary: OrderSessionSummary;
}

export function ReceiptSlipClient({ session, summary }: ReceiptSlipClientProps) {
  const { shareBillToLine } = useLiff();
  const receiptRef = useRef<HTMLElement>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2600);
  };

  const handleShareLine = async () => {
    try {
      setIsSharing(true);
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const slipUrl = `${origin}/receipt/${session.id}/slip`;
      const res = await shareBillToLine(
        {
          sessionId: session.id,
          storeDisplayName: summary.storeDisplayName,
          totalQuantity: summary.totalItemsCount,
          grandTotalAmount: summary.grandTotalAmount,
          orderUrl: `${origin}/order/${session.id}`,
          receiptUrl: slipUrl,
        },
        summary.recipientBreakdowns,
      );
      notify(res.message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareLink = async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const slipUrl = `${origin}/receipt/${session.id}/slip`;
    const shareText = buildReceiptShareText({
      sessionId: session.id,
      storeDisplayName: summary.storeDisplayName,
      totalQuantity: summary.totalItemsCount,
      grandTotalAmount: summary.grandTotalAmount,
      orderUrl: `${origin}/order/${session.id}`,
      receiptUrl: slipUrl,
    });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `ใบเสร็จ ${summary.storeDisplayName} | ตาลสั่ง`,
          text: shareText,
          url: slipUrl,
        });
        notify('แชร์สลิปใบเสร็จแล้ว!');
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(slipUrl);
        setIsLinkCopied(true);
        notify('คัดลอกลิงก์สลิปใบเสร็จแล้ว!');
        setTimeout(() => setIsLinkCopied(false), 2000);
      } catch {
        notify('ไม่สามารถคัดลอกลิงก์ได้');
      }
    }
  };

  const handleDownloadImage = async () => {
    const target = receiptRef.current;
    if (!target) return;
    try {
      setIsDownloadingImage(true);
      const { toPng } = await import('html-to-image');

      // Use exact dimensions of target element without window margins
      const width = Math.max(target.offsetWidth, target.scrollWidth);
      const height = Math.max(target.offsetHeight, target.scrollHeight);

      const dataUrl = await toPng(target, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        width,
        height,
        style: {
          margin: '0',
          transform: 'none',
          maxWidth: 'none',
          maxHeight: 'none',
          left: '0',
          top: '0',
          boxShadow: 'none',
        },
      });

      const fileName = `receipt-${session.id.slice(0, 8)}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setPreviewImageUrl(dataUrl);
      notify('สร้างรูปภาพใบเสร็จเรียบร้อยแล้ว!');
    } catch (err) {
      console.error('Download receipt image failed:', err);
      notify('ไม่สามารถสร้างรูปภาพใบเสร็จได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const formattedDate = formatThaiDateTime(session.closedAt ?? session.createdAt);

  return (
    <div className="min-h-screen bg-canvas pb-28 print:bg-white print:pb-0">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-hairline bg-ink/90 px-4 py-2 text-xs font-medium text-surface shadow-lg backdrop-blur print:hidden"
        >
          {toast}
        </div>
      )}

      {/* Top Bar: Minimal and clean branding */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface/95 px-4 py-3 backdrop-blur shadow-2xs print:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-chili text-white font-bold text-xs shadow-2xs">
              ต
            </span>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-ink leading-tight">ตาลสั่ง • สลิปใบเสร็จ</h1>
              <p className="text-[11px] text-ink-muted leading-tight truncate max-w-[170px] sm:max-w-xs">
                {summary.storeDisplayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDownloadImage}
              loading={isDownloadingImage}
              className="h-8 px-2.5 text-xs font-medium text-sky-700 hover:border-sky-300"
              title="บันทึกรูปภาพใบเสร็จลงอุปกรณ์"
            >
              <Download className="mr-1 h-3.5 w-3.5 text-sky-600" />
              <span>โหลดรูป</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleShareLink}
              className="h-8 px-2.5 text-xs font-medium"
              title="แชร์ลิงก์ใบเสร็จ"
            >
              {isLinkCopied ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Share2 className="mr-1 h-3.5 w-3.5 text-ink-muted" />
                  <span>แชร์</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content: Pure Receipt Slip Only */}
      <main className="mx-auto mt-6 px-4 print:mt-0 print:px-0">
        <article
          ref={receiptRef}
          className="mx-auto max-w-[340px] border border-hairline bg-surface p-6 font-mono text-xs text-ink shadow-theme print:border-0 print:p-0 print:max-w-[76mm]"
        >
          {/* Slip Header */}
          <div className="border-b border-dashed border-ink pb-3 text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink-secondary">
              TAN-SANG GROUP ORDER
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink font-sans">{summary.storeDisplayName}</h2>
            <div className="mt-1 space-y-0.5 font-mono text-[11px] text-ink-secondary">
              <p>วัน-เวลา: {formattedDate}</p>
              {session.closedAt && (
                <p className="text-[10px] text-ink-muted">
                  (เปิดรับ: {formatThaiTime(session.createdAt)} • ปิดรับ: {formatThaiTime(session.closedAt)})
                </p>
              )}
            </div>
            <p className="mt-1 font-mono text-[10px] text-ink-muted">
              SESSION: #{session.id.slice(0, 8).toUpperCase()} ({session.status})
            </p>
          </div>

          {/* Section 1: Summary of all items */}
          <div className="py-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              สรุปรายการอาหาร ({summary.totalItemsCount} จาน)
            </h3>
            <div className="mt-2 space-y-2">
              {summary.groupedItems.map((g, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2">
                  <div className="flex-1 font-sans">
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

          {/* Section 2: Individual Recipient Breakdown */}
          <div className="border-t border-dashed border-ink py-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              ยอดแยกตามรายคน ({summary.recipientBreakdowns.length} คน)
            </h3>

            <div className="mt-2 space-y-3 font-sans">
              {summary.recipientBreakdowns.map((rec) => (
                <div key={rec.recipientName} className="border-t border-dotted border-hairline pt-2">
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>{rec.recipientName}</span>
                    <span className="font-mono tabular-nums">
                      {formatPrice(rec.totalAmount, {
                        isGrandTotalZero: summary.grandTotalAmount === 0,
                      })}
                    </span>
                  </div>

                  <ul className="mt-1 space-y-0.5 text-[11px] text-ink-secondary">
                    {rec.items.map((it) => (
                      <li key={it.itemId} className="flex justify-between">
                        <span className="truncate pr-2">
                          • {it.displayTitle} (x{it.quantity})
                        </span>
                        <span className="shrink-0 font-mono tabular-nums">
                          {formatPrice(it.lineTotal, {
                            isGrandTotalZero: summary.grandTotalAmount === 0,
                            unpricedFallback: '-',
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="border-t-2 border-ink pt-3 font-mono">
            <div className="flex items-center justify-between text-base font-bold text-ink">
              <span>ยอดรวมทั้งหมด ({summary.totalItemsCount} จาน)</span>
              {formatGrandTotal(summary.grandTotalAmount) ? (
                <span className="text-lg tabular-nums">
                  {formatGrandTotal(summary.grandTotalAmount)}
                </span>
              ) : (
                <span className="text-sm font-normal text-ink-secondary">รอร้านคิดเงิน</span>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-muted">
              *** ขอบคุณที่ใช้บริการทันสั่ง (Tan-Sang) ***
            </p>
          </div>
        </article>
      </main>

      {/* Floating Bottom Dock: Simple and focused on downloading/printing */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 transform-gpu translate-z-0 will-change-transform border-t border-hairline bg-surface/95 px-4 py-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] backdrop-blur shadow-theme print:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleDownloadImage}
            loading={isDownloadingImage}
            className="flex-1 min-h-[42px] text-xs font-semibold shadow-sm"
            title="บันทึกรูปภาพใบเสร็จลงอุปกรณ์"
          >
            <Download className="mr-1.5 h-4 w-4" />
            <span>บันทึกรูปภาพใบเสร็จ</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleShareLine}
            loading={isSharing}
            className="min-h-[42px] px-3 text-xs font-medium hover:border-emerald-300 hover:text-emerald-700"
            title="แชร์สรุปบิลเข้าห้องแชท LINE"
          >
            <Share2 className="h-4 w-4 text-line sm:mr-1" />
            <span className="hidden sm:inline">แชร์ LINE</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.print()}
            className="min-h-[42px] px-3 text-xs font-medium"
            title="สั่งพิมพ์หรือบันทึกเป็น PDF"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">พิมพ์</span>
          </Button>
        </div>
      </footer>

      {/* Image Preview Modal with uncropped display and mobile guidance */}
      {previewImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200 print:hidden"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl border border-hairline bg-surface p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-hairline shrink-0">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-chili" />
                <h3 className="text-sm font-bold text-ink">รูปภาพใบเสร็จ</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="rounded-full p-1 text-ink-muted hover:bg-subtle hover:text-ink focus-visible:outline-none"
                aria-label="ปิด"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900 leading-relaxed shrink-0">
              💡 <strong>สำหรับผู้ใช้มือถือ & LINE:</strong> แตะค้างที่รูปภาพด้านล่างเพื่อเลือก &quot;บันทึกรูปภาพ&quot; (Save Image) ลงในอัลบั้มรูปได้เลยครับ
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-hairline/80 bg-subtle p-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImageUrl}
                alt="รูปภาพใบเสร็จ"
                className="mx-auto block h-auto w-full max-w-[340px] rounded border border-hairline bg-white shadow-md"
              />
            </div>

            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-hairline shrink-0">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `receipt-${session.id.slice(0, 8)}.png`;
                  link.href = previewImageUrl;
                  link.click();
                  notify('ดาวน์โหลดรูปภาพแล้ว');
                }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                ดาวน์โหลดอีกครั้ง
              </Button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={async () => {
                    try {
                      const res = await fetch(previewImageUrl);
                      const blob = await res.blob();
                      const file = new File(
                        [blob],
                        `receipt-${session.id.slice(0, 8)}.png`,
                        { type: 'image/png' },
                      );
                      if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                          files: [file],
                          title: `ใบเสร็จ-${summary.storeDisplayName}`,
                        });
                        return;
                      }
                    } catch {
                      // ignore abort
                    }
                  }}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5 text-ink-muted" />
                  แชร์รูปภาพ
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => setPreviewImageUrl(null)}
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
