'use client'

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { toast } from 'react-toastify';
import { ProviderOrganizationEditWidget } from '../(widgets)/ProviderOrganizationEditWidget';
import type { Provider } from '@stuwin/shared/types/domain';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
export default function ProviderOrganizationEditPageClient() {
  const [organization, setOrganization] = useState<Provider.PrivateAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderOrganization');


  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const response = await apiCall<any>({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/organization`,
      });

      setOrganization(response.organization);
    } catch (error) {
      ConsoleLogger.error('Error fetching organization:', error);
      toast.error(t('error_loading_organization'));
      router.push(`/workspaces/provider/${workspaceId}/organization`);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchOrganization();
  }, []);


  const handleSave = async (updatedOrganization: Partial<Provider.UpdateInput>) => {
    try {
      setSaving(true);
      const response = await apiCall<any>({
        method: 'PUT',
        url: `/api/workspaces/provider/${workspaceId}/organization/update`,
        body: updatedOrganization,
      });

      toast.success(t('organization_updated'));
      router.push(`/workspaces/provider/${workspaceId}/organization`);
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

  if (loading) return <GlobalLoaderTile />;

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




