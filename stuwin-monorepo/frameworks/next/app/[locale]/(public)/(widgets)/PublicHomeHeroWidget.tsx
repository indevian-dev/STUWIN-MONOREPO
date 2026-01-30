import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  PiBookBookmarkFill,
  PiChatsCircleFill,
  PiClipboardTextFill,
  PiGraduationCapFill
} from 'react-icons/pi';
import Image from 'next/image';

const publicHeroHighlights = [
  { Icon: PiChatsCircleFill },
  { Icon: PiClipboardTextFill },
  { Icon: PiBookBookmarkFill },
  { Icon: PiGraduationCapFill }
];

export function PublicHomeHeroWidget() {
  const t = useTranslations('PublicHomeHeroWidget');
  const highlightLabels = t.raw('highlights');

  return (
    <section className="relative overflow-hidden rounded-b-[3rem] py-24 lg:py-32">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-slate-950">
        <Image
          src="/hero.png"
          alt="Hero"
          fill
          className="absolute inset-0 object-cover opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-linear-to-br from-brand-secondary/40 via-slate-900/60 to-brand-primary/20" />
        {/* Animated Orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 text-white text-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm font-medium tracking-wide">
            <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-ping" />
            {t('badge')}
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-white via-white to-white/60">
              {t('headline')}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            {t('body')}
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-slate-950 font-bold shadow-2xl hover:scale-105 transition-all duration-300"
            >
              {t('cta_primary')}
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold hover:bg-white/10 transition-all duration-300"
            >
              {t('cta_secondary')}
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-12">
            {publicHeroHighlights.map(({ Icon }, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500"
              >
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-primary/20 transition-colors">
                  <Icon className="text-xl text-brand-primary" />
                </div>
                <span className="text-sm font-bold tracking-tight text-white/90">{highlightLabels[idx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

