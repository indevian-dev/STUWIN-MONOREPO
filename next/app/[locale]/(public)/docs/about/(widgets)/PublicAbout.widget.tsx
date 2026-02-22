"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
interface AboutPageData {
    cover?: string;
    title?: string;
    content?: string;
}

export function PublicAboutWidget() {
    const [about, setAbout] = useState<AboutPageData>({});
    const locale = useLocale();

    useEffect(() => {
        async function fetchAbout() {
            try {
                const res = await fetch(`/api/docs?type=about`);
                const data = await res.json();

                if (data.success && data.doc) {
                    const localized = data.doc.localizedContent[locale] || {};
                    setAbout({
                        title: localized.title,
                        content: localized.content,
                        cover: data.doc.cover
                    });
                }
            } catch (error) {
                ConsoleLogger.error("Failed to fetch about content", error);
            }
        }

        fetchAbout();
    }, [locale]);

    return (
        <section className='w-full flex flex-wrap justify-center'>
            <div className='container max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8'>
                <div className="w-full flex flex-wrap justify-center text-white shadow-md rounded-app">
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
