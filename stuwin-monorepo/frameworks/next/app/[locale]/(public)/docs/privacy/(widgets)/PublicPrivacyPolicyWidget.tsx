import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import Image
    from 'next/image';
import { ModuleFactory } from '@/lib/app-core-modules/factory';

// Cache the data fetching function to prevent redundant queries
const getPrivacyData = cache(async (locale: string) => {
    try {
        const modules = new ModuleFactory({} as any);
        const result = await modules.content.getPage('privacy');

        if (!result.success || !result.data) {
            ConsoleLogger.error('Error fetching privacy policy:', result.error);
            return null;
        }

        const data = result.data;
        // Select content based on localizedContent structure
        const localized = (data.localizedContent as any) || {};
        const activeData = localized[locale] || localized['en'] || Object.values(localized)[0] || {};

        return {
            ...data,
            title: activeData.title || 'Privacy Policy',
            content: activeData.content || '',
            metaDescription: activeData.metaDescription || activeData.meta_description || 'Privacy policy and data protection information.',
            cover: activeData.cover || null
        };
    } catch (error) {
        ConsoleLogger.error('Error fetching privacy policy:', error);
        return null;
    }
});

// Generate dynamic metadata for SEO
export async function generateMetadata() {
    const locale = await getLocale();
    const privacy = await getPrivacyData(locale);

    if (!privacy) {
        return {
            title: 'Privacy Policy Not Found',
            description: 'Privacy policy could not be loaded.'
        };
    }

    return {
        title: privacy.title || 'Privacy Policy',
        description: privacy.metaDescription,
        openGraph: {
            title: privacy.title,
            description: privacy.metaDescription,
            locale,
        },
    };
}

export async function PublicPrivacyPolicyWidget() {
    const locale = await getLocale();
    const privacy = await getPrivacyData(locale);

    // Return 404 if privacy policy not found
    if (!privacy) {
        notFound();
    }

    return (
        <section className='w-full flex flex-wrap justify-center'>
            <div className='container max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8'>
                <div className="w-full flex flex-wrap justify-center text-white shadow-md rounded-md">
                    {privacy.cover && (
                        <div className='relative w-full p-20'>
                            <Image
                                src={privacy.cover}
                                alt={privacy.title || 'Privacy Policy'}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <article className='w-full text-black p-5 prose-sm' dangerouslySetInnerHTML={{ __html: privacy.content || '' }}>
                    </article>
                </div>
            </div>
        </section>
    );
}
