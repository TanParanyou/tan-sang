'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export interface DropdownActionItem {
  id?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  active?: boolean;
}

export interface DropdownSeparator {
  type: 'separator';
}

export interface DropdownCustomItem {
  id?: string;
  custom: React.ReactNode;
}

export type DropdownItem = DropdownActionItem | DropdownSeparator | DropdownCustomItem;

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
  ariaLabel?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className,
  menuClassName,
  ariaLabel = 'เมนูตัวเลือก',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className="cursor-pointer focus-visible:outline-none"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={cn(
            'absolute z-50 mt-1.5 min-w-[200px] max-w-[280px] rounded-theme border border-hairline bg-surface p-1.5 shadow-theme transition-all duration-150',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            menuClassName
          )}
        >
          {items.map((item, index) => {
            if ('type' in item && item.type === 'separator') {
              return <div key={`sep-${index}`} className="my-1 border-t border-hairline" role="separator" />;
            }

            if ('custom' in item) {
              return (
                <div key={item.id ?? `custom-${index}`} onClick={close}>
                  {item.custom}
                </div>
              );
            }

            const actionItem = item as DropdownActionItem;
            const isDanger = actionItem.variant === 'danger';
            const itemClasses = cn(
              'group flex w-full items-center gap-2.5 rounded-theme px-3 py-2 text-xs font-medium transition text-left select-none',
              actionItem.disabled
                ? 'opacity-40 cursor-not-allowed pointer-events-none'
                : isDanger
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100'
                  : actionItem.active
                    ? 'bg-subtle font-semibold text-ink'
                    : 'text-ink hover:bg-subtle active:bg-neutral-200'
            );

            const content = (
              <>
                {actionItem.icon && (
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center',
                      isDanger ? 'text-red-500 group-hover:text-red-700' : 'text-ink-secondary group-hover:text-ink'
                    )}
                  >
                    {actionItem.icon}
                  </span>
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate">{actionItem.label}</span>
                  {actionItem.description && (
                    <span className="text-[10px] text-ink-muted leading-tight truncate">{actionItem.description}</span>
                  )}
                </div>
              </>
            );

            if (actionItem.href) {
              return (
                <Link
                  key={actionItem.id ?? `link-${index}`}
                  href={actionItem.href}
                  role="menuitem"
                  className={itemClasses}
                  onClick={close}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={actionItem.id ?? `btn-${index}`}
                type="button"
                role="menuitem"
                disabled={actionItem.disabled}
                className={itemClasses}
                onClick={() => {
                  close();
                  actionItem.onClick?.();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
