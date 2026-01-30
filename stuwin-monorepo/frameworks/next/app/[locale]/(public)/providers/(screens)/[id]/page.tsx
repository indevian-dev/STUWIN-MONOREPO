import { PublicSingleProviderWidget } from '@/app/[locale]/(public)/Providers/(widgets)/PublicSingleProviderWidget';
import { PublicRelatedProvidersWidget } from '@/app/[locale]/(public)/Providers/(widgets)/PublicRelatedProvidersWidget';
import { PublicBreadCrumbsTile } from '@/app/[locale]/(public)/(tiles)/PublicBreadCrumbsTile';
import { db, ORGANIZATIONS } from '@/lib/app-infrastructure/database';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface PageParams {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

interface ProviderLocation {
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ProviderData {
  id: string;
  title: string | null;
  logo: string | null;
  description?: string | null;
  is_active?: boolean | null;
  location?: ProviderLocation | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

// Server-side data fetching
async function getProviderData(id: string): Promise<ProviderData | null> {
  try {
    const database = await db();
    const orgRecordId = id.includes(':') ? id : `${ORGANIZATIONS}:${id}`;
    const [Provider] = await database.query(
      `SELECT * FROM ${ORGANIZATIONS}
       WHERE id = $orgId AND isActive = true AND isApproved = true AND isPlatform = false
       LIMIT 1`,
      { orgId: orgRecordId }
    );

    if (!Provider) return null;

    // Transform the database result to match our type
    return {
      id: Provider.id,
      title: Provider.name,
      logo: Provider.logo,
      description: Provider.description,
      is_active: Provider.isActive,
      location: (Provider.location as ProviderLocation | null) ?? null,
      phone: Provider.contactPhone,
      email: Provider.contactEmail,
      website: Provider.website,
    } as ProviderData;
  } catch (error) {
    ConsoleLogger.error('Error fetching Provider:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id, locale } = await params;
  const Provider = await getProviderData(id);

  if (!Provider) {
    return {
      title: 'Təhsil Təşkilatı Tapılmadı',
      description: 'Axtardığınız təhsil təşkilatı tapılmadı.'
    };
  }

  return {
    title: Provider.title || 'Təhsil Təşkilatı',
    description: Provider.description || `${Provider.title || 'Təhsil təşkilatı'} haqqında məlumat`,
    openGraph: {
      title: Provider.title || 'Təhsil Təşkilatı',
      description: Provider.description || `${Provider.title || 'Təhsil təşkilatı'} haqqında məlumat`,
      type: 'website',
      locale: locale,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/Providers/${id}`,
      ...(Provider.logo && {
        images: [{
          url: `https://s3.tebi.io/stuwin.ai/Providers/${Provider.id}/${Provider.logo}`
        }]
      })
    },
  };
}

export default async function PublicSingleProviderPage({ params }: PageParams) {
  const { id } = await params;
  const Provider = await getProviderData(id);

  if (!Provider) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Ana səhifə', href: '/' },
    { label: 'Təhsil təşkilatları', href: '/Providers' },
    { label: Provider.title || 'Təhsil təşkilatı', href: `/Providers/${id}` }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <PublicBreadCrumbsTile breadcrumbs={breadcrumbs} />

        {/* Single Provider Widget */}
        <PublicSingleProviderWidget Provider={Provider} />

        {/* Related Providers */}
        <div className="mt-8">
          <PublicRelatedProvidersWidget currentProviderId={Provider.id} limit={6} />
        </div>
      </div>
    </div>
  );
}

