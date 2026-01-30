"use client";

import { useState, FormEvent, useEffect, useRef } from 'react';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { Subject } from '@/types/resources/subjects';
import { ApiResponse } from '@/types';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
const Editor = dynamic(() => import('@/app/[locale]/workspaces/staff/[workspaceId]/ui/editor'), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>
});

interface ProviderTopicAddModalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProviderTopicAddModalWidget({
  isOpen,
  onClose,
  onSuccess
}: ProviderTopicAddModalWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [name, setName] = useState<string>('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject.PrivateAccess[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  const fetchSubjects = async (): Promise<void> => {
    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/provider/${workspaceId}/subjects`,
      params: {}
    }) as ApiResponse<{ subjects: Subject.PrivateAccess[] }>;

    if ('data' in response && response.data && !Array.isArray(response.data)) {
      setSubjects(response.data.subjects);
    }
  };

  const handleEditorChange = (content: string) => {
    setBody(content);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/provider/${workspaceId}/topics/create`,
        params: {},
        body: {
          name,
          ...(body && { body }),
          ...(aiSummary && { ai_summary: aiSummary }),
          ...(gradeLevel && { grade_level: parseInt(gradeLevel) }),
          ...(subjectId && { subject_id: subjectId })
        }
      });

      if (response.status === 200 || response.status === 201) {
        // Reset form
        setName('');
        setAiSummary('');
        setBody('');
        setGradeLevel('');
        setSubjectId('');

        // Notify parent and close
        onSuccess?.();
        onClose();
      } else {
        setError(response.data?.error || 'Failed to create topic');
      }
    } catch (err) {
      ConsoleLogger.error('Error creating topic:', err);
      setError('Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setAiSummary('');
      setBody('');
      setGradeLevel('');
      setSubjectId('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-90 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded w-full max-w-4xl shadow-xl my-8">
        <h2 className="text-2xl font-bold mb-4">Add New Topic</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Topic Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter topic name"
            />
          </div>

          {/* Subject Selector */}
          <div>
            <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              id="subjectId"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level Input */}
          <div>
            <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level
            </label>
            <input
              type="number"
              id="gradeLevel"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              min="1"
              max="12"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter grade level (1-12)"
            />
          </div>

          {/* AI Summary Textarea */}
          <div>
            <label htmlFor="aiSummary" className="block text-sm font-medium text-gray-700 mb-1">
              AI Summary
            </label>
            <textarea
              id="aiSummary"
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a short AI-generated summary of the topic"
            />
          </div>

          {/* Body Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic Content
            </label>
            <div className="border border-gray-300 rounded">
              <Editor
                ref={editorRef}
                onChange={handleEditorChange}
                placeholder="Enter the full topic content (5000-10000 words)..."
                height="500px"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded text-gray-700 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Topic'}
          </button>
        </div>
      </form>
    </div>
  );
}

