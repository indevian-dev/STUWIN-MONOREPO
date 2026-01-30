import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { PiBookBookmarkFill } from 'react-icons/pi';

type SummaryMode = {
  title: string;
  body: string;
};

export function PublicHomeSummariesWidget() {
  const t = useTranslations('PublicHomeSummariesWidget');
  const summaryModes = t.raw('items') as SummaryMode[];

  return (
    <section id="summaries" className="relative py-20 lg:py-28 bg-slate-50/50">
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.1fr_1fr] items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950 text-white text-sm font-bold tracking-tight shadow-xl">
                <PiBookBookmarkFill className="text-lg" />
                <span>{t('section_hint')}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 leading-[1.1] tracking-tight">
                {t('title')}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                {t('body')}
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative space-y-4">
                <p className="text-xl font-black text-slate-900 tracking-tight">{t('modes_intro_title')}</p>
                <p className="text-base text-slate-500 leading-relaxed font-medium">
                  {t('modes_intro_body')}
                </p>
                <div className="pt-4">
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-8 py-4 text-white font-bold shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
                  >
                    {t('cta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {summaryModes.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500"
              >
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/5 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-300">
                    <span className="text-xl font-black">{idx + 1}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-slate-950 tracking-tight">{item.title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

