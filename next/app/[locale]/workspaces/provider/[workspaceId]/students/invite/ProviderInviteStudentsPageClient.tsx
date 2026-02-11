'use client'

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { toast } from 'react-toastify';
import { PiArrowLeft, PiEnvelope } from 'react-icons/pi';
import { Link } from '@/i18n/routing';
import { ProviderInviteStudentsWidget } from './(widgets)/ProviderInviteStudentsWidget';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
export default function ProviderInviteStudentsPageClient() {
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderStudents');

  const handleInvite = async (invitationData: any) => {
    try {
      setSending(true);
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/provider/${workspaceId}/students/invite`,
        body: invitationData,
      });

      if (response.status === 200) {
        toast.success(t('invitations_sent_successfully'));
        router.push(`/workspaces/provider/${workspaceId}/students`);
      } else {
        toast.error(t('error_sending_invitations'));
      }
    } catch (error) {
      ConsoleLogger.error('Error sending invitations:', error);
      toast.error(t('error_sending_invitations'));
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    router.push(`/workspaces/provider/${workspaceId}/students`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/workspaces/provider/${workspaceId}/students`}
          className="p-2 text-neutral-600 hover:text-brand hover:bg-brand/10 rounded-md transition-colors"
        >
          <PiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-dark flex items-center gap-2">
            <PiEnvelope className="text-brand" />
            {t('invite_students')}
          </h1>
          <p className="text-neutral-600 mt-1">
            {t('invite_students_description')}
          </p>
        </div>
      </div>

      <ProviderInviteStudentsWidget
        onInvite={handleInvite}
        onCancel={handleCancel}
        sending={sending}
      />
    </div>
  );
}




