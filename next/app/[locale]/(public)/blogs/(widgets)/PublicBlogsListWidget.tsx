'use client';

import {
    useEffect,
    useState
} from 'react';
import { useTranslations } from 'next-intl';
import Link
    from 'next/link';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import Image
    from 'next/image';

interface BlogTitle {
    content?: string;
}

interface Blog {
    id: number;
    slug: string;
    cover?: string;
    title?: BlogTitle;
}

export default function PublicBlogsListWidget() {
    const [blogsList, setBlogsList] = useState<Blog[]>([]);
    const t = useTranslations();

    useEffect(() => {
        async function fetchBlogs() {
            try {
                const response = await apiCallForSpaHelper({
                    method: 'GET',
                    url: '/api/blogs',
                    params: {
                        page: '1',
                        limit: '12'
                    }
                });

                if (response.data && !response.data.error) {
                    setBlogsList(response.data.blogs || []);
                }

            } catch (error) {
                ConsoleLogger.log(error);
            }
        }

        fetchBlogs();
    }, []);

    return (
        <section className="bg-white text-sm text-black grid grid-cols-12 py-20 justify-start items">
            {blogsList.map((blog) => (
                <Link key={blog.id} href={'/blogs/' + blog.slug + '-' + blog.id} className='p-5 col-span-6 w-full'>
                    <div className="w-full grid grid-cols-12">
                        <div className="relative flex col-span-12 flex-col w-full p-20 justify-center items-start px-6 tracking-wide">
                            <Image className='rounded-2xl' style={{ objectFit: 'cover' }} src={blog?.cover ? `${process.env.NEXT_PUBLIC_BLOG_COVER_URL_PREFIX + '/' + blog?.id + '/' + blog.cover}` : '/pg.webp'} fill alt={blog?.title?.content ? blog.title?.content : 'Blog title'} />
                        </div>
                        <div className="flex col-span-12 flex-col w-full justify-center items-start py-6 tracking-wide">
                            <p>{blog.title?.content}</p>
                        </div>
                    </div>
                </Link>

            ))}
        </section>
    )
}
