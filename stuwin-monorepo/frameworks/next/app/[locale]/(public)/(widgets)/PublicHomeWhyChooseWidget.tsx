import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  PiArrowRightBold,
  PiCheckCircleFill,
  PiShieldCheckFill
} from 'react-icons/pi';

const whyChoose = [
  'Designed for School Success: Not general AI — tuned for curriculum subjects.',
  'Always Available: 24/7 learning companion at home or on the go.',
  'Safe & Secure: Child-safe filters and parent monitoring features.',
  'Real Results: Faster learning, improved confidence, better grades.',
  'Fun Experience: No pressure — students learn at their own pace.'
];

export function PublicHomeWhyChooseWidget() {
  const t = useTranslations('PublicHomeWhyChooseWidget');
  return (
    <section id="why-choose-us" className="relative py-20 lg:py-28 bg-slate-950 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[150px] -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[150px] translate-y-1/2 translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="flex flex-col gap-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-white text-sm font-bold tracking-tight">
              <PiShieldCheckFill className="text-brand-primary" />
              <span>{t('badge')}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
              {t('title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.raw('items').map((item: string, idx: number) => (
              <div
                key={idx}
                className="group relative rounded-[2rem] border border-white/5 bg-white/5 p-8 backdrop-blur-md hover:bg-white/10 hover:border-white/10 transition-all duration-500"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-brand-primary group-hover:bg-brand-primary group-hover:text-slate-950 transition-all duration-300">
                    <PiCheckCircleFill className="text-2xl" />
                  </div>
                  <p className="text-lg text-slate-300 leading-relaxed font-medium">{item}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-slate-950 text-xl font-black shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95"
            >
              {t('cta')}
              <PiArrowRightBold />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

