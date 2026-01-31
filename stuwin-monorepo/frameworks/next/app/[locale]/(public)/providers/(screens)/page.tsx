import { PublicProvidersListWidget } from '@/app/[locale]/(public)/providers/(widgets)/PublicProvidersListWidget';
import { PublicScreenTitleTile } from '@/app/[locale]/(public)/(tiles)/PublicScreenTitleTile';
import { PublicBreadCrumbsTile } from '@/app/[locale]/(public)/(tiles)/PublicBreadCrumbsTile';
import { db } from '@/lib/app-infrastructure/database';
import { workspaces } from '@/lib/app-infrastructure/database/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type { Metadata } from 'next';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface PageParams {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

// Server-side data fetching
async function getProviders(page = 1, pageSize = 24) {
  try {
    const offset = (page - 1) * pageSize;

    // Filter by active workspaces. 
    // Adapting to available schema: workspaces table.
    // Assuming relevant types are not 'student' or 'parent' if we want organizations.
    // For now showing all active workspaces to ensure data visibility, filters can be refined.
    const whereClause = and(
      eq(workspaces.isActive, true)
    );

    const ProvidersList = await db.select().from(workspaces)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(workspaces.createdAt));

    const countResult = await db.select({ total: count() })
      .from(workspaces)
      .where(whereClause);

    const total = countResult[0]?.total || 0;

    // Map to Provider interface
    const mappedProviders = ProvidersList.map(w => ({
      id: w.id,
      createdAt: w.createdAt || new Date(),
      title: w.title || 'Untitled',
      description: (w.metadata as any)?.description || null,
      logo: (w.metadata as any)?.avatarUrl || null,
      isActive: w.isActive || false,
      isApproved: true,
      location: (w.metadata as any)?.location || null,
      phone: (w.metadata as any)?.phone || null,
      email: (w.metadata as any)?.email || null,
      website: (w.metadata as any)?.website || null,
      accountId: w.ownerAccountId
    }));

    return {
      Providers: mappedProviders,
      total
    };
  } catch (error) {
    ConsoleLogger.error('Error fetching Providers:', error);
    return {
      Providers: [],
      total: 0
    };
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Təhsil Təşkilatları',
    description: 'Azərbaycanda fəaliyyət göstərən təhsil təşkilatları',
    openGraph: {
      title: 'Təhsil Təşkilatları',
      description: 'Azərbaycanda fəaliyyət göstərən təhsil təşkilatları',
      type: 'website',
      locale: locale,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/providers`,
    },
  };
}

export default async function PublicProvidersPage({ searchParams }: PageParams) {
  const params = await searchParams;
  const page = parseInt(params?.page || '1', 10);
  const { Providers, total } = await getProviders(page);

  const breadcrumbs = [
    { label: 'Ana səhifə', href: '/' },
    { label: 'Təhsil təşkilatları', href: '/providers' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumbs */}
        <PublicBreadCrumbsTile breadcrumbs={breadcrumbs} />

        {/* Page Title */}
        <div className="my-6">
          <PublicScreenTitleTile
            screenTitle="Təhsil Təşkilatları"
          />
          <p className="text-center text-gray-600 mt-4">
            {total} təşkilat tapıldı
          </p>
        </div>

        {/* Providers List */}
        <PublicProvidersListWidget
          initialProviders={Providers as any}
          page={page}
          pageSize={24}
        />
      </div>
    </div>
  );
}

