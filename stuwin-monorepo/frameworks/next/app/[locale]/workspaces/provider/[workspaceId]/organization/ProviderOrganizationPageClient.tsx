'use client'

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { toast } from 'react-toastify';
import { Link } from '@/i18n/routing';
import { ProviderOrganizationWidget } from './(widgets)/ProviderOrganizationWidget';
import type { Provider } from '@/types/resources';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
export default function ProviderOrganizationPageClient() {
  const [organization, setOrganization] = useState<Provider.PrivateAccess | null>(null);
  const [loading, setLoading] = useState(true);
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
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching organization:', error);
      toast.error(t('error_loading_organization'));
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading) return <GlobalLoaderTile />;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark">
          {t('organization_details')}
        </h1>
        <Link
          href={`/workspaces/provider/${workspaceId}/organization/edit`}
          className="bg-brand text-white px-4 py-2 rounded-primary hover:bg-brand/80 transition-colors"
        >
          {t('edit_organization')}
        </Link>
      </div>

      {organization ? (
        <ProviderOrganizationWidget
          organization={organization}
          onUpdate={fetchOrganization}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-600">{t('no_organization_found')}</p>
        </div>
      )}
    </div>
  );
}




