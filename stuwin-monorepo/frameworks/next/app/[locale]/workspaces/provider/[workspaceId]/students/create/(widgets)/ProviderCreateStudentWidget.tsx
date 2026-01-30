'use client'

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PiUser, PiEnvelope, PiPhone, PiMapPin, PiBook, PiCalendar } from 'react-icons/pi';

interface ProviderCreateStudentWidgetProps {
  onCreate: (studentData: any) => void;
  onCancel: () => void;
  saving: boolean;
}

export function ProviderCreateStudentWidget({
  onCreate,
  onCancel,
  saving
}: ProviderCreateStudentWidgetProps) {
  const t = useTranslations('ProviderStudents');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    grade_level: '',
    enrollment_date: '',
    address: '',
    emergency_contact: '',
    special_needs: '',
    send_invitation: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
              <PiUser className="text-brand" />
              {t('basic_information')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('full_name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <PiEnvelope className="inline mr-1" />
                  {t('email')} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  required
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
                  {t('date_of_birth')}
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('gender')}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">{t('select_gender')}</option>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
              <PiBook className="text-brand" />
              {t('academic_information')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('grade_level')} *
                </label>
                <select
                  value={formData.grade_level}
                  onChange={(e) => handleInputChange('grade_level', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  required
                >
                  <option value="">{t('select_grade')}</option>
                  <option value="kindergarten">{t('kindergarten')}</option>
                  <option value="1">{t('grade')} 1</option>
                  <option value="2">{t('grade')} 2</option>
                  <option value="3">{t('grade')} 3</option>
                  <option value="4">{t('grade')} 4</option>
                  <option value="5">{t('grade')} 5</option>
                  <option value="6">{t('grade')} 6</option>
                  <option value="7">{t('grade')} 7</option>
                  <option value="8">{t('grade')} 8</option>
                  <option value="9">{t('grade')} 9</option>
                  <option value="10">{t('grade')} 10</option>
                  <option value="11">{t('grade')} 11</option>
                  <option value="12">{t('grade')} 12</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <PiCalendar className="inline mr-1" />
                  {t('enrollment_date')} *
                </label>
                <input
                  type="date"
                  value={formData.enrollment_date}
                  onChange={(e) => handleInputChange('enrollment_date', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('special_needs')}
                </label>
                <textarea
                  value={formData.special_needs}
                  onChange={(e) => handleInputChange('special_needs', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder={t('special_needs_placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
              <PiMapPin className="text-brand" />
              {t('contact_information')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('emergency_contact')}
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder={t('emergency_contact_placeholder')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Send Invitation Checkbox */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.send_invitation}
              onChange={(e) => handleInputChange('send_invitation', e.target.checked)}
              className="w-4 h-4 text-brand border-neutral-300 rounded focus:ring-brand"
            />
            <span className="text-sm text-neutral-700">
              {t('send_invitation_email')}
            </span>
          </label>
          <p className="text-xs text-neutral-500 mt-1">
            {t('send_invitation_description')}
          </p>
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
            {saving ? t('creating') : t('create_student')}
          </button>
        </div>
      </div>
    </form>
  );
}




