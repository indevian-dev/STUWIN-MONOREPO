"use client";

import {
  FormEvent,
  useState
} from 'react';
import { toast } from 'react-toastify';
import { useRouter, useParams } from 'next/navigation';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import Editor from '@/app/[locale]/(global)/(widgets)/GlobalRichTextEditorWidget';

export default function StaffBlogCreateWidget() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [localizedContent, setLocalizedContent] = useState<any>({
    az: { title: '', content: '' },
    en: { title: '', content: '' },
    ru: { title: '', content: '' }
  });
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    // Basic validation
    const hasTitle = Object.values(localizedContent).some((l: any) => l.title?.trim());
    if (!hasTitle) {
      toast.error("Please provide at least one localized title");
      return;
    }

    setSaving(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/staff/${workspaceId}/blogs`,
        body: {
          localizedContent,
          isActive: true,
          isFeatured: false
        },
      });

      if (response.status !== 200 && response.status !== 201) {
        toast.error(`Error: ${response.data?.error || 'Failed to create blog'}`);
        return;
      }

      toast.success('Blog Created!');
      router.push(`/workspaces/staff/${workspaceId}/blogs`);
    } catch (error) {
      toast.error('An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-8 my-10 mx-5 text-gray-900 bg-white shadow-xl rounded-xl border border-gray-100">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create New Blog Post</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the localized content for your new blog post</p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:transform active:scale-95 transition-all shadow-md shadow-indigo-500/20 disabled:bg-gray-400 disabled:shadow-none flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : 'Create Blog'}
          </button>
        </div>
      </div>

      <div className="w-full">
        <Editor
          isLocalized={true}
          initialContent={localizedContent}
          onChange={setLocalizedContent}
          height="600px"
        />
      </div>
    </div>
  );
}