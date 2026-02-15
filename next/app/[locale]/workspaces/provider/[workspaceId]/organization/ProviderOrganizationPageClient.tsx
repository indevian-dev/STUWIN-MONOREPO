'use client'

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { toast } from 'react-toastify';
import { ProviderOrganizationWidget } from './(widgets)/ProviderOrganizationWidget';
import { ProviderOrganizationEditWidget } from './(widgets)/ProviderOrganizationEditWidget';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import { PiPencilSimple, PiX } from 'react-icons/pi';
import type { Provider } from '@stuwin/shared/types/domain';

export default function ProviderOrganizationPageClient() {
  const [organization, setOrganization] = useState<Provider.PrivateAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderOrganization');

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const data = await apiCall<Provider.PrivateAccess>({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/organization`,
      });
      setOrganization(data);
    } catch (error) {
      ConsoleLogger.error('Error fetching organization:', error);
      toast.error(t('error_loading_organization'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (updateData: Partial<Provider.UpdateInput>) => {
    try {
      setSaving(true);
      await apiCall({
        method: 'PUT',
        url: `/api/workspaces/provider/${workspaceId}/organization/update`,
        body: updateData,
      });

      toast.success(t('save_success'));
      setIsEditing(false);
      // Refetch fresh data
      await fetchOrganization();
    } catch (error) {
      ConsoleLogger.error('Error saving organization:', error);
      toast.error(t('error_saving_organization'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <GlobalLoaderTile />;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark">
          {t('organization_details')}
        </h1>
        {organization && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-primary transition-colors ${isEditing
              ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              : 'bg-brand text-white hover:bg-brand/80'
              }`}
          >
            {isEditing ? (
              <>
                <PiX size={18} />
                {t('cancel')}
              </>
            ) : (
              <>
                <PiPencilSimple size={18} />
                {t('edit_organization')}
              </>
            )}
          </button>
        )}
      </div>

      {organization ? (
        isEditing ? (
          <ProviderOrganizationEditWidget
            organization={organization}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            saving={saving}
          />
        ) : (
          <ProviderOrganizationWidget organization={organization} />
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-600">{t('no_organization_found')}</p>
        </div>
      )}
    </div>
  );
}
