'use client';

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import Image from 'next/image';
import { isValidSlimId } from '@/lib/utils/Helper.SlimUlid.util';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
interface BlogContent {
  content?: string;
}

interface BlogTitle {
  content?: string;
}

interface Blog {
  id?: string;
  cover?: string;
  title?: BlogTitle;
  content?: BlogContent;
}

export default function PublicSingleBlogWidget() {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [content, setContent] = useState("");
  const params = useParams();
  const slug_id = params?.id ? String(params.id) : "";
  const parts = slug_id.split("-");
  const blog_id = parts[parts.length - 1];

  useEffect(() => {
    async function fetchBlog() {
      if (!blog_id || !isValidSlimId(blog_id)) return;

      try {
        const response = await fetchApiUtil<any>({
          method: 'GET',
          url: '/api/blogs/' + blog_id,
          params: {},
          body: {}
        });

        if (response && !response.error) {
          setBlog(response.blog || null);
          setContent(response.blog?.content?.content || "");
        }
      } catch (error) {
        ConsoleLogger.error('Error fetching blog:', error);
      }
    }
    fetchBlog();
  }, [blog_id]);

  return (
    <section className='w-full flex flex-wrap justify-center'>
      <div className="w-1/2  flex flex-wrap justify-center max-w-screen-md my-20 text-white shadow-md rounded-app">
        <div className=' relative w-full  p-20'>
          <Image className='' style={{ objectFit: 'cover' }} src={blog?.cover ? `${process.env.NEXT_PUBLIC_BLOG_COVER_URL_PREFIX + '/' + blog?.id + '/' + blog.cover}` : '/pg.webp'} fill alt={blog?.title?.content ? blog.title?.content : 'Blog title'} />
        </div>
        <h1 className="text-black w-full text-start  p-5 text-xl font-bold mb-4">{blog?.title?.content}</h1>

        <div className='w-full text-black p-5' dangerouslySetInnerHTML={{ __html: blog?.content?.content ? blog.content.content : '' }}>
        </div>
      </div>
    </section>


  );
}