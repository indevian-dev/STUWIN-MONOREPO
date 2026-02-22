import { getS3Url } from '@/lib/utils/Uploader.S3.util';
import { PublicSingleProviderWidget } from '@/app/[locale]/(public)/providers/(widgets)/PublicSingleProvider.widget';
import { PublicRelatedProvidersWidget } from '@/app/[locale]/(public)/providers/(widgets)/PublicRelatedProviders.widget';
import { PublicBreadCrumbsTile } from '@/app/[locale]/(public)/(tiles)/PublicBreadCrumbs.tile';
import { db, ORGANIZATIONS } from '@/lib/database';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { sql } from 'drizzle-orm';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
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
    const database = db;
    const orgRecordId = id.includes(':') ? id : `${ORGANIZATIONS}:${id}`;

    // Using sql template tag for raw query as it was before, but via Drizzle execute
    const query = sql.raw(`SELECT * FROM ${ORGANIZATIONS} WHERE id = '${orgRecordId}' AND isActive = true AND isApproved = true AND isPlatform = false LIMIT 1`);
    const result = await database.execute(query);
    const Provider = result[0];

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
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/providers/${id}`,
      ...(Provider.logo && {
        images: [{
          url: getS3Url(`providers/${Provider.id}/${Provider.logo}`)
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
    { label: 'Təhsil təşkilatları', href: '/providers' },
    { label: Provider.title || 'Təhsil təşkilatı', href: `/providers/${id}` }
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

