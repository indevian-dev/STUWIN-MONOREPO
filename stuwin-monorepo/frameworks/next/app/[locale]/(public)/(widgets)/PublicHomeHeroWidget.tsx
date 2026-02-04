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
  { Icon: PiChatsCircleFill, href: "#expert-intelligence" },
  { Icon: PiClipboardTextFill, href: "#curriculum" },
  { Icon: PiBookBookmarkFill, href: "#cognitive-analysis" },
  { Icon: PiGraduationCapFill, href: "#vision" }
];

export function PublicHomeHeroWidget() {
  const t = useTranslations('PublicHomeHeroWidget');
  const highlightLabels = t.raw('highlights');

  return (
    <section className="relative overflow-hidden pt-20 pb-16 lg:pt-24 lg:pb-24 bg-white">
      {/* Dynamic Background with Grid Lines */}
      <div className="absolute inset-0">
        {/* Grid pattern overlay */}
        <Image
          src="/hero.png"
          alt="Hero"
          fill
          className="absolute inset-0 object-cover opacity-50 grayscale brightness-75 contrast-125 mix-blend-luminosity"
        />

        <div
          className="absolute inset-0 opacity-80 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(10, 4, 40, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(16, 206, 16, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
        />


        {/* Subtle Brand Overlay */}
        <div className="absolute inset-0 bg-brand-secondary/20" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 text-white text-center">
        <div className="space-y-12">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black">
            <span className="text-brand-secondary">
              {t('headline')}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-brand-secondary/70 max-w-3xl mx-auto leading-relaxed font-medium">
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
              href="#vision"
              className="inline-flex items-center justify-center px-12 py-5 rounded-2xl bg-brand-secondary border border-white/20 text-white font-black hover:bg-white/20 active:scale-95 transition-all duration-300 shadow-lg"
            >
              {t('cta_secondary')}
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-8">
            {publicHeroHighlights.map(({ Icon, href }, idx) => (
              <Link
                key={idx}
                href={href}
                className="group flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl hover:bg-white/10 hover:border-brand/50 hover:-translate-y-1 transition-all duration-500"
              >
                <div className="p-2 rounded-xl bg-brand/10 text-brand-secondary group-hover:bg-brand group-hover:text-brand-secondary transition-all duration-300">
                  <Icon className="text-2xl" />
                </div>
                <span className="text-sm font-black tracking-wide text-brand-secondary uppercase">
                  {highlightLabels[idx]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

