"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

interface TermsData {
    cover?: string;
    title?: string;
    content?: string;
}

export function PublicTermsWidget() {
    const [terms, setTerms] = useState<TermsData>({});
    const locale = useLocale();

    useEffect(() => {
        async function fetchTerms() {
            try {
                const res = await fetch(`/api/docs?type=terms`);
                const data = await res.json();

                if (data.success && data.doc) {
                    const localized = data.doc.localizedContent[locale] || {};
                    setTerms({
                        title: localized.title,
                        content: localized.content,
                        cover: data.doc.cover
                    });
                }
            } catch (error) {
                ConsoleLogger.error("Failed to fetch terms content", error);
            }
        }

        fetchTerms();
    }, [locale]);

    return (
        <section className='w-full flex flex-wrap justify-center'>
            <div className='container max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8'>
                <div className="w-full flex flex-wrap justify-center text-white shadow-md rounded-md">
                    {terms.cover && (
                        <div className='relative w-full p-20'>
                            <Image
                                src={terms.cover}
                                alt={terms.title || 'Terms title'}
                                layout='fill'
                                objectFit='cover'
                            />
                        </div>
                    )}
                    <article className='w-full text-black p-5 prose-sm' dangerouslySetInnerHTML={{ __html: terms.content || '' }}>
                    </article>
                </div>
            </div>
        </section>
    );
}
