import { Link } from '@/i18n/routing';
import { PiFilePdf, PiArrowRightBold } from 'react-icons/pi';
import { useTranslations } from 'next-intl';

export function PdfToolButtonTile() {
  const t = useTranslations('PdfToolButtonTile');
  const features = t.raw('features');

  return (
    <section id="pdf-tools" className="w-full my-6 lg:my-10">
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur rounded-2xl border border-slate-100 shadow-lg px-6 py-8 md:px-10 md:py-12">
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="flex items-center gap-3">
            <PiFilePdf className="text-2xl text-red-500" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t('header')}</h2>
          </div>
          <p className="text-base md:text-lg text-slate-700 leading-relaxed">
            {t('description')}
          </p>
          <div className="grid gap-3 md:gap-4">
            {features.map((feature: string, idx: number) => {
              const icons = [
                <PiFilePdf className="mt-1 text-red-500" />,
                <PiFilePdf className="mt-1 text-purple-500" />,
                <PiFilePdf className="mt-1 text-blue-500" />
              ];
              return (
                <div key={idx} className="flex items-start gap-3 text-slate-800">
                  {icons[idx]}
                  <span className="leading-relaxed">{feature}</span>
                </div>
              );
            })}
          </div>
          <div>
            <Link
              href="/pdf-tool"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow hover:-translate-y-0.5 transition transform duration-150"
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