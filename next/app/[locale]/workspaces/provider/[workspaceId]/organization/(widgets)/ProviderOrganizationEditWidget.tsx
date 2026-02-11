'use client'

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PiBuilding, PiMapPin, PiPhone, PiEnvelope, PiGlobe } from 'react-icons/pi';
import type { Provider } from '@/types/domain';

interface ProviderOrganizationEditWidgetProps {
  organization: Provider.PrivateAccess;
  onSave: (organization: Partial<Provider.PrivateAccess>) => void;
  onCancel: () => void;
  saving: boolean;
}

export function ProviderOrganizationEditWidget({
  organization,
  onSave,
  onCancel,
  saving
}: ProviderOrganizationEditWidgetProps) {
  const t = useTranslations('ProviderOrganization');
  const [formData, setFormData] = useState({
    title: organization.title || '',
    type: organization.tenantType || '',
    description: organization.description || '',
    email: organization.email || '',
    phone: organization.phone || '',
    website: organization.website || '',
    country: organization.location?.country || '',
    city: organization.location?.city || '',
    address: organization.location?.address || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
            <PiBuilding className="text-brand" />
            {t('basic_information')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('organization_name')} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('organization_type')} *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              >
                <option value="">{t('select_type')}</option>
                <option value="school">{t('school')}</option>
                <option value="university">{t('university')}</option>
                <option value="college">{t('college')}</option>
                <option value="academy">{t('academy')}</option>
                <option value="institute">{t('institute')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder={t('description_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
            <PiPhone className="text-brand" />
            {t('contact_information')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <PiEnvelope className="inline mr-1" />
                {t('email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <PiPhone className="inline mr-1" />
                {t('phone')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <PiGlobe className="inline mr-1" />
                {t('website')}
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
            <PiMapPin className="text-brand" />
            {t('address_information')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('country')}
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('city')}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('address')}
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder={t('address_placeholder')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-neutral-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors"
          disabled={saving}
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-brand text-white rounded-md hover:bg-brand/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saving}
        >
          {saving ? t('saving') : t('save_changes')}
        </button>
      </div>
    </form>
  );
}




