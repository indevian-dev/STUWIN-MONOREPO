import { Link } from '@/i18n/routing';
import { GlobalLogoTile } from './GlobalLogoTile';

// Shared brand pill used across authenticated headers to mirror public styling
export function GlobalHeaderBrandTile({
  href = '/',
  logoSrc = '/stuwinlogo.svg', // Kept for backward compat but ignored by GlobalLogoTile
  label = 'STUWIN.AI',
  subtitle = ''
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
    >
      <GlobalLogoTile width={36} height={36} href={undefined} />
      <div className="leading-tight flex flex-col">
        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{label}</span>
        {subtitle ? (
          <span className="text-[11px] text-slate-500 whitespace-nowrap">{subtitle}</span>
        ) : null}
      </div>
    </Link>
  );
}

