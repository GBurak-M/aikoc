import { useId } from 'react';

export type BrandLogoVariant = 'mark' | 'framed' | 'loading';

export type BrandLogoProps = {
  /** Piksel cinsinden genişlik ve yükseklik */
  size?: number;
  variant?: BrandLogoVariant;
  /** framed / loading için dış çerçeve sınıfları */
  frameClassName?: string;
  className?: string;
  title?: string;
};

/**
 * aikoc markası — geometrik "A" monogramı + onay işareti (başarı) + tepe düğümü (AI).
 * Sade, ölçeklenebilir siluet: küçük favicon ve yükleme durumlarında net kalır.
 */
export default function BrandLogo({
  size = 40,
  variant = 'mark',
  frameClassName = 'bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-600',
  className = '',
  title = 'aikoc — Ulusal Sınav AI Koçu',
}: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');
  const grad = `aikoc-grad-${uid}`;
  const glow = `aikoc-glow-${uid}`;

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={grad} x1="6" y1="36" x2="34" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="28%" r="58%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* A monogramı — sol bacak */}
      <path
        d="M11 34 L20 8.5"
        stroke={`url(#${grad})`}
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* A monogramı — sağ bacak */}
      <path
        d="M29 34 L20 8.5"
        stroke={`url(#${grad})`}
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* Onay / ilerleme çubuğu — sınav başarısı */}
      <path
        d="M13.5 26.5 L18.5 22 L26.5 24.5"
        stroke={`url(#${grad})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={variant === 'loading' ? 'brand-logo-check' : undefined}
      />

      {/* AI hedef düğümü */}
      <circle
        cx="20"
        cy="8.5"
        r="2.6"
        fill={`url(#${grad})`}
        className={variant === 'loading' ? 'brand-logo-pulse' : undefined}
      />
      <circle cx="20" cy="8.5" r="1" fill="white" fillOpacity="0.95" />

      <rect x="0" y="0" width="40" height="40" fill={`url(#${glow})`} pointerEvents="none" />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={`inline-flex shrink-0 ${className}`}>{svg}</span>;
  }

  const framePad = Math.max(6, Math.round(size * 0.18));
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl logo-glow text-white ${frameClassName} ${
        variant === 'loading' ? '' : 'animate-float'
      } ${className}`}
      style={{ padding: framePad }}
    >
      {svg}
    </span>
  );
}
