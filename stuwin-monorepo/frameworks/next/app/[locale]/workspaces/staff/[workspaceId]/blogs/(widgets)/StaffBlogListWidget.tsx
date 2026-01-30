"use client";

import {
  useEffect,
  useState
} from 'react';
import Link
  from 'next/link';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useRouter } from 'next/navigation';
import Image
  from 'next/image';
import { StaffSwitchButtonTile } from '../../(tiles)/StaffSwitchButtonTile';
import { toast } from 'react-toastify';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface Blog {
  id: number;
  title?: { content: string };
  cover?: string;
  published: boolean;
  home_page: boolean;
}

export default function StaffBlogListWidget() {
  const [blogsList, setblogsList] = useState<Blog[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();


  useEffect(() => {
    async function fetchblogs() {
      try {
        const response = await apiCallForSpaHelper({
          method: 'GET',
          url: '/api/workspaces/staff/blogs'
        });

        if (response.status !== 200) {
          ConsoleLogger.log('error', response.data);
          return;
        }

        setblogsList(response.data.blogs || []);

      } catch (error) {
        ConsoleLogger.log(error);
      }
    }

    fetchblogs();
  }, []);

  const handleDelete = async (blogId: number) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      setIsDeleting(true);
      const response = await apiCallForSpaHelper({
        method: 'DELETE',
        url: `/api/workspaces/staff/blogs/delete/${blogId}`
      });

      setIsDeleting(false);

      if (response.status === 200) {
        setblogsList((prevblogs) =>
          prevblogs.filter((blog) => blog.id !== blogId));
        toast.success('Blog Deleted!');
        return;
      }

      ConsoleLogger.log('Failed to delete blog');
      toast.error('Failed to delete blog');
    }
  };

  const isPublished = (blog: Blog) => {
    return blog.published === true;
  };

  const handlePublishToggle = async (blog: Blog) => {
    try {
      const response = await apiCallForSpaHelper({
        method: 'PATCH',
        url: `/api/workspaces/staff/blogs/publish/${blog.id}`,
        body: JSON.stringify({ published: !isPublished(blog) })
      });

      if (response.status === 200) {
        toast.success('Blog publish status updated!');
        // Update the local state
        setblogsList((prevblogs) =>
          prevblogs.map((prevblog) =>
            prevblog.id === blog.id ? { ...prevblog, published: !prevblog.published } : prevblog
          )
        );
        return;
      }

      ConsoleLogger.log('error', response.data);
      toast.error('Failed to update blog status');

    } catch (error) {
      ConsoleLogger.log(error);
      toast.error('Failed to update blog status');
    }
  };

  const isHomePage = (blog: Blog) => {
    return blog.home_page === true;
  };

  const handleHomePageToggle = async (blog: Blog) => {
    try {
      const response = await apiCallForSpaHelper({
        method: 'PATCH',
        url: `/api/workspaces/staff/blogs/homepage/${blog.id}`,
        body: JSON.stringify({ home_page: !isHomePage(blog) })
      });

      if (response.status === 200) {
        toast.success('Blog homepage status updated!');
        // Update the local state
        setblogsList((prevblogs) =>
          prevblogs.map((prevblog) =>
            prevblog.id === blog.id ? { ...prevblog, home_page: !prevblog.home_page } : prevblog
          )
        );
        return;
      }

      ConsoleLogger.log('error', response.data);
      toast.error('Failed to update homepage status');

    } catch (error) {
      ConsoleLogger.log(error);
      toast.error('Failed to update homepage status');
    }
  };

  return (
    <section className="bg-gray-200 text-sm text-black flex flex-wrap  justify-start items">
      <Link href="/admin/blogs/create" className='p-5 w-full'>
        <button className='bg-emerald-500 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded'>Create blog</button>
      </Link>
      <div className="w-full px-6 grid grid-cols-11 my-5">
        <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
          <p>id</p>
        </div>
        <div className="flex col-span-5 flex-col w-full justify-center items-start px-6 tracking-wide">
          <p>title</p>
        </div>
        <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
          <p>Photo</p>
        </div>
        <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
          <p>Publish</p>
        </div>
        <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
          <p>HomePage</p>
        </div>
        <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
          <p>Edit</p>
        </div>
        <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
          <p>Delete</p>
        </div>
      </div>
      {blogsList.map((blog) => (
        <div key={blog.id} className="w-full px-6 grid grid-cols-11">
          <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
            <p>{blog.id}</p>
          </div>
          <div className="flex col-span-5 flex-col w-full justify-center items-start px-6 tracking-wide">
            <p>{blog.title?.content}</p>
          </div>
          <div className="flex relative col-span-1 py-10 flex-col w-full justify-center items-start px-6 tracking-wide">
            <Image className='rounded-2xl' style={{ objectFit: 'cover' }} src={blog?.cover ? `${process.env.NEXT_PUBLIC_BLOG_COVER_URL_PREFIX + '/' + blog?.id + '/' + blog?.cover}` : '/pg.webp'} width={150} height={150} alt={blog?.title?.content || 'blog title'} />
          </div>
          <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
            <StaffSwitchButtonTile checked={isPublished(blog)} onChange={() => handlePublishToggle(blog)} />
          </div>
          <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
            <StaffSwitchButtonTile checked={isHomePage(blog)} onChange={() => handleHomePageToggle(blog)} />
          </div>
          <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
            <button>
              <Link href={`/admin/blogs/${blog.id}/edit`}>
                Edit
              </Link>
            </button>
          </div>
          <div className="flex col-span-1 flex-col w-full justify-center items-start px-6 tracking-wide">
            <button onClick={() => handleDelete(blog.id)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>          </div>
        </div>
      ))}
    </section>
  )
}
