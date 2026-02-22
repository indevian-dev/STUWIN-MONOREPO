'use client'

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { toast } from 'react-toastify';
import { ProviderOrganizationWidget } from './(widgets)/ProviderOrganization.widget';
import { ProviderOrganizationEditWidget } from './(widgets)/ProviderOrganizationEdit.widget';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { PiPencilSimple, PiX } from 'react-icons/pi';
import type { Provider } from '@stuwin/shared/types/domain/Domain.types';

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
      const data = await fetchApiUtil<Provider.PrivateAccess>({
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

      // Map flat UpdateInput fields into { title, profile } shape for the API
      const { title, description, email, phone, website, logo, location, ...rest } = updateData;
      const profilePayload: Record<string, unknown> = {};

      if (description !== undefined) profilePayload.providerProgramDescription = description;
      if (email !== undefined) profilePayload.email = email;
      if (phone !== undefined) profilePayload.phone = phone;
      if (website !== undefined) profilePayload.website = website;
      if (logo !== undefined) profilePayload.logo = logo;
      if (location !== undefined) profilePayload.location = location;

      // Pass through any extra metadata fields (pricing, features, etc.)
      Object.assign(profilePayload, rest);

      await fetchApiUtil<any>({
        method: 'PUT',
        url: `/api/workspaces/provider/${workspaceId}/organization/update`,
        body: {
          ...(title !== undefined ? { title } : {}),
          profile: profilePayload,
        },
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
        <h1 className="text-3xl font-bold text-app-dark-blue dark:text-white">
          {t('organization_details')}
        </h1>
        {organization && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-app-primary transition-colors ${isEditing
              ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              : 'bg-app-bright-green text-white hover:bg-app-bright-green/80'
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
