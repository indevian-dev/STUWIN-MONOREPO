"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';

import { ConsoleLogger } from '@/lib/logging/Console.logger';

interface FaqPageData {
    cover?: string;
    title?: string;
    content?: string;
}

export function PublicFaqWidget() {
    const [faq, setFaq] = useState<FaqPageData>({});
    const locale = useLocale();

    useEffect(() => {
        async function fetchFaq() {
            try {
                const res = await fetch(`/api/docs?type=faq`);
                const data = await res.json();

                if (data.success && data.doc) {
                    const localized = data.doc.localizedContent[locale] || {};
                    setFaq({
                        title: localized.title,
                        content: localized.content,
                        cover: data.doc.cover
                    });
                }
            } catch (error) {
                ConsoleLogger.error("Failed to fetch FAQ content", error);
            }
        }

        fetchFaq();
    }, [locale]);

    return (
        <section className='w-full flex flex-wrap justify-center'>
            <div className='container max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8'>
                <div className="w-full flex flex-wrap justify-center text-white shadow-md rounded-app">
                    {faq.cover && (
                        <div className='relative w-full p-20'>
                            <Image
                                src={faq.cover}
                                alt={faq.title || 'FAQ title'}
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
