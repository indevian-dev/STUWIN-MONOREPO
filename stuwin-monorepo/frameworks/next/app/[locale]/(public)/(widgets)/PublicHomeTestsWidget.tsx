import { useTranslations } from 'next-intl';
import { PiClipboardTextFill } from 'react-icons/pi';

type TestTool = {
  title: string;
  body: string;
};

type Sidebar = {
  ready: string;
  title: string;
  hint: string;
  focus_label: string;
  focus_topics: string;
  questions_label: string;
  questions_value: string;
  modes_label: string;
  modes_value: string;
  note: string;
};

export function PublicHomeTestsWidget() {
  const t = useTranslations('PublicHomeTestsWidget');
  const testTools = t.raw('items') as TestTool[];
  const sidebar = t.raw('sidebar') as Sidebar;

  return (
    <section id="tests" className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[150px] translate-y-1/2 translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="space-y-10 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950 text-white text-sm font-bold tracking-tight shadow-xl">
                <PiClipboardTextFill className="text-lg" />
                <span>{t('section_hint')}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 leading-[1.1] tracking-tight">
                {t('title')}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                {t('body')}
              </p>
            </div>

            <div className="grid gap-6">
              {testTools.map((item, idx) => (
                <div
                  key={item.title}
                  className="group relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/5 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-300">
                      <span className="text-xl font-black">{idx + 1}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-slate-950 tracking-tight">{item.title}</p>
                      <p className="text-base text-slate-500 leading-relaxed font-medium">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="absolute -inset-10 bg-linear-to-br from-brand/20 via-slate-100 to-indigo-100 blur-[100px] opacity-60" />
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 shadow-2xl border border-white/10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/20 blur-[60px]" />

              <div className="relative space-y-8">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-brand-primary text-[10px] font-black uppercase tracking-widest">
                    {sidebar.ready}
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    {sidebar.title}
                  </h3>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed font-medium">{sidebar.hint}</p>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-5 group hover:bg-white/10 transition-colors">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{sidebar.focus_label}</p>
                    <p className="text-lg font-black text-white mt-1">{sidebar.focus_topics}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-5 group hover:bg-white/10 transition-colors">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{sidebar.questions_label}</p>
                      <p className="text-xl font-black text-white mt-1">{sidebar.questions_value}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-5 group hover:bg-white/10 transition-colors">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{sidebar.modes_label}</p>
                      <p className="text-xl font-black text-white mt-1">{sidebar.modes_value}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="text-sm text-slate-400 italic leading-relaxed">
                    "{sidebar.note}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

