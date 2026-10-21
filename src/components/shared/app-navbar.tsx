'use client';

import React from 'react';
import Link from 'next/link';
import { Utensils } from 'lucide-react';

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-hairline bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Title */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85 focus:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-theme bg-chili text-white shadow-xs border border-chili">
            <Utensils className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-ink text-sm sm:text-base leading-none">
              ตาลสั่ง <span className="text-xs font-mono font-medium text-ink-muted">(Tan-Sang)</span>
            </span>
            <span className="text-[10px] text-ink-secondary leading-tight hidden sm:inline">
              LINE Group Food Ordering
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
