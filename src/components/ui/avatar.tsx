'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  alt?: string;
}

const SIZE_CLASSES = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
} as const;

// Pastel background palette matching Tan-Sang warm aesthetics
const AVATAR_BG_PALETTES: string[] = [
  'bg-amber-100 text-amber-900 border-amber-200',
  'bg-orange-100 text-orange-900 border-orange-200',
  'bg-emerald-100 text-emerald-900 border-emerald-200',
  'bg-sky-100 text-sky-900 border-sky-200',
  'bg-rose-100 text-rose-900 border-rose-200',
  'bg-purple-100 text-purple-900 border-purple-200',
  'bg-teal-100 text-teal-900 border-teal-200',
];

function getPaletteByName(name: string): string {
  if (!name || AVATAR_BG_PALETTES.length === 0) {
    return 'bg-subtle text-ink border-hairline';
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_BG_PALETTES.length;
  return AVATAR_BG_PALETTES[index] ?? 'bg-subtle text-ink border-hairline';
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name = '', src, size = 'md', alt, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const sizeClass = SIZE_CLASSES[size];
    const paletteClass = getPaletteByName(name);
    const hasValidSrc = Boolean(src && src.trim().length > 0 && !imageError);

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold',
          sizeClass,
          !hasValidSrc && paletteClass,
          !hasValidSrc && 'border',
          className,
        )}
        title={name}
        {...props}
      >
        {hasValidSrc ? (
          <img
            src={src!}
            alt={alt || name || 'User Avatar'}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover rounded-full border border-hairline/60"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="leading-none">{getInitials(name)}</span>
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
