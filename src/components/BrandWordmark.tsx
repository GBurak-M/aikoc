import BrandLogo from './BrandLogo';
import { SITE_BRAND_PREFIX, SITE_BRAND_SUFFIX, SITE_NAME } from '../config/site';

export type BrandWordmarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<
  BrandWordmarkSize,
  { text: string; logo: number; gap: string; logoOffset: string }
> = {
  xs: { text: 'text-[9px]', logo: 11, gap: 'gap-0', logoOffset: '-mx-[1px] -my-px' },
  sm: { text: 'text-sm', logo: 16, gap: 'gap-0', logoOffset: '-mx-0.5' },
  md: { text: 'text-base', logo: 20, gap: 'gap-0.5', logoOffset: '-mx-0.5' },
  lg: { text: 'text-xl', logo: 26, gap: 'gap-0.5', logoOffset: '-mx-1' },
  xl: { text: 'text-2xl md:text-3xl', logo: 32, gap: 'gap-1', logoOffset: '-mx-1' },
};

export type BrandWordmarkProps = {
  size?: BrandWordmarkSize;
  /** Metin parçalarında tema gradienti */
  gradient?: boolean;
  gradientClass?: string;
  className?: string;
  logoVariant?: 'mark' | 'loading';
  frameClassName?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
};

/**
 * Site adı: ai + logo + koc — marka logosu ismin ortasında yer alır.
 */
export default function BrandWordmark({
  size = 'lg',
  gradient = true,
  gradientClass = 'from-cyan-500 via-indigo-500 to-violet-600 dark:from-cyan-300 dark:via-indigo-300 dark:to-violet-300',
  className = '',
  logoVariant = 'mark',
  frameClassName = 'bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-600',
  as: Tag = 'span',
}: BrandWordmarkProps) {
  const spec = SIZE_MAP[size];
  const textClass = gradient
    ? `bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`
    : 'text-slate-900 dark:text-white';

  const logo = (
    <span className={`inline-flex shrink-0 ${logoVariant === 'loading' ? 'animate-pulse' : ''}`}>
      <BrandLogo size={spec.logo} variant="mark" className={spec.logoOffset} />
    </span>
  );

  return (
    <Tag
      className={`inline-flex items-center ${spec.gap} font-display font-extrabold tracking-tight leading-none ${spec.text} ${className}`}
      aria-label={SITE_NAME}
    >
      <span className={textClass}>{SITE_BRAND_PREFIX}</span>
      {logo}
      <span className={textClass}>{SITE_BRAND_SUFFIX}</span>
    </Tag>
  );
}
