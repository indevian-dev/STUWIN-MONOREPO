import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import Image
    from 'next/image';
import supabase
    from '@/lib/integrations/supabasePublicRoleClient';

// Cache the data fetching function to prevent redundant queries
const getPrivacyData = cache(async (locale: string) => {
    try {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('type', 'PRIVACY')
            .single();

        if (error) {
            ConsoleLogger.error('Error fetching privacy policy:', error);
            return null;
        }

        // Select content based on locale
        let content = '';
        switch (locale) {
            case 'az':
                content = data.content_az || data.content_en || '';
                break;
            case 'ru':
                content = data.content_ru || data.content_en || '';
                break;
            case 'en':
            default:
                content = data.content_en || data.content_az || '';
                break;
        }

        return {
            ...data,
            content: content
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
        description: privacy.meta_description || 'Privacy policy and data protection information.',
        openGraph: {
            title: privacy.title || 'Privacy Policy',
            description: privacy.meta_description || 'Privacy policy and data protection information.',
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
