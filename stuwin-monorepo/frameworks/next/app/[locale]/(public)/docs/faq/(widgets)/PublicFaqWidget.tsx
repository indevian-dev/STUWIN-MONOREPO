"use client";

import {
    useState,
    useEffect
} from 'react';
import { useLocale } from 'next-intl';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import Image
    from 'next/image';
import supabase
    from '@/lib/integrations/supabasePublicRoleClient';

interface FaqPageData {
    cover?: string;
    title?: string;
    content?: string;
}

export  function PublicFaqPolicyWidget() {
    const [faq, setFaq] = useState<FaqPageData>({});
    const locale = useLocale();

    useEffect(() => {
        async function fetchFaq() {
            try {
                const { data, error } = await supabase
                    .from('pages')
                    .select('*')
                    .eq('type', 'FAQ')
                    .single();

                if (error) {
                    ConsoleLogger.error('error', error);
                    return;
                }

                setFaq(data);
            } catch (error) {
                ConsoleLogger.error(error);
            }
        }

        fetchFaq();
    }, [locale]);

    return (
        <section className='w-full flex flex-wrap justify-center'>
            <div className='container max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8'>
                <div className="w-full flex flex-wrap justify-center text-white shadow-md rounded-md">
                    {faq.cover && (
                        <div className='relative w-full p-20'>
                            <Image
                                src={faq.cover}
                                alt={faq.title || 'Rules title'}
                                layout='fill'
                                objectFit='cover'
                            />
                        </div>
                    )}
                    <article className='w-full text-black p-5 prose-sm' dangerouslySetInnerHTML={{ __html: faq.content || '' }}>
                    </article>
                </div>
            </div>
        </section>
    );
}
