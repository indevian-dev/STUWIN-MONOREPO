"use client";

import {
    useState,
    useEffect
} from 'react';
import Image
    from 'next/image';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import supabase
    from '@/lib/integrations/supabase/public-role.client';

interface RulesData {
    cover?: string;
    title?: string;
    content?: string;
}

export function PublicRulesWidget() {
    const [rules, setRules] = useState<RulesData>({});

    useEffect(() => {
        async function fetchRules() {
            try {
                const { data, error } = await supabase
                    .from('pages') // Assuming your table is named 'privacy'
                    .select('*')
                    .eq('type', 'RULES')
                    .single(); // Use `.single()` if you're expecting a single row

                if (error) {
                    throw new Error('Network response was not ok');
                }

                setRules(data);
            } catch (error) {
                ConsoleLogger.error('Fetch error:', error);
            }
        }

        fetchRules();
    }, []);

    return (
        <section className='w-full flex flex-wrap justify-center'>
            <div className='container max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8'>
                <div className="w-full flex flex-wrap justify-center text-white shadow-md rounded-md">
                    {rules.cover && (
                        <div className='relative w-full p-20'>
                            <Image
                                src={rules.cover}
                                alt={rules.title || 'Rules title'}
                                layout='fill'
                                objectFit='cover'
                            />
                        </div>
                    )}
                    <article className='w-full text-black p-5 prose-sm' dangerouslySetInnerHTML={{ __html: rules.content || '' }}>
                    </article>
                </div>
            </div>
        </section>
    );
}
