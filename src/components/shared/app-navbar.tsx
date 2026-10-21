'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, Home, Store, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'หน้าหลัก', icon: Home },
  { href: '/history', label: 'ประวัติบิล', icon: History },
  { href: '/admin/stores', label: 'จัดการร้านค้า', icon: Store },
];

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-surface/90 backdrop-blur-md">
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

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="เมนูหลัก">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex min-h-[36px] items-center gap-1.5 rounded-theme px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors border',
                  isActive
                    ? 'bg-subtle text-ink font-semibold border-hairline shadow-xs'
                    : 'border-transparent text-ink-secondary hover:border-hairline hover:bg-subtle/60 hover:text-ink',
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-chili' : 'text-ink-muted')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
