'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, Home, Store } from 'lucide-react';
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

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนูหลักด้านล่าง"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur-md print:hidden shadow-theme"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-3 pb-[env(safe-area-inset-bottom)]">
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
                'group flex flex-1 flex-col items-center justify-center py-1 transition-all focus:outline-none min-h-[48px]',
                isActive ? 'text-chili' : 'text-ink-secondary hover:text-ink',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                  isActive
                    ? 'bg-chili/10 text-chili'
                    : 'text-ink-muted group-hover:bg-subtle group-hover:text-ink',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'mt-0.5 text-[11px] font-medium leading-none tracking-tight transition-colors',
                  isActive ? 'font-bold text-chili' : 'text-ink-secondary group-hover:text-ink',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
