import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  PiBookBookmarkDuotone,
  PiChatsCircleDuotone,
  PiClipboardTextDuotone,
  PiGraduationCapDuotone,
  PiArrowRightBold
} from 'react-icons/pi';
import { buttonVariants } from '../../../primitives/Button.primitive';
import { Section } from '../../../primitives/Section.primitive';

const publicHeroHighlights = [
  { Icon: PiChatsCircleDuotone, href: "#expert-intelligence" },
  { Icon: PiClipboardTextDuotone, href: "#curriculum" },
  { Icon: PiBookBookmarkDuotone, href: "#cognitive-analysis" },
  { Icon: PiGraduationCapDuotone, href: "#vision" }
];

export function PublicHomeHeroWidget() {
  const t = useTranslations('PublicHomeHeroWidget');
  const highlightLabels = t.raw('highlights');

  return (
    <Section padding="hero" layout="full" className="bg-white dark:bg-app-dark-blue transition-colors duration-500 overflow-hidden rounded-app relative">

      {/* Animated SVG Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Light mode version (dark blue tones) */}
        <img
          src="/hero-bg-light.svg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover block dark:hidden"
        />
        {/* Dark mode version (green tones) */}
        <img
          src="/hero-bg.svg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover hidden dark:block"
        />
      </div>

      <div className="relative z-2 w-full text-center flex flex-col items-center">

        {/* Version Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-app-full bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-sm text-sm font-bold text-app-dark-blue dark:text-white animate-fade-in-up my-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-app-full bg-app-bright-green opacity-75"></span>
            <span className="relative inline-flex rounded-app-full h-3 w-3 bg-app-bright-green"></span>
          </span>
          Stuwin AI 1.0
        </div>

        <h1 className="text-3xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tighter text-app-dark-blue dark:text-white drop-shadow-sm leading-[1.05] max-w-5xl">
          {t('headline')}
        </h1>

        <p className="text-lg md:text-2xl text-app-dark-blue/70 dark:text-white/70 max-w-3xl mx-auto leading-relaxed font-medium">
          {t('body')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto">
          <Link
            href="/auth/register"
            className={[buttonVariants({ variant: "default", size: "xl" }), "w-full sm:w-auto text-[#0f172b] gap-2"].filter(Boolean).join(" ")}
          >
            {t('cta_primary')} <PiArrowRightBold />
          </Link>
          <Link
            href="#vision"
            className={[buttonVariants({ variant: "secondary", size: "xl" }), "w-full sm:w-auto backdrop-blur-md"].filter(Boolean).join(" ")}
          >
            {t('cta_secondary')}
          </Link>
        </div>

        <div className="w-full max-w-5xl pt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 z-2 relative">
          {publicHeroHighlights.map(({ Icon, href }, idx) => (
            <Link
              key={idx}
              href={href}
              className="group flex items-center justify-start gap-4 p-4 md:p-6 rounded-app bg-black/5 dark:bg-white/5 backdrop-blur-md/60 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-app-widget hover:bg-black/5 dark:bg-white/5 backdrop-blur-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-3 md:p-4 rounded-app bg-white dark:bg-app-dark-blue text-app-dark-blue dark:text-white group-hover:bg-app-bright-green group-hover:text-[#0f172b] shadow-sm transition-colors duration-300">
                <Icon className="text-2xl md:text-3xl" />
              </div>
              <span className="text-sm md:text-base font-bold tracking-tight text-app-dark-blue dark:text-white text-left leading-snug">
                {highlightLabels[idx]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}

