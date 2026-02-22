import { PublicProviderApplicationFormWidget } from '@/app/[locale]/(public)/providers/(widgets)/PublicProviderApplicationForm.widget';
import { PublicScreenTitleTile } from '@/app/[locale]/(public)/(tiles)/PublicScreenTitle.tile';
import { PublicBreadCrumbsTile } from '@/app/[locale]/(public)/(tiles)/PublicBreadCrumbs.tile';
import type { Metadata } from 'next';

interface PageParams {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Təhsil Təşkilatı Müraciəti',
    description: 'Təhsil təşkilatınızı platformamıza əlavə edin',
    openGraph: {
      title: 'Təhsil Təşkilatı Müraciəti',
      description: 'Təhsil təşkilatınızı platformamıza əlavə edin',
      type: 'website',
      locale: locale,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/providers/apply`,
    },
  };
}

export default function PublicProviderApplicationPage() {
  const breadcrumbs = [
    { label: 'Ana səhifə', href: '/' },
    { label: 'Təhsil təşkilatları', href: '/Providers' },
    { label: 'Müraciət', href: '/providers/apply' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Breadcrumbs */}
        <PublicBreadCrumbsTile breadcrumbs={breadcrumbs} />

        {/* Page Title */}
        <div className="my-6">
          <PublicScreenTitleTile
            screenTitle="Təhsil Təşkilatı Müraciəti"
          />
          <p className="text-center text-gray-600 mt-4">
            Təşkilatınızı platformamıza əlavə etmək üçün forma doldurun
          </p>
        </div>

        {/* Application Form */}
        <PublicProviderApplicationFormWidget />

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-app p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Müraciət prosesi
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <span>Formu doldurun və göndərin</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span>Müraciətiniz qeydə alınacaq və yoxlanılacaq</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span>24-48 saat ərzində sizinlə əlaqə saxlanılacaq</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <span>Təsdiq edildikdən sonra təşkilatınız platformada görünəcək</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

