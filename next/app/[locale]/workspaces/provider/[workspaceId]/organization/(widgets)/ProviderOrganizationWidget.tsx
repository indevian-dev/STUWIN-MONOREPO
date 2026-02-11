'use client'

import { useTranslations } from 'next-intl';
import { PiBuilding, PiMapPin, PiPhone, PiEnvelope, PiGlobe, PiUsers } from 'react-icons/pi';
import type { Provider } from '@/types/domain';

interface ProviderOrganizationWidgetProps {
  organization: Provider.PrivateAccess;
  onUpdate?: () => void;
}

export function ProviderOrganizationWidget({
  organization,
  onUpdate
}: ProviderOrganizationWidgetProps) {
  const t = useTranslations('ProviderOrganization');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
            <PiBuilding className="text-brand" />
            {t('basic_information')}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('organization_name')}
              </label>
              <p className="text-dark font-medium">{organization.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('organization_type')}
              </label>
              <p className="text-dark">{organization.tenantType}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('description')}
              </label>
              <p className="text-dark">{organization.description || t('no_description')}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
            <PiPhone className="text-brand" />
            {t('contact_information')}
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PiEnvelope className="text-neutral-500" />
              <div>
                <label className="text-sm font-medium text-neutral-600">
                  {t('email')}
                </label>
                <p className="text-dark">{organization.email || t('not_provided')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PiPhone className="text-neutral-500" />
              <div>
                <label className="text-sm font-medium text-neutral-600">
                  {t('phone')}
                </label>
                <p className="text-dark">{organization.phone || t('not_provided')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PiGlobe className="text-neutral-500" />
              <div>
                <label className="text-sm font-medium text-neutral-600">
                  {t('website')}
                </label>
                <p className="text-dark">
                  {organization.website ? (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {organization.website}
                    </a>
                  ) : (
                    t('not_provided')
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
            <PiMapPin className="text-brand" />
            {t('address_information')}
          </h2>

          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-600">
                  {t('country')}
                </label>
                <p className="text-dark">{organization.location?.country || t('not_provided')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-600">
                  {t('city')}
                </label>
                <p className="text-dark">{organization.location?.city || t('not_provided')}</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-neutral-600">
                  {t('address')}
                </label>
                <p className="text-dark">{organization.location?.address || t('not_provided')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
            <PiUsers className="text-brand" />
            {t('organization_statistics')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-brand/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand">
                {organization.totalStudents || 0}
              </div>
              <div className="text-sm text-neutral-600">{t('total_students')}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {organization.totalStaff || 0}
              </div>
              <div className="text-sm text-neutral-600">{t('total_staff')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




