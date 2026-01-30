import { Link } from '@/i18n/routing';
import {
  PiArrowRightBold,
  PiCheckCircleFill
} from 'react-icons/pi';
import { IconType } from 'react-icons';

type HomeSectionCardProps = {
  icon?: IconType;
  title: string;
  body: string;
  items: string[];
  ctaText?: string;
  ctaHref: string;
  id: string;
};

export function PublicHomeSectionCard({
  icon: Icon,
  title,
  body,
  items,
  ctaText,
  ctaHref,
  id
}: HomeSectionCardProps) {
  return (
    <section id={id} className="w-full my-6 lg:my-10">
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur rounded-2xl border border-slate-100 shadow-lg px-6 py-8 md:px-10 md:py-12">
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="text-2xl text-brand" />}
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">{title}</h2>
          </div>
          <p className="text-base md:text-lg text-slate-700 leading-relaxed">{body}</p>
          <div className="grid gap-3 md:gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-slate-800">
                <PiCheckCircleFill className="mt-1 text-brand" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
          {ctaText && (
            <div>
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-white font-semibold shadow hover:-translate-y-0.5 transition transform duration-150"
              >
                {ctaText}
                <PiArrowRightBold />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

