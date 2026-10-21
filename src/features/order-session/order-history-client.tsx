'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Clock,
  ExternalLink,
  History,
  Lock,
  Printer,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { AppNavbar } from '@/components/shared/app-navbar';
import { useLiff } from '@/features/line/liff-provider';
import type { SessionHistoryItem } from '@/features/order-session/order-session.schema';
import { calculateOrderItemTotals } from '@/server/services/order-calculator.service';

function formatSessionDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function OrderHistoryClient({
  initialHistory,
}: {
  initialHistory: SessionHistoryItem[];
}) {
  const { profile } = useLiff();
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINE'>('ALL');

  const { data: history = initialHistory } = useQuery<SessionHistoryItem[]>({
    queryKey: ['session-history'],
    queryFn: async () => {
      const res = await fetch('/api/v1/sessions');
      const json = (await res.json()) as { ok: boolean; data?: SessionHistoryItem[] };
      if (!json.ok || !json.data) {
        throw new Error('ไม่สามารถดึงข้อมูลประวัติการสั่งได้');
      }
      return json.data;
    },
    initialData: initialHistory,
    refetchInterval: 5000,
  });

  const filteredHistory = useMemo(() => {
    if (filterMode === 'ALL') {
      return history;
    }
    return history.filter(({ session }) => {
      const isHost = session.hostUserId === profile.userId;
      const hasOrdered = session.items.some((i) => i.orderedByUserId === profile.userId);
      return isHost || hasOrdered;
    });
  }, [history, filterMode, profile.userId]);

  const openSessions = useMemo(
    () => filteredHistory.filter((item) => item.session.status === 'OPEN'),
    [filteredHistory],
  );

  const closedSessions = useMemo(
    () => filteredHistory.filter((item) => item.session.status === 'CLOSED'),
    [filteredHistory],
  );

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <DevPersonaBar />
      <AppNavbar />

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-hairline pb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              <History className="h-4 w-4 text-chili" />
              <span>Tan-Sang Ledger</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              ประวัติบิลสั่งอาหาร
            </h1>
            <p className="mt-1 text-xs text-ink-secondary sm:text-sm">
              รายการบิลกลุ่มทั้งหมด สรุปยอดรวม ยอดรายคน และทางลัดเข้าสู่ห้องสั่งและใบเสร็จ
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-xs transition hover:bg-subtle"
          >
            + เปิดบิลใหม่
          </Link>
        </div>

        {/* Filter Segmented Control */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="ตัวกรองประวัติบิล"
            className="inline-flex rounded-theme border border-hairline bg-subtle p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === 'ALL'}
              onClick={() => setFilterMode('ALL')}
              className={`min-h-[36px] rounded-theme px-4 text-xs font-semibold transition border ${
                filterMode === 'ALL'
                  ? 'bg-surface text-ink border-hairline shadow-xs'
                  : 'border-transparent text-ink-secondary hover:text-ink'
              }`}
            >
              บิลทั้งหมด ({history.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterMode === 'MINE'}
              onClick={() => setFilterMode('MINE')}
              className={`min-h-[36px] rounded-theme px-4 text-xs font-semibold transition border ${
                filterMode === 'MINE'
                  ? 'bg-surface text-ink border-hairline shadow-xs'
                  : 'border-transparent text-ink-secondary hover:text-ink'
              }`}
            >
              บิลที่ฉันมีส่วนร่วม
            </button>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-chili underline-offset-2 hover:underline"
          >
            <Utensils className="h-3.5 w-3.5" />
            + เปิดบิลใหม่
          </Link>
        </div>

        {/* Empty State */}
        {filteredHistory.length === 0 ? (
          <div className="mt-8 rounded-xl border border-hairline bg-surface p-12 text-center">
            <Clock className="mx-auto h-8 w-8 text-ink-muted" />
            <h2 className="mt-3 text-base font-semibold text-ink">
              {filterMode === 'MINE'
                ? `ไม่พบบิลที่คุณ (${profile.displayName}) มีส่วนร่วม`
                : 'ยังไม่มีประวัติการสั่งอาหารในระบบ'}
            </h2>
            <p className="mt-1 text-xs text-ink-secondary">
              {filterMode === 'MINE'
                ? 'ลองสลับตัวละครใน DevPersonaBar หรือเลือกดู "บิลทั้งหมด"'
                : 'เริ่มต้นเปิดบิลแรกของกลุ่มได้ที่หน้าหลัก'}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-chili px-4 py-2 text-xs font-semibold text-white hover:bg-chili-hover"
            >
              ไปยังหน้าหลัก
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {/* 1. Open Sessions Section */}
            {openSessions.length > 0 && (
              <section aria-labelledby="heading-open-sessions" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2
                    id="heading-open-sessions"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-line"
                  >
                    <span className="h-2 w-2 rounded-full bg-line animate-pulse" />
                    กำลังเปิดรับออเดอร์ ({openSessions.length})
                  </h2>
                </div>

                <div className="divide-y divide-hairline overflow-hidden rounded-theme border border-hairline bg-surface shadow-xs">
                  {openSessions.map(({ session, summary }) => {
                    const isHost = session.hostUserId === profile.userId;
                    const myItems = session.items.filter(
                      (i) => i.orderedByUserId === profile.userId,
                    );
                    const myTotal = myItems.reduce(
                      (sum, item) => sum + calculateOrderItemTotals(item).lineTotal,
                      0,
                    );

                    return (
                      <div
                        key={session.id}
                        className="flex flex-col gap-4 p-5 transition hover:bg-canvas/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-line-subtle px-2.5 py-0.5 text-xs font-semibold text-line">
                              <span className="h-1.5 w-1.5 rounded-full bg-line" />
                              เปิดรับออเดอร์
                            </span>
                            <span className="font-mono text-xs text-ink-muted">
                              {formatSessionDate(session.createdAt)}
                            </span>
                            {isHost && (
                              <span className="rounded-theme border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                คุณเป็น Host
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-semibold text-ink">
                            {summary.storeDisplayName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums text-ink-secondary">
                            <span>
                              รวม <strong className="text-ink">{summary.totalItemsCount}</strong>{' '}
                              จาน
                            </span>
                            <span>•</span>
                            <span>
                              ยอดรวม{' '}
                              <strong className="text-ink">
                                {summary.grandTotalAmount.toLocaleString('th-TH')}
                              </strong>{' '}
                              ฿
                            </span>
                            <span>•</span>
                            <span className={myTotal > 0 ? 'text-chili font-semibold' : 'text-ink-muted'}>
                              ยอดของคุณ: {myTotal.toLocaleString('th-TH')} ฿
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Links */}
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/order/${session.id}`}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-theme border border-chili bg-chili px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-chili-hover"
                          >
                            เข้าห้องสั่ง
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/receipt/${session.id}`}
                            className="inline-flex min-h-[40px] items-center gap-1 rounded-theme border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-subtle"
                          >
                            <Printer className="h-3.5 w-3.5 text-ink-secondary" />
                            ใบเสร็จ
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2. Closed Historical Sessions Section */}
            {closedSessions.length > 0 && (
              <section aria-labelledby="heading-closed-sessions" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2
                    id="heading-closed-sessions"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-secondary"
                  >
                    <Lock className="h-3.5 w-3.5 text-ink-muted" />
                    ปิดบิลแล้ว ({closedSessions.length})
                  </h2>
                </div>

                <div className="divide-y divide-hairline overflow-hidden rounded-theme border border-hairline bg-surface shadow-xs">
                  {closedSessions.map(({ session, summary }) => {
                    const isHost = session.hostUserId === profile.userId;
                    const myItems = session.items.filter(
                      (i) => i.orderedByUserId === profile.userId,
                    );
                    const myTotal = myItems.reduce(
                      (sum, item) => sum + calculateOrderItemTotals(item).lineTotal,
                      0,
                    );

                    return (
                      <div
                        key={session.id}
                        className="flex flex-col gap-4 p-5 transition hover:bg-canvas/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                              <Lock className="h-3 w-3 text-ink-muted" />
                              ปิดบิลแล้ว
                            </span>
                            <span className="font-mono text-xs text-ink-muted">
                              {formatSessionDate(session.createdAt)}
                            </span>
                            {isHost && (
                              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                คุณเป็น Host
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-semibold text-ink">
                            {summary.storeDisplayName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums text-ink-secondary">
                            <span>
                              รวม <strong className="text-ink">{summary.totalItemsCount}</strong>{' '}
                              จาน
                            </span>
                            <span>•</span>
                            <span>
                              ยอดรวม{' '}
                              <strong className="text-ink">
                                {summary.grandTotalAmount.toLocaleString('th-TH')}
                              </strong>{' '}
                              ฿
                            </span>
                            <span>•</span>
                            <span className={myTotal > 0 ? 'text-chili font-semibold' : 'text-ink-muted'}>
                              ยอดของคุณ: {myTotal.toLocaleString('th-TH')} ฿
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Links */}
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/order/${session.id}`}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-theme border border-hairline bg-canvas px-3.5 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-subtle"
                          >
                            ดูรายการ
                            <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
                          </Link>
                          <Link
                            href={`/receipt/${session.id}`}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-surface border border-hairline px-3.5 py-2 text-xs font-semibold text-ink hover:bg-subtle"
                          >
                            <Printer className="h-3.5 w-3.5 text-chili" />
                            ใบเสร็จ
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
