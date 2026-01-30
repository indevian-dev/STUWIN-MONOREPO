"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import supabase from '@/lib/integrations/supabasePublicRoleClient';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface AboutPageData {
    cover?: string;
    title?: string;
    content?: string;
}

export  function PublicAboutWidget() {
    const [about, setAbout] = useState<AboutPageData>({});
    const locale = useLocale();

    useEffect(() => {
        async function fetchAbout() {
            try {
                const { data, error } = await supabase
                    .from('pages') // Assuming your table is named 'about'
                    .select('*')
                    .eq('type', 'ABOUT')
                    .single(); // Use `.single()` if you're expecting a single row

                if (error) {
                    ConsoleLogger.error('error', error);
                    return;
                }

                setAbout(data);
            } catch (error) {
                ConsoleLogger.error(error);
            }
        }

        fetchAbout();
    }, [locale]);

    return (
        <section className='w-full flex flex-wrap justify-center'>
            <div className='container max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8'>
                <div className="w-full flex flex-wrap justify-center text-white shadow-md rounded-md">
                    {about.cover && (
                        <div className='relative w-full p-20'>
                            <Image
                                src={about.cover}
                                alt={about.title || 'Rules title'}
                                layout='fill'
                                objectFit='cover'
                            />
                        </div>
                    )}
                    <article className='w-full text-black p-5 prose-sm' dangerouslySetInnerHTML={{ __html: about.content || '' }}>
                    </article>
                </div>
            </div>
        </section>
    );
}
