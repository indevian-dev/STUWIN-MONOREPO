'use client'

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  PiBuilding,
  PiMapPin,
  PiPhone,
  PiEnvelope,
  PiGlobe,
  PiCurrencyDollar,
  PiFloppyDisk,
} from 'react-icons/pi';
import type { Provider } from '@stuwin/shared/types/domain';

interface ProviderOrganizationEditWidgetProps {
  organization: Provider.PrivateAccess;
  onSave: (data: Partial<Provider.UpdateInput>) => void;
  onCancel: () => void;
  saving: boolean;
}

export function ProviderOrganizationEditWidget({
  organization,
  onSave,
  onCancel,
  saving,
}: ProviderOrganizationEditWidgetProps) {
  const t = useTranslations('ProviderOrganization');

  const [title, setTitle] = useState(organization.title || '');
  const [description, setDescription] = useState(organization.description || '');
  const [email, setEmail] = useState(organization.email || '');
  const [phone, setPhone] = useState(organization.phone || '');
  const [website, setWebsite] = useState(organization.website || '');
  const [logo, setLogo] = useState(organization.logo || '');
  const [city, setCity] = useState(organization.location?.city || '');
  const [address, setAddress] = useState(organization.location?.address || '');
  const [price, setPrice] = useState<string>(
    (organization.metadata?.providerSubscriptionPrice != null) ? String(organization.metadata.providerSubscriptionPrice) : ''
  );
  const [period, setPeriod] = useState<'month' | 'year'>(organization.metadata?.providerSubscriptionPeriod || 'month');
  const [trialDays, setTrialDays] = useState<string>(
    (organization.metadata?.providerTrialDaysCount != null) ? String(organization.metadata.providerTrialDaysCount) : ''
  );
  const [currency, setCurrency] = useState(organization.metadata?.currency || 'AZN');
  const [featuresText, setFeaturesText] = useState((organization.metadata?.features as string[] || []).join('\n'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const features = featuresText
      .split('\n')
      .map((f: string) => f.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      logo: logo.trim() || undefined,
      location: (city.trim() || address.trim())
        ? { city: city.trim() || undefined, address: address.trim() || undefined }
        : undefined,
    });
  };

  const inputClass =
    'w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors';
  const labelClass = 'block text-xs font-medium text-neutral-600 uppercase tracking-wide mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiBuilding className="text-brand text-xl" />
            {t('basic_information')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t('organization_name')} *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>{t('logo')}</label>
              <input
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className={inputClass}
                placeholder={t('logo_url_placeholder')}
              />
              {logo && (
                <div className="mt-2">
                  <img
                    src={logo}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain rounded border border-neutral-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>{t('program_description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder={t('program_description_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiPhone className="text-brand text-xl" />
            {t('contact_information')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                <PiEnvelope className="inline mr-1 text-neutral-400" />
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <PiPhone className="inline mr-1 text-neutral-400" />
                {t('phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <PiGlobe className="inline mr-1 text-neutral-400" />
                {t('website')}
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={inputClass}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiCurrencyDollar className="text-brand text-xl" />
            {t('pricing_information')}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('subscription_price')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('currency')}</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputClass}
                >
                  <option value="AZN">AZN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                  <option value="RUB">RUB</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('subscription_period')}</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'month' | 'year')}
                  className={inputClass}
                >
                  <option value="month">{t('month')}</option>
                  <option value="year">{t('year')}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('trial_days')}</label>
                <input
                  type="number"
                  min="0"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('features')}</label>
              <textarea
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder={t('features_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <PiMapPin className="text-brand text-xl" />
            {t('location_information')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t('city')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t('address')}</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder={t('address_placeholder')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-5 py-2.5 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-md hover:bg-brand/80 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PiFloppyDisk size={16} />
          {saving ? t('saving') : t('save_changes')}
        </button>
      </div>
    </form>
  );
}
