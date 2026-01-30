"use client";

import {
  FormEvent,
  useState,
  useEffect
} from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import Image
  from 'next/image';
import Editor
  from '@/app/[locale]/workspaces/staff/[workspaceId]/ui/editor';

interface Blog {
  id: number;
  title?: { content: string };
  meta_title?: { content: string };
  description?: { content: string };
  meta_description?: { content: string };
  content?: { content: string };
  cover?: string;
}

interface StaffBlogEditWidgetProps {
  params: Promise<{ blogId: string; locale: string }>;
}

export default function StaffBlogEditWidget({ params }: StaffBlogEditWidgetProps) {

  const [blog, setBlog] = useState<Blog | null>(null);
  const [content, setContent] = useState<string>("");
  const [blogId, setBlogId] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    params.then((resolvedParams) => {
      setBlogId(resolvedParams.blogId);
    });
  }, [params]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    switch (name) {
      case 'title':
        setBlog((prevState) => {
          if (!prevState) return prevState;
          return {
            ...prevState,
            title: {
              ...prevState.title,
              content: value,
            },
          };
        });
        break;
      case 'meta_title':
        setBlog((prevState) => {
          if (!prevState) return prevState;
          return {
            ...prevState,
            meta_title: {
              ...prevState.meta_title,
              content: value,
            },
          };
        });
        break;
      default:
        break;
    }
  };

  const handleInputTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    switch (name) {
      case 'name':
        break;
      case 'description':
        setBlog((prevState) => {
          if (!prevState) return prevState;
          return {
            ...prevState,
            description: {
              content: value,
            },
          };
        });
        break;
      case 'meta_description':
        setBlog((prevState) => {
          if (!prevState) return prevState;
          return {
            ...prevState,
            meta_description: {
              content: value,
            },
          };
        });
        break;
    }
  };

  useEffect(() => {
    if (!blogId) return;

    async function fetchBlog() {
      try {
        const response = await apiCallForSpaHelper({ method: 'GET', url: '/api/workspaces/staff/blogs/' + blogId });

        if (response.status !== 200) {
          ConsoleLogger.log('error', response.data);
          return;
        }

        const data = response.data;
        setBlog(data.blog);
        setContent(data.blog.content.content);

      } catch (error) {
        ConsoleLogger.log(error);
      }
    }

    fetchBlog();
  }, [blogId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', blog?.title?.content || '');
    formData.append('meta_title', blog?.meta_title?.content || '');
    formData.append('description', blog?.description?.content || '');
    formData.append('meta_description', blog?.meta_description?.content || '');
    formData.append('content', blog?.content?.content || '');


    try {

      const response = await apiCallForSpaHelper({ method: 'PATCH', url: '/api/workspaces/staff/blogs/update/' + blogId, body: formData });


      if (response.status !== 200) {
        toast.error(`Error: ${response.data?.message || 'Update failed'}`);
        return;
      }

      router.push(`/staff/blogs`);

      toast.success('Blog Updated!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error: ' + error.message);
      } else {
        toast.error('An unknown error occurred');
      }
    }
  };


  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formDataCover = new FormData();
      formDataCover.append('cover', file);
      const response = await apiCallForSpaHelper({ method: 'POST', url: '/api/workspaces/staff/blogs/update/' + blogId + '/cover', body: formDataCover });

      if (response.status !== 200) {
        ConsoleLogger.log('error', response.data);
        return;
      }
      setBlog(response.data.blog);
    } catch (error) {
      ConsoleLogger.log(error);
    }
  };

  const handleContentChange = (content: string) => {
    setBlog((prevState) => {
      if (!prevState) return prevState;
      return {
        ...prevState,
        content: {
          content: content,
        },
      };
    });
  };

  const initialConten = content;


  return (
    <div className="px-4 py-8 my-20 mx-5 text-gray-900 bg-white shadow-md rounded-md">
      <h1 className="text-indigo-700 text-xl font-bold mb-4">Create a new blog post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-6 relative flex flex-wrap justify-center">
          <div className='w-full p-20'>
            <Image className='rounded-full' style={{ objectFit: 'cover' }} src={blog?.cover ? `${process.env.NEXT_PUBLIC_BLOG_COVER_URL_PREFIX + '/' + blog?.id + '/' + blog?.cover}` : '/pg.webp'} fill alt={blog?.title?.content || 'Blog title'} />
          </div>

          <label className="absolute rounded-full bottom-0 left-50 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer" htmlFor="avatar">
            Cover Image
          </label>
          <input
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            type="file"
            name="avatar"
            id="avatar"
            accept="image/*"
            onChange={handleCoverChange}
          />
        </div>
        <div>
          <label htmlFor="title" className="text-indigo-700 block font-medium">Title:</label>
          <input
            type="text"
            id="title"
            name='title'
            value={blog?.title?.content || ''}
            onChange={handleInputChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="meta_title" className="text-indigo-700 block font-medium">Meta Title:</label>
          <input
            type="text"
            id="meta_title"
            name='meta_title'
            value={blog?.meta_title?.content || ''}
            onChange={handleInputChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="meta_description" className="text-indigo-700 block font-medium">Meta Description:</label>
          <textarea
            rows={3}
            id="meta_description"
            name='meta_description'
            value={blog?.meta_description?.content || ''}
            onChange={handleInputTextChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="description" className="text-indigo-700 block font-medium">Description:</label>
          <textarea
            rows={3}
            id="description"
            name="description"
            value={blog?.description?.content || ''}
            onChange={handleInputTextChange}
            className="block p-2.5 w-full text-sm text-gray-900 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className='w-full my-5'>
          <Editor onChange={handleContentChange} initialContent={initialConten} />
        </div>
        <button type="submit" className="w-full bg-indigo-800 text-white font-medium py-2 rounded-md hover:bg-indigo-600 transition duration-300">Save</button>
      </form>

    </div>

  );
}