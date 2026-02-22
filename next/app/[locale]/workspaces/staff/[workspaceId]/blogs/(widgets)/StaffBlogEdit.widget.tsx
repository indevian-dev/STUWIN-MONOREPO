"use client";

import {
  FormEvent,
  useState,
  useEffect
} from 'react';
import { toast } from 'react-toastify';
import { useRouter, useParams } from 'next/navigation';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import Image from 'next/image';
import Editor from '@/app/[locale]/(global)/(widgets)/GlobalRichTextEditor.widget';
import { GlobalImagePlaceholderTile } from '@/app/[locale]/(global)/(tiles)/GlobalImagePlaceholder.tile';

interface Blog {
  id: string;
  localizedContent: any;
  cover?: string;
  isActive: boolean;
  isFeatured: boolean;
}

export default function StaffBlogEditWidget() {
  const params = useParams();
  const blogId = params?.blogId as string;
  const workspaceId = params?.workspaceId as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [localizedContent, setLocalizedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!blogId || !workspaceId) return;

    async function fetchBlog() {
      try {
        const response = await fetchApiUtil<any>({
          method: 'GET',
          url: `/api/workspaces/staff/${workspaceId}/blogs/${blogId}`
        });

        // apiCall throws on error — no manual status check needed

        const data = response;
        setBlog(data.blog);
        setLocalizedContent(data.blog.localizedContent || {});
      } catch (error) {
        ConsoleLogger.log(error);
        toast.error("An error occurred while fetching the blog");
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [blogId, workspaceId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!blogId || !workspaceId) return;

    setSaving(true);
    try {
      const response = await fetchApiUtil<any>({
        method: 'PUT',
        url: `/api/workspaces/staff/${workspaceId}/blogs/update/${blogId}`,
        body: {
          localizedContent,
          isActive: blog?.isActive,
          isFeatured: blog?.isFeatured
        }
      });

      // apiCall throws on error — no manual status check needed

      toast.success('Blog Updated!');
      router.push(`/workspaces/staff/${workspaceId}/blogs`);
    } catch (error) {
      toast.error('An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !blogId || !workspaceId) return;

    try {
      const formDataCover = new FormData();
      formDataCover.append('cover', file);
      const response = await fetchApiUtil<any>({
        method: 'POST',
        url: `/api/workspaces/staff/${workspaceId}/blogs/update/${blogId}/cover`,
        body: formDataCover
      });

      // apiCall throws on error — no manual status check needed
      setBlog(response.blog);
      toast.success("Cover image updated");
    } catch (error) {
      ConsoleLogger.log(error);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 my-10 mx-5 bg-white shadow-md rounded-app animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-1/4 mb-8"></div>
        <div className="h-[600px] bg-gray-50 rounded"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 my-10 mx-5 text-gray-900 bg-white shadow-xl rounded-app border border-gray-100">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Blog Post</h1>
          <p className="text-gray-500 text-sm mt-1">ID: {blogId}</p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-app hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-app hover:bg-indigo-700 active:transform active:scale-95 transition-all shadow-md shadow-indigo-500/20 disabled:bg-gray-400 disabled:shadow-none flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-app-full animate-spin"></div>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Editor
            isLocalized={true}
            initialContent={localizedContent}
            onChange={setLocalizedContent}
            height="700px"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-app border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-app-full"></span>
              Settings
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={blog?.isActive}
                  onChange={(e) => setBlog(b => b ? { ...b, isActive: e.target.checked } : null)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700 group-hover:text-indigo-600 transition-colors">Published</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={blog?.isFeatured}
                  onChange={(e) => setBlog(b => b ? { ...b, isFeatured: e.target.checked } : null)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700 group-hover:text-indigo-600 transition-colors">Featured Post</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-app border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-app-full"></span>
              Cover Image
            </h3>

            <div className="relative aspect-video bg-black/5 dark:bg-white/5 rounded-app overflow-hidden mb-4 group">
              {blog?.cover ? (
                <Image
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  src={`${process.env.NEXT_PUBLIC_BLOG_COVER_URL_PREFIX + '/' + blog?.id + '/' + blog?.cover}`}
                  fill
                  alt="Blog cover"
                />
              ) : (
                <GlobalImagePlaceholderTile
                  error
                  errorLabel="No cover yet"
                  shimmer={false}
                  aspect=""
                  className="absolute inset-0 h-full w-full"
                />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-app border border-white/30 cursor-pointer hover:bg-white/30 transition-all">
                  Change Image
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                  />
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center italic">Recommended: 1200x630px</p>
          </div>
        </div>
      </div>
    </div>
  );
}