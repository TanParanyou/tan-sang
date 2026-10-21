'use client';

import React from 'react';
import Link from 'next/link';
import { useLiff } from '@/features/line/liff-provider';

export function DevPersonaBar({ hostUserId }: { hostUserId?: string }) {
  const { profile, isInLineClient, personas, setDevPersona } = useLiff();

  // Hide simulator completely in production or when in LINE client
  if (process.env.NODE_ENV === 'production' || isInLineClient) {
    return null;
  }

  return (
    <div className="border-b border-hairline bg-subtle px-3 py-1.5 text-xs text-ink-secondary print:hidden">
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-theme bg-ink" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink">
            LIFF Simulator:
          </span>
          <div className="inline-flex rounded-theme border border-hairline bg-surface p-0.5">
            {personas.map((p) => {
              const active = p.userId === profile.userId;
              const isHost = hostUserId ? p.userId === hostUserId : p.userId === 'U_HOST_TAN';
              return (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => setDevPersona(p.userId)}
                  className={`rounded-theme px-2 py-0.5 text-[11px] font-medium transition ${
                    active
                      ? 'bg-ink text-surface'
                      : 'text-ink-secondary hover:bg-subtle hover:text-ink'
                  }`}
                >
                  {p.displayName}
                  {isHost ? ' ★' : ''}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <Link href="/" className="underline-offset-2 hover:text-ink hover:underline">
            หน้าแรก
          </Link>
          <Link href="/receipt" className="underline-offset-2 hover:text-ink hover:underline">
            ใบเสร็จ
          </Link>
        </div>
      </div>
    </div>
  );
}
