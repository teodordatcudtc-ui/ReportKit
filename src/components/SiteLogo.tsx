'use client';

import Image from 'next/image';
import { useState } from 'react';

type SiteLogoSize = 'default' | 'compact' | 'small';

const sizeClasses: Record<SiteLogoSize, string> = {
  default: 'w-60 h-60 rounded-2xl',
  compact: 'w-48 h-48 rounded-xl',
  small: 'w-14 h-14 rounded-xl',
};

/**
 * Iconița default (grafic) folosită când nu există logo personalizat.
 */
function DefaultIcon({ size }: { size: SiteLogoSize }) {
  const dim = size === 'default' ? 120 : size === 'compact' ? 96 : 28;
  return (
    <svg width={dim} height={dim} fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

/** Logo landing: public/logo.png. Logo dashboard: public/logo-dashboard.png */
const LOGO_SRC: Record<SiteLogoSize, string> = {
  default: '/logo.png',
  compact: '/logo-dashboard.png',
  small: '/logo.png',
};

/**
 * Logo-ul din header/footer/dashboard.
 * size="default" – mare, folosește logo.png (landing).
 * size="compact" – dashboard sidebar, folosește logo-dashboard.png (imagine diferită).
 */
export function SiteLogo({ size = 'default' }: { size?: SiteLogoSize }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const classes = sizeClasses[size];
  const src = LOGO_SRC[size];
  const useFallback = failedSrc === src;

  if (useFallback) {
    return (
      <div className={`${classes} bg-blue-700 flex items-center justify-center flex-shrink-0`}>
        <DefaultIcon size={size} />
      </div>
    );
  }

  const sizePx = size === 'default' ? 240 : size === 'compact' ? 192 : 56;
  return (
    <Image
      src={src}
      alt=""
      width={sizePx}
      height={sizePx}
      role="presentation"
      className={`${classes} object-contain flex-shrink-0`}
      onError={() => setFailedSrc(src)}
    />
  );
}
