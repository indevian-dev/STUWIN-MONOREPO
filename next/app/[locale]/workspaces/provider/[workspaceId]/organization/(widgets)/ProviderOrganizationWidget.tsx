'use client'

import { useTranslations } from 'next-intl';
import {
  PiBuilding,
  PiMapPin,
  PiPhone,
  PiEnvelope,
  PiGlobe,
  PiCurrencyDollar,
  PiCalendar,
  PiStar,
  PiCheckCircle,
  PiXCircle,
} from 'react-icons/pi';
import type { Provider } from '@stuwin/shared/types/domain';

interface ProviderOrganizationWidgetProps {
  organization: Provider.PrivateAccess;
}

export function ProviderOrganizationWidget({ organization }: ProviderOrganizationWidgetProps) {
  const t = useTranslations('ProviderOrganization');
  const m = organization.metadata;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${organization.isActive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
        {organization.isActive ? (
          <PiCheckCircle className="text-green-600 text-xl" />
        ) : (
          <PiXCircle className="text-red-600 text-xl" />
        )}
        <div>
          <span className="font-medium text-sm">
            {t('status')}: {organization.isActive ? t('active') : t('inactive')}
          </span>
          <span className="text-neutral-500 text-sm ml-4">
            {t('created_at')}: {new Date(organization.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiBuilding className="text-brand text-xl" />
            {t('basic_information')}
          </h2>

          <div className="space-y-4">
            {organization.logo && (
              <div className="flex justify-center mb-4">
                <img
                  src={organization.logo}
                  alt={organization.title}
                  className="w-24 h-24 object-contain rounded-lg border border-neutral-200"
                />
              </div>
            )}

            <InfoRow label={t('organization_name')} value={organization.title} />
            <InfoRow
              label={t('program_description')}
              value={organization.description || t('no_description')}
              multiline
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiPhone className="text-brand text-xl" />
            {t('contact_information')}
          </h2>

          <div className="space-y-4">
            <InfoRowWithIcon
              icon={<PiEnvelope className="text-neutral-400" />}
              label={t('email')}
              value={organization.email}
              fallback={t('not_provided')}
            />
            <InfoRowWithIcon
              icon={<PiPhone className="text-neutral-400" />}
              label={t('phone')}
              value={organization.phone}
              fallback={t('not_provided')}
            />
            <InfoRowWithIcon
              icon={<PiGlobe className="text-neutral-400" />}
              label={t('website')}
              value={organization.website}
              fallback={t('not_provided')}
              isLink
            />
          </div>
        </div>

        {/* Pricing & Subscription */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiCurrencyDollar className="text-brand text-xl" />
            {t('pricing_information')}
          </h2>

          <div className="space-y-4">
            <InfoRow
              label={t('subscription_price')}
              value={
                m?.providerSubscriptionPrice != null
                  ? `${m.providerSubscriptionPrice} ${m.currency || 'AZN'}`
                  : t('not_provided')
              }
            />
            <InfoRowWithIcon
              icon={<PiCalendar className="text-neutral-400" />}
              label={t('subscription_period')}
              value={m?.providerSubscriptionPeriod ? t(m.providerSubscriptionPeriod) : undefined}
              fallback={t('not_provided')}
            />
            <InfoRow
              label={t('trial_days')}
              value={m?.providerTrialDaysCount != null ? `${m.providerTrialDaysCount}` : t('not_provided')}
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiMapPin className="text-brand text-xl" />
            {t('location_information')}
          </h2>

          <div className="space-y-4">
            <InfoRow label={t('city')} value={organization.location?.city || t('not_provided')} />
            <InfoRow label={t('address')} value={organization.location?.address || t('not_provided')} multiline />
          </div>
        </div>
      </div>

      {/* Features */}
      {m?.features && (m.features as string[]).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiStar className="text-brand text-xl" />
            {t('features')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {(m.features as string[]).map((feature, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-brand/5 text-brand border border-brand/10"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable sub-components ──

function InfoRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</label>
      <p className={`text-dark mt-0.5 ${multiline ? 'whitespace-pre-line' : 'font-medium'}`}>{value}</p>
    </div>
  );
}

function InfoRowWithIcon({
  icon,
  label,
  value,
  fallback,
  isLink,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  fallback: string;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 text-lg">{icon}</span>
      <div>
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</label>
        {value ? (
          isLink ? (
            <a
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand hover:underline mt-0.5"
            >
              {value}
            </a>
          ) : (
            <p className="text-dark font-medium mt-0.5">{value}</p>
          )
        ) : (
          <p className="text-neutral-400 mt-0.5">{fallback}</p>
        )}
      </div>
    </div>
  );
}
