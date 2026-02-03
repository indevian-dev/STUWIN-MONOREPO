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
    <section className="relative overflow-hidden pt-20 pb-16 lg:pt-24 lg:pb-24 bg-gradient-to-r from-brand/30 to-brand-secondary/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <Image
          src="/hero.png"
          alt="Hero"
          fill
          className="absolute inset-0 object-cover opacity-10"
        />
        {/* Subtle Brand Overlay */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 text-white text-center">
        <div className="space-y-12">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black">
            <span className="text-brand-secondary">
              {t('headline')}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-brand-secondary/80 max-w-3xl mx-auto leading-relaxed font-medium">
            {t('body')}
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center px-12 py-5 rounded-2xl bg-brand text-brand-secondary font-black hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-2xl shadow-white/10"
            >
              {t('cta_primary')}
            </Link>
            <Link
              href="#cognitive-analysis"
              className="inline-flex items-center justify-center px-12 py-5 rounded-2xl bg-brand-secondary border border-white/20 text-white font-black hover:bg-white/20 active:scale-95 transition-all duration-300 shadow-lg"
            >
              {t('cta_secondary')}
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-8">
            {publicHeroHighlights.map(({ Icon }, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-white shadow-xl hover:border-white/30 transition-all duration-500"
              >
                <div className="p-2 rounded-xl bg-white text-brand-secondary group-hover:bg-white group-hover:text-brand transition-all duration-300">
                  <Icon className="text-2xl" />
                </div>
                <span className="text-sm font-black tracking-wide text-brand-secondary uppercase">
                  {highlightLabels[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

