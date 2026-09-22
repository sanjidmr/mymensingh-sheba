'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  isVerified?: boolean;
  isAvailable?: boolean;
}

export function Avatar({
  className,
  src,
  alt,
  name,
  size = 'md',
  isVerified = false,
  isAvailable,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeMap: Record<AvatarSize, { container: string; text: string; badge: string; dot: string; px: number }> = {
    xs: { container: 'w-6 h-6', text: 'text-[10px]', badge: 'w-2.5 h-2.5 -right-0.5 -bottom-0.5', dot: 'w-1.5 h-1.5', px: 24 },
    sm: { container: 'w-8 h-8', text: 'text-xs', badge: 'w-3 h-3 -right-0.5 -bottom-0.5', dot: 'w-2 h-2', px: 32 },
    md: { container: 'w-10 h-10', text: 'text-sm font-semibold', badge: 'w-3.5 h-3.5 -right-0.5 -bottom-0.5', dot: 'w-2.5 h-2.5', px: 40 },
    lg: { container: 'w-12 h-12', text: 'text-base font-bold', badge: 'w-4 h-4 -right-1 -bottom-1', dot: 'w-3 h-3', px: 48 },
    xl: { container: 'w-16 h-16', text: 'text-xl font-bold', badge: 'w-5 h-5 -right-1 -bottom-1', dot: 'w-3.5 h-3.5', px: 64 },
    '2xl': { container: 'w-20 h-20', text: 'text-2xl font-black', badge: 'w-6 h-6 -right-1 -bottom-1', dot: 'w-4 h-4', px: 80 },
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
  };

  const initials = getInitials(name || alt);

  return (
    <div className={cn('relative inline-flex shrink-0 select-none', className)} {...props}>
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center bg-emerald-50 text-emerald-900 border border-emerald-200/80',
          sizeMap[size].container
        )}
      >
        {src && !imageError ? (
          <Image
            src={src}
            alt={alt || name || 'Avatar'}
            width={sizeMap[size].px}
            height={sizeMap[size].px}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : initials ? (
          <span className={cn('tracking-tight font-medium', sizeMap[size].text)}>
            {initials}
          </span>
        ) : (
          <User className="w-1/2 h-1/2 text-emerald-800/70" />
        )}
      </div>

      {/* Verified Badge */}
      {isVerified && (
        <div
          className={cn(
            'absolute rounded-full bg-emerald-700 text-white flex items-center justify-center ring-2 ring-white shadow-2xs',
            sizeMap[size].badge
          )}
          title="ভেরিফাইড প্রোফাইল"
          aria-label="ভেরিফাইড প্রোফাইল"
        >
          <ShieldCheck className="w-full h-full p-0.5" />
        </div>
      )}

      {/* Available online status dot */}
      {typeof isAvailable === 'boolean' && !isVerified && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            isAvailable ? 'bg-teal-500' : 'bg-slate-400',
            sizeMap[size].dot
          )}
          title={isAvailable ? 'অন ডিউটি / উপলব্ধ' : 'অনুপলব্ধ'}
        />
      )}
    </div>
  );
}
