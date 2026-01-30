import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  PiArrowRightBold,
  PiLightningFill,
  PiMagicWandFill,
  PiNotebookFill,
  PiShieldCheckFill
} from 'react-icons/pi';

const accentIcons = [
  PiLightningFill,
  PiMagicWandFill,
  PiNotebookFill,
  PiShieldCheckFill
];

type Step = {
  title: string;
  body: string;
};

type Stat = {
  label: string;
  value: string;
};

export function PublicHomeHowItWorksWidget() {
  const t = useTranslations('PublicHomeHowItWorksWidget');
  const steps = t.raw('steps') as Step[];
  const stats = t.raw('stats') as Stat[];

  return (
    <section id="how-it-works" className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-900 text-sm font-bold tracking-tight">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                {t('badge')}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 leading-[1.1] tracking-tight">
                {t('title')}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                {t('body')}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {steps.map((step, idx) => {
                const Icon = accentIcons[idx % accentIcons.length];
                return (
                  <div
                    key={step.title}
                    className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/5 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-300">
                        <Icon className="text-2xl" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-slate-950 tracking-tight">{step.title}</p>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">{step.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative lg:pl-10">
            <div className="absolute -inset-10 bg-linear-to-br from-brand/20 via-slate-100 to-brand-primary/10 blur-[100px] opacity-50" />
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 shadow-2xl border border-white/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-[60px]" />

              <div className="relative space-y-8">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-brand-primary text-[10px] font-black uppercase tracking-widest">
                    {t('card_subtitle')}
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    {t('card_title')}
                  </h3>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  {t('card_body')}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="group rounded-2xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition-colors">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{stat.label}</p>
                      <p className="text-xl font-black text-white mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link
                    href="/signup"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-slate-950 font-bold shadow-lg hover:bg-slate-100 transition-all active:scale-95"
                  >
                    {t('cta_primary')}
                    <PiArrowRightBold />
                  </Link>
                  <Link
                    href="/docs/about"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-white font-bold hover:bg-white/10 transition-all active:scale-95"
                  >
                    {t('cta_secondary')}
                  </Link>
                </div>

                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                  {t('disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

