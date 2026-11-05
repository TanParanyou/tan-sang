'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Coins,
  History,
  Printer,
  Share2,
  Receipt,
  FileText,
  Layers,
  Users,
  LayoutList,
  Download,
  Link2,
  X,
  ExternalLink,
} from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { AppNavbar } from '@/components/shared/app-navbar';
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
import { buildReceiptShareText } from '@/server/services/line-flex.service';
import { formatGrandTotal, formatPrice } from '@/lib/utils/price';
import { formatThaiDateTime, formatThaiTime } from '@/lib/utils/date';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export function ReceiptClient({
  session,
  summary,
}: {
  session: OrderSession;
  summary: OrderSessionSummary;
}) {
  const { shareBillToLine } = useLiff();
  const receiptRef = useRef<HTMLElement>(null);
  const [printFormat, setPrintFormat] = useState<ReceiptPrintFormat>('THERMAL_80MM');
  const [viewMode, setViewMode] = useState<ReceiptViewMode>('GROUPED');
  const [toast, setToast] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isKhunThongCopied, setIsKhunThongCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2600);
  };

  const handleCopy = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(summary.merchantCopyText);
        setIsCopied(true);
        notify('คัดลอกข้อความส่งร้านค้าแล้ว!');
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        notify('ไม่สามารถคัดลอกข้อความได้');
      }
    }
  };

  const handleCopyKhunThong = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(summary.khunThongCopyText);
        setIsKhunThongCopied(true);
        notify('คัดลอกยอดแยกรายคนส่งให้ขุนทองแล้ว!');
        setTimeout(() => setIsKhunThongCopied(false), 2000);
      } catch {
        notify('ไม่สามารถคัดลอกข้อความได้');
      }
    }
  };

  const handleShareLine = async () => {
    try {
      setIsSharing(true);
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const slipUrl = `${origin}/receipt/${session.id}/slip?v=2`;
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
    <div className="min-h-screen bg-canvas pb-32 print:bg-white print:pb-0">
      {/* Dev Persona Bar for Host */}
      <div className="print:hidden">
        <DevPersonaBar hostUserId={session.hostUserId} />
        <AppNavbar
          backHref={`/order/${session.id}`}
          backLabel="ห้องสั่งอาหาร"
          title="จัดการบิล & ใบเสร็จ"
          subtitle={summary.storeDisplayName}
          maxWidthClassName="max-w-2xl"
          actions={
            <div className="flex items-center gap-1.5">
              <Link
                href={`/receipt/${session.id}/slip`}
                className="inline-flex min-h-[32px] h-8 items-center gap-1 rounded-theme border border-hairline bg-surface px-2.5 text-xs font-medium text-ink-secondary shadow-2xs transition hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili"
                title="ดูหน้าสลิปใบเสร็จแบบที่แชร์ให้เพื่อน"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
                <span className="hidden sm:inline">ดูหน้าสลิป</span>
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleShareLink}
                className={cn(
                  'h-8 px-2.5 text-xs font-medium transition shadow-2xs',
                  isLinkCopied && 'border-emerald-300 bg-emerald-50 text-emerald-800',
                )}
                title="แชร์ลิงก์สลิปใบเสร็จให้เพื่อน"
              >
                {isLinkCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-3.5 w-3.5 text-ink-muted mr-1" />
                    <span>แชร์สลิป</span>
                  </>
                )}
              </Button>
              <Link
                href="/history"
                className="inline-flex min-h-[32px] h-8 items-center gap-1.5 rounded-theme border border-hairline bg-surface px-2.5 text-xs font-medium text-ink-secondary shadow-2xs transition hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili"
                title="ดูประวัติบิลทั้งหมด"
              >
                <History className="h-3.5 w-3.5 text-ink-muted" />
                <span className="hidden sm:inline">ประวัติบิล</span>
              </Link>
            </div>
          }
        />
      </div>

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-hairline bg-ink/90 px-4 py-2 text-xs font-medium text-surface shadow-lg backdrop-blur print:hidden"
        >
          {toast}
        </div>
      )}

      {/* Non-Print Format & View Mode Control Toolbar for Host */}
      <div className="border-b border-hairline/80 bg-surface px-4 py-2.5 print:hidden">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2.5">
          {/* Format selection */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              ขนาดกระดาษ
            </span>
            <div className="inline-flex rounded-lg border border-hairline bg-subtle/80 p-0.5">
              <button
                type="button"
                onClick={() => setPrintFormat('THERMAL_80MM')}
                className={cn(
                  'inline-flex min-h-[30px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none',
                  printFormat === 'THERMAL_80MM'
                    ? 'bg-surface text-ink shadow-2xs font-semibold'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>สลิป 80mm</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={cn(
                  'inline-flex min-h-[30px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none',
                  printFormat === 'A4'
                    ? 'bg-surface text-ink shadow-2xs font-semibold'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>กระดาษ A4</span>
              </button>
            </div>
          </div>

          {/* View mode selection */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              การแสดงผล
            </span>
            <div className="inline-flex rounded-lg border border-hairline bg-subtle/80 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('GROUPED')}
                className={cn(
                  'inline-flex min-h-[30px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none',
                  viewMode === 'GROUPED'
                    ? 'bg-surface text-ink shadow-2xs font-semibold'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>รวมเมนู</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('INDIVIDUAL')}
                className={cn(
                  'inline-flex min-h-[30px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none',
                  viewMode === 'INDIVIDUAL'
                    ? 'bg-surface text-ink shadow-2xs font-semibold'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                <Users className="h-3.5 w-3.5" />
                <span>แยกรายคน</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ALL')}
                className={cn(
                  'inline-flex min-h-[30px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all select-none',
                  viewMode === 'ALL'
                    ? 'bg-surface text-ink shadow-2xs font-semibold'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span>ทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Sheet */}
      <main className="mx-auto mt-6 px-4 print:mt-0 print:px-0">
        <article
          ref={receiptRef}
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

          {/* Section 1: Merchant Grouped Summary */}
          {(viewMode === 'GROUPED' || viewMode === 'ALL') && (
            <div className="py-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                สรุปรายการอาหารส่งร้าน ({summary.totalItemsCount} จาน)
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
          {(viewMode === 'INDIVIDUAL' || viewMode === 'ALL') && (
            <div
              className={cn(
                'py-3',
                viewMode === 'ALL' && 'border-t border-dashed border-ink pt-3',
              )}
            >
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                ยอดแยกตามรายคน ({summary.recipientBreakdowns.length} คน)
              </h2>

              <div className="mt-2 space-y-3">
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
          )}

          {/* Grand Total Summary */}
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

        {/* KhunThong / Split Bill Helper Card for Host */}
        <div className="mx-auto mt-4 max-w-2xl rounded-theme border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950 shadow-2xs print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Coins className="h-4 w-4 text-amber-600" />
              <span>ส่งต่อยอดเงินให้บอท "ขุนทอง" ช่วยหารหรือทวงเงิน:</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyKhunThong}
              className={cn(
                'h-7 bg-white border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-medium transition',
                isKhunThongCopied && 'border-emerald-300 bg-emerald-50 text-emerald-800',
              )}
            >
              {isKhunThongCopied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600 mr-1" />
                  <span>คัดลอกยอดแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  <span>คัดลอกยอดแยกรายคน</span>
                </>
              )}
            </Button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
            ระบบจัดรูปแบบข้อความแยกยอดรายคนไว้ให้แล้ว สามารถกดคัดลอกแล้วนำไปแปะในกลุ่มแชทที่มีขุนทองเพื่อเปิดบิลหารเงินต่อได้ทันที
          </p>
        </div>
      </main>

      {/* Floating Sticky Bottom Action Dock for Host */}
      <div className="fixed bottom-0 left-0 right-0 z-30 transform-gpu translate-z-0 will-change-transform border-t border-hairline bg-surface px-2 sm:px-4 py-2.5 sm:py-3 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] shadow-theme print:hidden">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between gap-1 sm:gap-2">
          {/* ปุ่มคัดลอกส่งร้าน */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopy}
            className={cn(
              'flex-1 flex-col sm:flex-row items-center justify-center min-h-[46px] sm:min-h-[42px] px-1 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-all',
              isCopied && 'border-emerald-300 bg-emerald-50 text-emerald-800',
            )}
            title="คัดลอกสรุปรายการอาหารสำหรับส่งร้านค้า"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 shrink-0 text-emerald-600 sm:mr-1" />
                <span>คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 shrink-0 text-ink-muted sm:mr-1" />
                <span className="hidden sm:inline">คัดลอกส่งร้าน</span>
                <span className="sm:hidden leading-none mt-0.5">ส่งร้าน</span>
              </>
            )}
          </Button>

          {/* ปุ่มคัดลอกส่งขุนทอง */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopyKhunThong}
            className={cn(
              'flex-1 flex-col sm:flex-row items-center justify-center min-h-[46px] sm:min-h-[42px] px-1 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-all border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100',
              isKhunThongCopied && 'border-emerald-300 bg-emerald-50 text-emerald-800',
            )}
            title="คัดลอกยอดแยกรายคนสำหรับส่งให้ขุนทองช่วยหารบิล"
          >
            {isKhunThongCopied ? (
              <>
                <Check className="h-4 w-4 shrink-0 text-emerald-600 sm:mr-1" />
                <span>คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 shrink-0 text-amber-600 sm:mr-1" />
                <span className="hidden sm:inline">คัดลอกส่งขุนทอง</span>
                <span className="sm:hidden leading-none mt-0.5">ขุนทอง</span>
              </>
            )}
          </Button>

          {/* ปุ่มโหลดภาพ (Download Image) */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownloadImage}
            loading={isDownloadingImage}
            className="flex-1 flex-col sm:flex-row items-center justify-center min-h-[46px] sm:min-h-[42px] px-1 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium hover:border-sky-300 hover:text-sky-700"
            title="บันทึกรูปภาพใบเสร็จลงอุปกรณ์"
          >
            <Download className="h-4 w-4 shrink-0 text-sky-600 sm:mr-1" />
            <span className="hidden sm:inline">โหลดภาพ</span>
            <span className="sm:hidden leading-none mt-0.5">โหลดรูป</span>
          </Button>

          {/* ปุ่มแชร์เข้า LINE */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleShareLine}
            loading={isSharing}
            className="flex-1 flex-col sm:flex-row items-center justify-center min-h-[46px] sm:min-h-[42px] px-1 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium hover:border-emerald-300 hover:text-emerald-700"
            title="แชร์สรุปบิลเข้าห้องแชท LINE"
          >
            <Share2 className="h-4 w-4 shrink-0 text-line sm:mr-1" />
            <span className="hidden sm:inline">แชร์เข้า LINE</span>
            <span className="sm:hidden leading-none mt-0.5">แชร์ LINE</span>
          </Button>

          {/* ปุ่มหลักพิมพ์ใบเสร็จ */}
          <Button
            type="button"
            variant="primary"
            onClick={() => window.print()}
            className="flex-1 flex-col sm:flex-row items-center justify-center min-h-[46px] sm:min-h-[42px] px-1 sm:px-3 py-1 text-[10px] sm:text-xs font-medium shadow-sm transition-all"
            title="พิมพ์ใบเสร็จหรือบันทึกเป็น PDF"
          >
            <Printer className="h-4 w-4 shrink-0 sm:mr-1" />
            <span className="hidden sm:inline">พิมพ์บิล</span>
            <span className="sm:hidden leading-none mt-0.5">พิมพ์</span>
          </Button>
        </div>
      </div>

      {/* Modal Preview Image for Mobile & LINE users */}
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
