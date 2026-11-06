'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Clock,
  ExternalLink,
  History,
  Lock,
  Plus,
  Printer,
  Sparkles,
} from 'lucide-react';
import { DevPersonaBar } from '@/components/shared/dev-persona-bar';
import { AppNavbar } from '@/components/shared/app-navbar';
import { useLiff } from '@/features/line/liff-provider';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { SessionHistoryItem } from '@/features/order-session/order-session.schema';
import { calculateOrderItemTotals } from '@/server/services/order-calculator.service';
import { DeleteSessionButton } from '@/features/order-session/components/delete-session-button';
import { formatThaiDateTime } from '@/lib/utils/date';
import { Toast } from '@/components/ui';

export function OrderHistoryClient({
  initialHistory,
}: {
  initialHistory: SessionHistoryItem[];
}) {
  const { profile } = useLiff();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINE'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const { data: history = initialHistory } = useQuery<SessionHistoryItem[]>({
    queryKey: ['session-history'],
    queryFn: async () => {
      const res = await fetch('/api/v1/sessions');
      const json = (await res.json()) as { ok: boolean; data?: SessionHistoryItem[] };
      if (!json.ok || !json.data) {
        throw new Error(t.history.fetchFailed);
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
    <div className="min-h-screen bg-canvas pb-24">
      <DevPersonaBar />

      {/* Toast Feedback */}
      <Toast message={toastMessage} />

      <AppNavbar
        backHref="/"
        backLabel={t.common.back}
        title={t.history.title}
        subtitle="Tan-Sang Ledger"
        maxWidthClassName="max-w-2xl"
        actions={
          <Link
            href="/"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-theme border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition hover:bg-subtle"
          >
            <Plus className="h-3.5 w-3.5 text-chili" />
            <span>{t.history.openNewSession}</span>
          </Link>
        }
      />

      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-xs text-ink-secondary sm:text-sm">
          {t.history.subtitle}
        </p>

        {/* Filter Segmented Control */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={t.history.title}
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
              {t.history.filterAll} ({history.length})
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
              {t.history.filterMine}
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredHistory.length === 0 ? (
          <div className="mt-8 rounded-xl border border-hairline bg-surface p-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle border border-hairline animate-mascot-float shadow-xs mb-2">
              <img src="/brand-mascot.png" alt={t.common.brandName} className="h-9 w-9 object-contain animate-mascot-breathe" />
            </div>
            <h2 className="mt-1 text-base font-semibold text-ink">
              {filterMode === 'MINE'
                ? t.history.emptyDescMine.replace("{name}", profile.displayName)
                : t.history.emptyDescAll}
            </h2>
            <p className="mt-1 text-xs text-ink-secondary">
              {filterMode === 'MINE'
                ? t.history.subtitle
                : t.history.emptyDesc}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-chili px-4 py-2 text-xs font-semibold text-white hover:bg-chili-hover"
            >
              {t.nav.home}
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
                    {t.session.statusOpen} ({openSessions.length})
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
                              {t.history.statusOpen}
                            </span>
                            <span className="font-mono text-xs text-ink-muted">
                              {formatThaiDateTime(session.createdAt)}
                            </span>
                            {isHost && (
                              <span className="rounded-theme border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                Host
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-semibold text-ink">
                            {summary.storeDisplayName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums text-ink-secondary">
                            <span>
                              {t.session.sumLabel} <strong className="text-ink">{summary.totalItemsCount}</strong>{' '}
                              {t.common.dishes}
                            </span>
                            <span>•</span>
                            <span>
                              {t.session.sumLabel}{' '}
                              <strong className="text-ink">
                                {summary.grandTotalAmount.toLocaleString('th-TH')}
                              </strong>{' '}
                              {t.common.baht}
                            </span>
                            <span>•</span>
                            <span className={myTotal > 0 ? 'text-chili font-semibold' : 'text-ink-muted'}>
                              {t.session.yourTotal}: {myTotal.toLocaleString('th-TH')} {t.common.baht}
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Links */}
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/order/${session.id}`}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-theme border border-chili bg-chili px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-chili-hover"
                          >
                            {t.common.openApp}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/receipt/${session.id}`}
                            className="inline-flex min-h-[40px] items-center gap-1 rounded-theme border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-subtle"
                          >
                            <Printer className="h-3.5 w-3.5 text-ink-secondary" />
                            {t.receipt.title}
                          </Link>
                          <DeleteSessionButton
                            sessionId={session.id}
                            hostUserId={session.hostUserId}
                            currentUserId={profile.userId}
                            storeDisplayName={summary.storeDisplayName}
                            variant="icon"
                            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-theme border border-hairline bg-surface text-ink-secondary shadow-xs hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition"
                            onSuccess={async () => {
                              await queryClient.invalidateQueries({ queryKey: ['session-history'] });
                              showToast(t.session.deletedSuccess);
                            }}
                            onError={(err) => showToast(err)}
                          />
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
                    {t.history.statusClosed} ({closedSessions.length})
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
                              {t.history.statusClosed}
                            </span>
                            <span className="font-mono text-xs text-ink-muted">
                              {formatThaiDateTime(session.createdAt)}
                            </span>
                            {isHost && (
                              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                Host
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-semibold text-ink">
                            {summary.storeDisplayName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums text-ink-secondary">
                            <span>
                              {t.session.sumLabel} <strong className="text-ink">{summary.totalItemsCount}</strong>{' '}
                              {t.common.dishes}
                            </span>
                            <span>•</span>
                            <span>
                              {t.session.sumLabel}{' '}
                              <strong className="text-ink">
                                {summary.grandTotalAmount.toLocaleString('th-TH')}
                              </strong>{' '}
                              {t.common.baht}
                            </span>
                            <span>•</span>
                            <span className={myTotal > 0 ? 'text-chili font-semibold' : 'text-ink-muted'}>
                              {t.session.yourTotal}: {myTotal.toLocaleString('th-TH')} {t.common.baht}
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Links */}
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/order/${session.id}`}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-theme border border-hairline bg-canvas px-3.5 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-subtle"
                          >
                            {t.common.items}
                            <ExternalLink className="h-3.5 w-3.5 text-ink-muted" />
                          </Link>
                          <Link
                            href={`/receipt/${session.id}`}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-surface border border-hairline px-3.5 py-2 text-xs font-semibold text-ink hover:bg-subtle"
                          >
                            <Printer className="h-3.5 w-3.5 text-chili" />
                            {t.receipt.title}
                          </Link>
                          <DeleteSessionButton
                            sessionId={session.id}
                            hostUserId={session.hostUserId}
                            currentUserId={profile.userId}
                            storeDisplayName={summary.storeDisplayName}
                            variant="icon"
                            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-theme border border-hairline bg-surface text-ink-secondary shadow-xs hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition"
                            onSuccess={async () => {
                              await queryClient.invalidateQueries({ queryKey: ['session-history'] });
                              showToast(t.session.deletedSuccess);
                            }}
                            onError={(err) => showToast(err)}
                          />
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
