import { useTranslations } from 'next-intl';
import { PiUsersThreeFill } from 'react-icons/pi';

type ParentBenefit = {
  title: string;
  body: string;
};

type Safety = {
  title: string;
  body: string;
  control_label: string;
  control_value: string;
};

export function PublicHomeParentsWidget() {
  const t = useTranslations('PublicHomeParentsWidget');
  const parentBenefits = t.raw('items') as ParentBenefit[];
  const safety = t.raw('safety') as Safety;

  return (
    <section id="parents" className="relative py-20 lg:py-28 bg-slate-50/50">
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.1fr] items-start">
          <div className="space-y-10 lg:sticky lg:top-32">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950 text-white text-sm font-bold tracking-tight shadow-xl">
                <PiUsersThreeFill className="text-lg" />
                <span>{t('section_hint')}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 leading-[1.1] tracking-tight">
                {t('title')}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                {t('body')}
              </p>
            </div>

            <div className="space-y-6">
              <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-500">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col gap-4">
                  <p className="text-sm font-black text-slate-950 uppercase tracking-widest">{safety.title}</p>
                  <p className="text-base text-slate-500 leading-relaxed font-medium">
                    {safety.body}
                  </p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-3xl bg-slate-950 p-6 shadow-2xl border border-white/5">
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-primary/10 blur-3xl translate-y-1/2 -translate-x-1/2" />
                <div className="relative flex flex-col gap-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{safety.control_label}</p>
                  <p className="text-lg font-black text-white tracking-tight">{safety.control_value}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {parentBenefits.map((item, idx) => (
              <div
                key={item.title}
                className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500"
              >
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/5 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-300">
                    <span className="text-xl font-black">{idx + 1}</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xl font-bold text-slate-950 tracking-tight">{item.title}</p>
                    <p className="text-base text-slate-500 leading-relaxed font-medium">{item.body}</p>
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

