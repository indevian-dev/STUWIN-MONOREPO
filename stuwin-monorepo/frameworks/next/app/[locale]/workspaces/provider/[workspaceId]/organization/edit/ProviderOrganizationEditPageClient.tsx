'use client'

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { toast } from 'react-toastify';
import { ProviderOrganizationEditWidget } from '../(widgets)/ProviderOrganizationEditWidget';
import type { Provider } from '@/types/resources';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
export default function ProviderOrganizationEditPageClient() {
  const [organization, setOrganization] = useState<Provider.PrivateAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderOrganization');

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/organization`,
      });

      if (response.status === 200) {
        setOrganization(response.data.organization);
      } else {
        toast.error(t('error_loading_organization'));
        router.push(`/workspaces/provider/${workspaceId}/organization`);
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching organization:', error);
      toast.error(t('error_loading_organization'));
      router.push(`/workspaces/provider/${workspaceId}/organization`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedOrganization: Partial<Provider.PrivateAccess>) => {
    try {
      setSaving(true);
      const response = await apiCallForSpaHelper({
        method: 'PUT',
        url: `/api/workspaces/provider/${workspaceId}/organization/update`,
        body: updatedOrganization,
      });

      if (response.status === 200) {
        toast.success(t('organization_updated'));
        router.push(`/workspaces/provider/${workspaceId}/organization`);
      } else {
        toast.error(t('error_updating_organization'));
      }
    } catch (error) {
      ConsoleLogger.error('Error updating organization:', error);
      toast.error(t('error_updating_organization'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/workspaces/provider/${workspaceId}/organization`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">{t('organization_not_found')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark">
          {t('edit_organization')}
        </h1>
        <p className="text-neutral-600 mt-2">
          {t('edit_organization_description')}
        </p>
      </div>

      <ProviderOrganizationEditWidget
        organization={organization}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </div>
  );
}




