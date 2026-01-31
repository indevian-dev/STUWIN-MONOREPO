'use client'

import { useTranslations } from 'next-intl';
import {
  PiUser,
  PiEnvelope,
  PiPhone,
  PiCalendar,
  PiMapPin,
  PiBook,
  PiChartLine,
  PiClock
} from 'react-icons/pi';
import type { User } from '@/types';

interface ProviderStudentDetailWidgetProps {
  student: User.PrivateAccess;
  onUpdate?: () => void;
}

export function ProviderStudentDetailWidget({
  student,
  onUpdate
}: ProviderStudentDetailWidgetProps) {
  const t = useTranslations('ProviderStudents');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Information */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2 mb-4">
            <PiUser className="text-brand" />
            {t('basic_information')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('full_name')}
              </label>
              <p className="text-dark font-medium">{student.fullName || t('not_provided')}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('status')}
              </label>
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {t('active')}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('email')}
              </label>
              <p className="text-dark">{student.email || t('not_provided')}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('phone')}
              </label>
              <p className="text-dark">{student.phone || t('not_provided')}</p>
            </div>

          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-dark flex items-center gap-2 mb-4">
            <PiBook className="text-brand" />
            {t('academic_information')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('enrollment_date')}
              </label>
              {/* <p className="text-dark">
                {student.enrollment_date ? formatDate(student.enrollment_date) : t('not_provided')}
              </p> */}
            </div>

          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4">
            <PiMapPin className="text-brand" />
            {t('contact_details')}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('address')}
              </label>
              {
                /* <p className="text-dark text-sm">
                  {student.address || t('not_provided')}
                </p> */
              }
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('emergency_contact')}
              </label>
              {/* <p className="text-dark text-sm">
                {student.emergency_contact || t('not_provided')}
              </p> */
              }
            </div>
          </div>
        </div>


        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-dark flex items-center gap-2 mb-4">
            <PiClock className="text-brand" />
            {t('account_info')}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-600">
                {t('member_since')}
              </label>
              <p className="text-dark text-sm">
                {formatDate(student.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




